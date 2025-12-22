import { useState, useEffect, useCallback } from 'react';
import { Copy, Check, MessageSquare, ChevronRight, AlertCircle, FileText, AlertTriangle, Upload, Loader2, CheckCircle } from 'lucide-react';
import api, { uploadApi } from '@/lib/api';
import { loadSecure, saveSecure, STORAGE_KEYS, validateTaxData } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TAX_YEAR } from '@/config/taxYear';

const GETAX_PAGES = [
  {
    id: 'annexe-a',
    name: 'Annexe A - Activité dépendante',
    description: 'Salaires, cotisations sociales, frais professionnels',
    documentTypes: ['certificat-salaire', 'attestation-3a', 'attestation-lpp-rachat', 'facture-formation'],
    fields: [
      // === REVENUS ===
      { code: '11.10', name: 'Salaires bruts c.A', source: 'Certificat champ 8', dataKey: 'grossSalary' },
      { code: '11.15', name: 'Bonus, gratification c.A', source: 'Certificat', dataKey: 'bonus' },
      { code: '11.30', name: 'Tantièmes, jetons de présence c.A', source: 'Certificat', dataKey: 'boardFees' },
      { code: '11.40', name: 'Actions/options collaborateur c.A', source: 'Certificat', dataKey: 'stockOptions' },
      { code: '11.50', name: 'Indemnités chômage/maladie c.A', source: 'Attestation', dataKey: 'unemploymentBenefits' },
      { code: '11.60', name: 'Vacations, ponts, prestations nature c.A', source: 'Certificat', dataKey: 'benefitsInKind' },
      { code: '11.70', name: 'Prestations en capital c.A', source: 'Certificat', dataKey: 'capitalBenefits' },
      { code: '11.90', name: 'Frais de représentation c.A', source: 'Certificat 13.2.1', dataKey: 'representationFees' },
      { code: '11.91', name: 'Frais de voiture c.A', source: 'Certificat 13.2.2', dataKey: 'carAllowance' },
      { code: '11.92', name: 'Autres frais c.A', source: 'Certificat 13.2.3', dataKey: 'otherAllowances' },
      // === COTISATIONS SOCIALES ===
      { code: '31.10', name: 'Cotisations AVS/AI c.A', source: 'Certificat champ 9', dataKey: 'avsContributions' },
      { code: '31.12', name: 'Cotisations 2e pilier c.A', source: 'Certificat champ 10', dataKey: 'lppContributions' },
      { code: '31.30', name: 'Rachats 2e pilier c.A', source: 'Attestation rachat', dataKey: 'lppBuyback' },
      { code: '31.40', name: 'Cotisations 3e pilier A c.A', source: 'Formulaire 21 EDP', dataKey: 'pilier3a', limit: 7056 },
      // === FRAIS PROFESSIONNELS FORFAIT ===
      { code: '31.50', name: 'Forfait frais pro ICC c.A', calculated: true, formula: '3% (min 634, max 1796)' },
      { code: '31.20', name: 'Forfait frais pro IFD c.A', calculated: true, formula: '3% (min 2000, max 4000)' },
      // === FRAIS PROFESSIONNELS EFFECTIFS ===
      { code: '31.60', name: 'Frais de repas effectifs c.A', source: 'Justificatifs', dataKey: 'mealExpenses', limit: 3200 },
      { code: '31.70', name: 'Frais de déplacement ICC c.A', source: 'Justificatifs', dataKey: 'travelExpensesICC', limit: 529 },
      { code: '31.71', name: 'Frais de déplacement IFD c.A', source: 'Justificatifs', dataKey: 'travelExpensesIFD', limit: 3200 },
      { code: '31.63', name: 'Autres frais professionnels c.A', source: 'Justificatifs', dataKey: 'otherProfExpenses' },
      // === DÉDUCTION ACTIVITÉ DOUBLE (couples) ===
      { code: '31.90', name: 'Déduction activité double IFD', calculated: true, formula: 'Max CHF 13,900' },
      { code: '31.95', name: 'Déduction activité double ICC', calculated: true, formula: 'CHF 1,041' },
    ]
  },
  {
    id: 'annexe-b',
    name: 'Annexe B - Activité indépendante',
    description: 'Bénéfices, cotisations sociales indépendants',
    documentTypes: ['comptabilite', 'attestation-avs-indep', 'attestation-3a', 'attestation-lpp-rachat'],
    fields: [
      // === REVENUS ===
      { code: '12.01', name: 'Bénéfice net activité indépendante c.A', source: 'Comptabilité', dataKey: 'selfEmployedProfit' },
      { code: '12.28', name: 'Réduction liée aux brevets ICC c.A', source: 'Déclaration brevets', dataKey: 'patentReduction' },
      { code: '12.29', name: 'Réduction dépenses R&D ICC c.A', source: 'Déclaration R&D', dataKey: 'rdReduction' },
      { code: '22.01', name: 'Bénéfice net activité indépendante c.B', source: 'Comptabilité', dataKey: 'selfEmployedProfitB' },
      // === COTISATIONS SOCIALES ===
      { code: '32.10', name: 'Cotisations AVS/AI indépendant c.A', source: 'Attestation AVS', dataKey: 'avsIndependent' },
      { code: '42.10', name: 'Cotisations AVS/AI indépendant c.B', source: 'Attestation AVS', dataKey: 'avsIndependentB' },
      { code: '32.20', name: 'Cotisations 2e pilier indépendant c.A', source: 'Attestation LPP', dataKey: 'lppIndependent' },
      { code: '42.20', name: 'Cotisations 2e pilier indépendant c.B', source: 'Attestation LPP', dataKey: 'lppIndependentB' },
      { code: '32.30', name: 'Rachats 2e pilier indépendant c.A', source: 'Attestation rachat', dataKey: 'lppBuybackIndep' },
      { code: '32.40', name: 'Cotisations 3e pilier A indépendant c.A', source: '21 EDP', dataKey: 'pilier3aIndep', limit: 35280 },
    ]
  },
  {
    id: 'annexe-c',
    name: 'Annexe C - Autres revenus et déductions',
    description: 'Assurances, déductions familiales, pensions, dons',
    documentTypes: ['attestation-maladie', 'attestation-vie', 'facture-garde', 'facture-formation', 'facture-dons', 'justificatif-pension', 'facture-medicale'],
    fields: [
      // === RENTES AVS/AI ===
      { code: '17.10', name: 'Rentes AVS/AI c.A', source: 'Attestation AVS', dataKey: 'avsRente' },
      { code: '17.20', name: 'Autres prestations sociales c.A', source: 'Attestation', dataKey: 'otherSocialBenefits' },
      // === AUTRES REVENUS ===
      { code: '13.10', name: 'Pensions alimentaires reçues', source: 'Justificatifs', dataKey: 'alimonyReceived' },
      { code: '13.15', name: 'Avances SCARPA reçues', source: 'Attestation SCARPA', dataKey: 'scarpaAdvances' },
      { code: '13.20', name: 'Rentes prévoyance professionnelle', source: 'Attestation LPP', dataKey: 'lppRente' },
      { code: '13.30', name: 'Prestations assurance militaire', source: 'Attestation', dataKey: 'militaryInsurance' },
      { code: '13.40', name: 'Autres rentes', source: 'Justificatifs', dataKey: 'otherRentes' },
      { code: '13.50', name: 'Rentes viagères reçues', source: 'Contrat', dataKey: 'annuitiesReceived' },
      // === REVENUS DIVERS ===
      { code: '16.10', name: 'Produits sous-location', source: 'Baux', dataKey: 'subletIncome' },
      { code: '16.20', name: 'Gains accessoires', source: 'Justificatifs', dataKey: 'sideIncome' },
      { code: '16.30', name: 'Subside assurance-maladie', source: 'Attestation', dataKey: 'healthSubsidy' },
      { code: '16.35', name: 'Allocation logement', source: 'Attestation', dataKey: 'housingAllowance' },
      { code: '16.40', name: 'Numéraires, métaux précieux trouvés', source: 'Déclaration', dataKey: 'foundValuables' },
      { code: '16.50', name: 'Successions non partagées', source: 'Documents succession', dataKey: 'undividedInheritance' },
      { code: '16.63', name: 'Allocations familiales', source: 'Attestation', dataKey: 'familyAllowances' },
      { code: '16.64', name: 'Autres revenus', source: 'Justificatifs', dataKey: 'otherIncome' },
      { code: '16.80', name: 'Successions', source: 'Documents succession', dataKey: 'inheritance' },
      // === ASSURANCES ===
      { code: '52.21', name: 'Primes assurance-maladie', source: 'Attestation caisse', dataKey: 'healthInsurance', limit: 16207 },
      { code: '52.22', name: 'Primes assurance-accidents', source: 'Attestation', dataKey: 'accidentInsurance' },
      { code: '52.11', name: 'Assurance-vie 3b (primes)', source: 'Attestation', dataKey: 'lifeInsurance3b', limit: 2324 },
      { code: '52.00', name: 'Forfait assurances IFD', calculated: true, formula: 'Célibataire: 1800, Couple: 3600' },
      { code: '52.15', name: 'Sous-total ICC assurances', calculated: true, formula: 'Selon situation familiale' },
      // === DÉDUCTIONS FAMILIALES ===
      { code: '59.10', name: 'Frais de garde enfants ICC', source: 'Factures garde', dataKey: 'childcareICC', limit: 26080 },
      { code: '59.12', name: 'Frais de garde enfants IFD', source: 'Factures garde', dataKey: 'childcareIFD', limit: 25500 },
      { code: '59.20', name: 'Déduction époux IFD', calculated: true, formula: 'CHF 2,800' },
      // === FORMATION & HANDICAP ===
      { code: '59.50', name: 'Formation continue', source: 'Factures formation', dataKey: 'continuingEducation', limit: 12640 },
      { code: '59.40', name: 'Frais liés au handicap', source: 'Justificatifs médicaux', dataKey: 'disabilityCosts' },
      // === DÉDUCTIONS GAINS ACCESSOIRES ===
      { code: '59.70', name: 'Déduction gains accessoires ICC', calculated: true, formula: '20% (max CHF 2400)' },
      { code: '59.75', name: 'Déduction gains accessoires IFD', calculated: true, formula: '20% (max CHF 800)' },
      // === PENSIONS VERSÉES ===
      { code: '53.10', name: 'Pensions alimentaires versées', source: 'Justificatifs', dataKey: 'alimonyPaid' },
      { code: '54.10', name: 'Rentes viagères payées', source: 'Justificatifs', dataKey: 'annuitiesPaid' },
      { code: '33.20', name: 'Déduction rentes LPP historiques', source: 'Attestation', dataKey: 'historicLppRentes' },
      // === INTÉRÊTS ÉPARGNE ===
      { code: '56.30', name: 'Intérêts capitaux d\'épargne', source: 'État des titres', dataKey: 'savingsInterest' },
      // === PRÉVOYANCE SPÉCIALE (58+) ===
      { code: '59.65', name: 'Maintien prévoyance - cotisations', source: 'Attestation', dataKey: 'pensionMaintenance' },
      { code: '59.66', name: 'Maintien prévoyance - rachats', source: 'Attestation', dataKey: 'pensionMaintenanceBuyback' },
      // === DONS ===
      { code: '58.10', name: 'Dons (utilité publique)', source: 'Reçus dons', dataKey: 'donations' },
      // === FRAIS MÉDICAUX ===
      { code: '52.30', name: 'Frais médicaux (au-delà seuil)', source: 'Factures médicales', dataKey: 'medicalExpenses' },
      // === CHARGES DE FAMILLE ===
      { code: '80.10', name: 'Déduction enfant (charge complète)', calculated: true, formula: 'ICC: 13536, IFD: 6700' },
      { code: '80.20', name: 'Déduction enfant (demi-charge)', calculated: true, formula: 'ICC: 6768, IFD: 3350' },
    ]
  },
  {
    id: 'annexe-d',
    name: 'Annexe D - Fortune immobilière',
    description: 'Valeur locative, frais entretien, hypothèque',
    documentTypes: ['attestation-hypothecaire', 'estimation-immobiliere', 'facture-entretien'],
    fields: [
      // === REVENUS IMMOBILIERS ===
      { code: '15.10', name: 'Valeur locative brute', source: 'Questionnaire officiel', dataKey: 'rentalValue' },
      { code: '15.13', name: 'Subventions reçues (travaux énergie)', source: 'Attestation subvention', dataKey: 'energySubsidy' },
      { code: '15.20', name: 'Loyers encaissés', source: 'Baux', dataKey: 'rentalIncome' },
      { code: '15.30', name: 'Rendement immeubles commerciaux', source: 'Comptabilité', dataKey: 'commercialPropertyIncome' },
      { code: '15.40', name: 'Épargne logement (intérêts bonifiés)', source: 'Relevé compte', dataKey: 'housingBonusInterest' },
      { code: '15.43', name: 'Subventions PPE', source: 'Attestation PPE', dataKey: 'ppeSubsidy' },
      { code: '15.50', name: 'Loyers HLM / coopératives', source: 'Attestation', dataKey: 'hlmRent' },
      // === FRAIS D'ENTRETIEN ===
      { code: '35.10', name: 'Frais entretien forfait ICC', calculated: true, formula: '≤10 ans: 15%, >10 ans: 25%' },
      { code: '35.11', name: 'Frais entretien forfait IFD', calculated: true, formula: '≤10 ans: 10%, >10 ans: 20%' },
      { code: '35.20', name: 'Frais d\'entretien effectifs', source: 'Factures', dataKey: 'maintenanceActual' },
      // === CHARGES ===
      { code: '35.30', name: 'Intérêts hypothécaires', source: 'Relevé banque', dataKey: 'mortgageInterest' },
      // === FORTUNE ===
      { code: '65.10', name: 'Valeur fiscale immeuble', source: 'Estimation officielle', dataKey: 'propertyValue' },
      { code: '65.20', name: 'Dette hypothécaire', source: 'Relevé banque 31.12', dataKey: 'mortgageDebt' },
    ]
  },
  {
    id: 'annexe-e',
    name: 'Annexe E - Dettes',
    description: 'Dettes privées, intérêts passifs',
    documentTypes: ['releve-credit'],
    fields: [
      { code: '55.10', name: 'Intérêts passifs privés', source: 'Relevés crédits', dataKey: 'loanInterest' },
      { code: '55.20', name: 'Autres intérêts passifs', source: 'Relevés', dataKey: 'otherInterest' },
      { code: '66.10', name: 'Dettes privées', source: 'Contrats, relevés', dataKey: 'personalLoans' },
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
      { code: '60.40', name: 'Titres non cotés', source: 'Évaluation', dataKey: 'unlistedSecurities' },
      { code: '60.50', name: 'Véhicules', source: 'Valeur vénale', dataKey: 'vehicleValue' },
      { code: '60.60', name: 'Assurance-vie (valeur de rachat)', source: 'Attestation', dataKey: 'lifeInsuranceValue' },
      { code: '60.70', name: 'Cryptomonnaies', source: 'Valeur 31.12', dataKey: 'crypto' },
      { code: '60.80', name: 'Autres actifs mobiliers', source: 'Estimation', dataKey: 'otherAssets' },
    ]
  },
];

// Document type names for display
const DOCUMENT_TYPE_NAMES = {
  // Annexe A
  'certificat-salaire': 'Certificat de salaire',
  'attestation-3a': 'Attestation 3ème pilier A',
  'attestation-lpp-rachat': 'Attestation rachat LPP',
  'facture-formation': 'Facture formation continue',
  // Annexe B
  'comptabilite': 'Comptabilité / Bilan',
  'attestation-avs-indep': 'Attestation AVS indépendant',
  // Annexe C
  'attestation-maladie': 'Attestation assurance maladie',
  'attestation-vie': 'Attestation assurance-vie (3b)',
  'facture-garde': 'Facture frais de garde',
  'facture-dons': 'Reçus de dons',
  'justificatif-pension': 'Justificatif pension alimentaire',
  'facture-medicale': 'Factures médicales',
  // Annexe D
  'attestation-hypothecaire': 'Attestation hypothécaire',
  'estimation-immobiliere': 'Estimation immobilière',
  'facture-entretien': 'Factures entretien immobilier',
  // Annexe E & F
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

  // Load data from localStorage with validation
  useEffect(() => {
    try {
      const saved = loadSecure(STORAGE_KEYS.TAX_DATA, {});
      const validated = validateTaxData(saved);
      if (Object.keys(validated).length > 0) {
        setUserData(validated);
        setHasData(true);
      }
      // Load uploaded document types
      const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
      const docTypes = [...new Set(extractions.map(e => e.documentType))];
      setUploadedDocTypes(docTypes);
    } catch {
      // Fallback to empty state on error
      setUserData({});
      setHasData(false);
    }
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
      const response = await api.post('/chat', {
        message: `Je suis sur ${selectedPage.name}. ${chatInput}`,
        agent: 'getax-guide'
      });
      setChatResponse(response.data.content);
    } catch (error) {
      setChatResponse(error.message || 'Erreur lors de la communication avec l\'assistant.');
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
      const response = await uploadApi.post('/documents/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        // Apply extracted data to questionnaire with secure storage
        const existing = loadSecure(STORAGE_KEYS.TAX_DATA, {});
        const merged = { ...existing };
        Object.entries(response.data.data).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            merged[key] = value;
          }
        });
        saveSecure(STORAGE_KEYS.TAX_DATA, merged);

        // Update local state
        setUserData(merged);
        setHasData(true);

        // Save extraction to extractions list
        const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
        extractions.unshift({
          id: Date.now(),
          fileName: file.name,
          ...response.data,
          timestamp: new Date().toISOString(),
        });
        saveSecure(STORAGE_KEYS.EXTRACTIONS, extractions);

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
      setUploadError(err.response?.data?.error || err.message || 'Erreur lors du téléchargement');
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
          Déclaration d'impôts {TAX_YEAR}
        </h1>
        <p className="text-gray-600 mt-1">
          Suivez ce guide rubrique par rubrique et importez vos documents
        </p>
      </div>

      {/* No data warning */}
      {!hasData && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            <strong className="block mb-1">Commencez par importer vos documents</strong>
            Téléchargez vos certificats et attestations pour remplir automatiquement les rubriques.
          </AlertDescription>
        </Alert>
      )}

      {/* Page Selector */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <Label className="mb-2 block">Page GeTax actuelle:</Label>
          <Select value={selectedPage.id} onValueChange={(value) => setSelectedPage(GETAX_PAGES.find(p => p.id === value))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {GETAX_PAGES.map(page => (
                <SelectItem key={page.id} value={page.id}>{page.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-2">{selectedPage.description}</p>

          {/* Missing documents hint */}
          {missingDocs.length > 0 && (
            <Alert variant="info" className="mt-3">
              <AlertDescription>
                <span className="font-medium">Documents recommandés:</span>{' '}
                {missingDocs.map((dt, i) => (
                  <span key={dt}>
                    {DOCUMENT_TYPE_NAMES[dt]}
                    {i < missingDocs.length - 1 ? ', ' : ''}
                  </span>
                ))}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setUploadOpen(true)}
                  className="ml-2 p-0 h-auto"
                >
                  Importer un document
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Document Upload Section */}
      {selectedPage.documentTypes?.length > 0 && (
        <Card className="mb-6 overflow-hidden">
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
            <CardContent className="p-4 border-t border-gray-200 space-y-4">
              {/* Document type selector */}
              <div>
                <Label className="mb-2 block">Type de document:</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPage.documentTypes.map(docType => (
                    <Button
                      key={docType}
                      variant={uploadDocType === docType ? 'blue' : 'secondary'}
                      size="sm"
                      onClick={() => setUploadDocType(docType)}
                    >
                      {DOCUMENT_TYPE_NAMES[docType]}
                    </Button>
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
                        <Button variant="blue" asChild>
                          <span>Choisir un fichier</span>
                        </Button>
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
                <Alert variant="success">
                  <CheckCircle className="h-5 w-5" />
                  <AlertDescription>
                    <strong>{uploadSuccess.documentName}</strong> analysé. {uploadSuccess.fieldsExtracted} champs extraits et appliqués.
                  </AlertDescription>
                </Alert>
              )}

              {/* Error message */}
              {uploadError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{uploadError}</span>
                    <Button variant="ghost" size="sm" onClick={() => setUploadError(null)}>
                      Fermer
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* Fields List */}
      <Card className="mb-6 overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle>Rubriques à remplir</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {selectedPage.fields.map((field) => {
              const value = getFieldValue(field);
              const isOverLimit = field.limit && value > field.limit;

              return (
                <div key={field.code} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default">{field.code}</Badge>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyValue(field.code, value)}
                            title="Copier la valeur"
                          >
                            {copiedCode === field.code ? (
                              <Check className="w-5 h-5 text-green-600" />
                            ) : (
                              <Copy className="w-5 h-5 text-gray-400" />
                            )}
                          </Button>
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
        </CardContent>
      </Card>

      {/* Quick Chat */}
      <Card className="overflow-hidden">
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
          <CardContent className="p-4 border-t border-gray-200">
            <div className="flex gap-2 mb-4">
              <Input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && askGuide()}
                placeholder="Ex: Comment calculer le forfait frais professionnels?"
                className="flex-1"
              />
              <Button
                onClick={askGuide}
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? '...' : 'Demander'}
              </Button>
            </div>
            {chatResponse && (
              <div className="p-4 bg-gray-50 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                {chatResponse}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Tips */}
      <Alert variant="info" className="mt-6">
        <AlertDescription>
          <strong className="block mb-1">Conseil</strong>
          Ouvrez GeTax dans un autre onglet et suivez ce guide rubrique par rubrique.
          Cliquez sur l'icône de copie pour copier la valeur et la coller directement dans GeTax.
        </AlertDescription>
      </Alert>
    </div>
  );
}
