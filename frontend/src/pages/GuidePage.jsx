import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, MessageSquare, ChevronRight, AlertCircle, FileText, AlertTriangle, Upload, Loader2, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

const GETAX_PAGES = [
  {
    id: 'annexe-a',
    name: 'Annexe A - Activité dépendante',
    description: 'Salaires, cotisations sociales, frais professionnels',
    documentTypes: ['certificat-salaire', 'attestation-3a', 'attestation-lpp-rachat', 'facture-formation'],
    fields: [
      { code: '11.10', name: 'Salaires bruts c.A', source: 'Certificat champ 8', dataKey: 'grossSalary' },
      { code: '11.15', name: 'Bonus, gratification c.A', source: 'Certificat', dataKey: 'bonus' },
      { code: '31.10', name: 'Cotisations AVS/AI c.A', source: 'Certificat champ 9', dataKey: 'avsContributions' },
      { code: '31.12', name: 'Cotisations 2e pilier c.A', source: 'Certificat champ 10', dataKey: 'lppContributions' },
      { code: '31.40', name: 'Cotisations 3e pilier A c.A', source: 'Formulaire 21 EDP', dataKey: 'pilier3a', limit: 7056 },
      { code: '31.50', name: 'Forfait frais pro ICC c.A', calculated: true, formula: '3% (min 634, max 1796)' },
      { code: '31.20', name: 'Forfait frais pro IFD c.A', calculated: true, formula: '3% (min 2000, max 4000)' },
    ]
  },
  {
    id: 'annexe-c',
    name: 'Annexe C - Assurances et prévoyance',
    description: 'Primes maladie, assurances-vie, 3ème pilier B',
    documentTypes: ['attestation-maladie', 'attestation-vie', 'facture-garde'],
    fields: [
      { code: '52.21', name: 'Primes assurance-maladie', source: 'Attestation caisse', dataKey: 'healthInsurance', limit: 16207 },
      { code: '52.22', name: 'Primes assurance-accidents', source: 'Attestation', dataKey: 'accidentInsurance' },
      { code: '52.11', name: 'Assurance-vie (primes)', source: 'Attestation', dataKey: 'lifeInsurance' },
      { code: '52.15', name: 'Sous-total ICC assurances', calculated: true, formula: 'Célib: max 2324, Couple: max 3486' },
    ]
  },
  {
    id: 'annexe-d',
    name: 'Annexe D - Fortune immobilière',
    description: 'Valeur locative, frais entretien, hypothèque',
    documentTypes: ['attestation-hypothecaire', 'estimation-immobiliere'],
    fields: [
      { code: '15.10', name: 'Valeur locative brute', source: 'Questionnaire officiel', dataKey: 'rentalValue' },
      { code: '35.10', name: 'Frais entretien forfait ICC', calculated: true, formula: '≤10 ans: 15%, >10 ans: 25%' },
      { code: '35.11', name: 'Frais entretien forfait IFD', calculated: true, formula: '≤10 ans: 10%, >10 ans: 20%' },
      { code: '35.30', name: 'Intérêts hypothécaires', source: 'Relevé banque', dataKey: 'mortgageInterest' },
      { code: '65.10', name: 'Valeur fiscale immeuble', source: 'Estimation officielle', dataKey: 'propertyValue' },
      { code: '65.20', name: 'Dette hypothécaire', source: 'Relevé banque 31.12', dataKey: 'mortgageDebt' },
    ]
  },
  {
    id: 'annexe-f',
    name: 'Annexe F - Fortune mobilière',
    description: 'Comptes bancaires, titres, véhicules',
    documentTypes: ['releve-bancaire', 'etat-titres'],
    fields: [
      { code: '60.10', name: 'Comptes bancaires CH', source: 'Relevés 31.12', dataKey: 'bankAccounts' },
      { code: '60.20', name: 'Comptes bancaires étrangers', source: 'Relevés 31.12', dataKey: 'foreignBankAccounts' },
      { code: '60.30', name: 'Titres cotés', source: 'État des titres', dataKey: 'securities' },
      { code: '60.50', name: 'Véhicules', source: 'Valeur vénale', dataKey: 'vehicleValue' },
      { code: '60.70', name: 'Cryptomonnaies', source: 'Valeur 31.12', dataKey: 'crypto' },
    ]
  },
  {
    id: 'annexe-e',
    name: 'Annexe E - Dettes',
    description: 'Dettes privées, intérêts passifs',
    documentTypes: ['releve-credit'],
    fields: [
      { code: '55.10', name: 'Intérêts passifs privés', source: 'Relevés crédits', dataKey: 'loanInterest' },
      { code: '66.10', name: 'Dettes privées', source: 'Contrats, relevés', dataKey: 'personalLoans' },
    ]
  },
];

// Document type names for display
const DOCUMENT_TYPE_NAMES = {
  'certificat-salaire': 'Certificat de salaire',
  'attestation-3a': 'Attestation 3ème pilier A',
  'attestation-lpp-rachat': 'Attestation rachat LPP',
  'facture-formation': 'Facture formation continue',
  'attestation-maladie': 'Attestation assurance maladie',
  'attestation-vie': 'Attestation assurance-vie (3b)',
  'facture-garde': 'Facture frais de garde',
  'attestation-hypothecaire': 'Attestation hypothécaire',
  'estimation-immobiliere': 'Estimation immobilière',
  'releve-bancaire': 'Relevé bancaire',
  'etat-titres': 'État des titres',
  'releve-credit': 'Relevé de crédit/leasing',
};

export default function GuidePage() {
  const [selectedPage, setSelectedPage] = useState(GETAX_PAGES[0]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [userData, setUserData] = useState({});
  const [hasData, setHasData] = useState(false);

  // Upload state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedDocTypes, setUploadedDocTypes] = useState([]);

  // Load data from localStorage (saved by questionnaire)
  useEffect(() => {
    const saved = localStorage.getItem('taxDeclarationData');
    if (saved) {
      setUserData(JSON.parse(saved));
      setHasData(true);
    }
    // Load uploaded document types
    const extractions = JSON.parse(localStorage.getItem('documentExtractions') || '[]');
    const docTypes = [...new Set(extractions.map(e => e.documentType))];
    setUploadedDocTypes(docTypes);
  }, []);

  // Get missing documents for current page
  const getMissingDocuments = () => {
    if (!selectedPage.documentTypes) return [];
    return selectedPage.documentTypes.filter(dt => !uploadedDocTypes.includes(dt));
  };

  const calculateForfait = (gross, avs, lpp, type) => {
    const base = gross - avs - lpp;
    const forfait = base * 0.03;
    if (type === 'ICC') {
      return Math.min(Math.max(forfait, 634), 1796);
    } else {
      return Math.min(Math.max(forfait, 2000), 4000);
    }
  };

  const getFieldValue = (field) => {
    if (field.calculated) {
      if (field.code === '31.50') {
        return calculateForfait(userData.grossSalary, userData.avsContributions, userData.lppContributions, 'ICC');
      }
      if (field.code === '31.20') {
        return calculateForfait(userData.grossSalary, userData.avsContributions, userData.lppContributions, 'IFD');
      }
      return null;
    }
    return userData[field.dataKey] || null;
  };

  const copyValue = (code, value) => {
    navigator.clipboard.writeText(value.toString());
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const askGuide = async () => {
    if (!chatInput.trim() || chatLoading) return;
    setChatLoading(true);
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: `Je suis sur ${selectedPage.name}. ${chatInput}`,
        agent: 'getax-guide'
      });
      setChatResponse(response.data.content);
    } catch (error) {
      setChatResponse('Erreur lors de la communication avec l\'assistant.');
    } finally {
      setChatLoading(false);
      setChatInput('');
    }
  };

  // Reset upload state when changing page
  useEffect(() => {
    if (selectedPage.documentTypes?.length > 0) {
      setUploadDocType(selectedPage.documentTypes[0]);
    }
    setUploadSuccess(null);
    setUploadError(null);
  }, [selectedPage]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [uploadDocType]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!uploadDocType) {
      setUploadError('Veuillez sélectionner un type de document');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', uploadDocType);

    try {
      const response = await axios.post(`${API_URL}/documents/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        // Apply extracted data to questionnaire
        const existing = JSON.parse(localStorage.getItem('taxDeclarationData') || '{}');
        const merged = { ...existing };
        Object.entries(response.data.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            merged[key] = value;
          }
        });
        localStorage.setItem('taxDeclarationData', JSON.stringify(merged));

        // Update local state
        setUserData(merged);
        setHasData(true);

        // Save extraction to extractions list
        const extractions = JSON.parse(localStorage.getItem('documentExtractions') || '[]');
        extractions.unshift({
          id: Date.now(),
          fileName: file.name,
          ...response.data,
          timestamp: new Date().toISOString(),
        });
        localStorage.setItem('documentExtractions', JSON.stringify(extractions));

        // Update uploaded doc types
        setUploadedDocTypes(prev => [...new Set([...prev, uploadDocType])]);

        setUploadSuccess({
          documentName: response.data.documentName,
          fieldsExtracted: Object.keys(response.data.data).filter(k =>
            response.data.data[k] !== null && response.data.data[k] !== undefined
          ).length
        });
      } else {
        setUploadError(response.data.error || 'Erreur lors de l\'extraction');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const missingDocs = getMissingDocuments();

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-7 h-7 text-red-600" />
          Déclaration d'impôts 2024
        </h1>
        <p className="text-gray-600 mt-1">
          Suivez ce guide rubrique par rubrique et importez vos documents
        </p>
      </div>

      {/* No data warning */}
      {!hasData && (
        <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Commencez par importer vos documents</h3>
            <p className="text-sm text-amber-800 mt-1">
              Téléchargez vos certificats et attestations pour remplir automatiquement les rubriques.
            </p>
          </div>
        </div>
      )}

      {/* Page Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Page GeTax actuelle:
        </label>
        <select
          value={selectedPage.id}
          onChange={(e) => setSelectedPage(GETAX_PAGES.find(p => p.id === e.target.value))}
          className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {GETAX_PAGES.map(page => (
            <option key={page.id} value={page.id}>{page.name}</option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-2">{selectedPage.description}</p>

        {/* Missing documents hint */}
        {missingDocs.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Documents recommandés:</span>{' '}
              {missingDocs.map((dt, i) => (
                <span key={dt}>
                  {DOCUMENT_TYPE_NAMES[dt]}
                  {i < missingDocs.length - 1 ? ', ' : ''}
                </span>
              ))}
            </p>
            <button
              onClick={() => setUploadOpen(true)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Importer un document →
            </button>
          </div>
        )}
      </div>

      {/* Document Upload Section */}
      {selectedPage.documentTypes?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <button
            onClick={() => setUploadOpen(!uploadOpen)}
            className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-gray-900">Télécharger un document pour cette page</span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${uploadOpen ? 'rotate-90' : ''}`} />
          </button>

          {uploadOpen && (
            <div className="p-4 border-t border-gray-200 space-y-4">
              {/* Document type selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de document:
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.documentTypes.map(docType => (
                    <button
                      key={docType}
                      onClick={() => setUploadDocType(docType)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        uploadDocType === docType
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {DOCUMENT_TYPE_NAMES[docType]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-6 transition-colors ${
                  dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-center">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
                      <p className="text-gray-600">Analyse en cours...</p>
                      <p className="text-sm text-gray-400">Extraction des données avec Claude AI</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 mb-2">
                        Glissez votre <strong>{DOCUMENT_TYPE_NAMES[uploadDocType]}</strong> ici
                      </p>
                      <label className="cursor-pointer">
                        <span className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors inline-block">
                          Choisir un fichier
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                          onChange={handleFileInput}
                        />
                      </label>
                      <p className="text-xs text-gray-400 mt-3">JPG, PNG, PDF (max 10 MB)</p>
                    </>
                  )}
                </div>
              </div>

              {/* Success message */}
              {uploadSuccess && (
                <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">{uploadSuccess.documentName} analysé</p>
                    <p className="text-sm text-green-700">
                      {uploadSuccess.fieldsExtracted} champs extraits et appliqués aux rubriques ci-dessous.
                    </p>
                  </div>
                </div>
              )}

              {/* Error message */}
              {uploadError && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800">{uploadError}</p>
                    <button
                      onClick={() => setUploadError(null)}
                      className="text-sm text-red-600 hover:text-red-800 mt-1"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Fields List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Rubriques à remplir</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {selectedPage.fields.map((field) => {
            const value = getFieldValue(field);
            const isOverLimit = field.limit && value > field.limit;

            return (
              <div key={field.code} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-red-100 text-red-800">
                        {field.code}
                      </span>
                      <span className="font-medium text-gray-900">{field.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {field.calculated ? (
                        <span className="text-blue-600">Calculé: {field.formula}</span>
                      ) : (
                        <span>Source: {field.source}</span>
                      )}
                    </div>
                    {isOverLimit && (
                      <div className="mt-1 flex items-center gap-1 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Limite dépassée! Max: {field.limit.toLocaleString('fr-CH')} CHF</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {value !== null ? (
                      <>
                        <span className={`font-mono text-lg ${isOverLimit ? 'text-amber-600' : 'text-gray-900'}`}>
                          CHF {value.toLocaleString('fr-CH')}
                        </span>
                        <button
                          onClick={() => copyValue(field.code, value)}
                          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                          title="Copier la valeur"
                        >
                          {copiedCode === field.code ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Chat */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-red-600" />
            <span className="font-medium text-gray-900">Poser une question sur cette page</span>
          </div>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${chatOpen ? 'rotate-90' : ''}`} />
        </button>

        {chatOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askGuide()}
                placeholder="Ex: Comment calculer le forfait frais professionnels?"
                className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                onClick={askGuide}
                disabled={chatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {chatLoading ? '...' : 'Demander'}
              </button>
            </div>
            {chatResponse && (
              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {chatResponse}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <h3 className="font-medium text-blue-900 mb-2">Conseil</h3>
        <p className="text-sm text-blue-800">
          Ouvrez GeTax dans un autre onglet et suivez ce guide rubrique par rubrique.
          Cliquez sur l'icône de copie pour copier la valeur et la coller directement dans GeTax.
        </p>
      </div>
    </div>
  );
}
