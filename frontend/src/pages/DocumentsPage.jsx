import { useState, useEffect, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:3002/api';

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extractions, setExtractions] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [expandedExtraction, setExpandedExtraction] = useState(null);

  // Load document types from API
  useEffect(() => {
    loadDocumentTypes();
    loadExtractions();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents/types`);
      setDocumentTypes(response.data);
      if (response.data.length > 0) {
        setSelectedType(response.data[0].id);
      }
    } catch (err) {
      console.error('Error loading document types:', err);
    }
  };

  const loadExtractions = () => {
    const saved = localStorage.getItem('documentExtractions');
    if (saved) {
      setExtractions(JSON.parse(saved));
    }
  };

  const saveExtractions = (newExtractions) => {
    setExtractions(newExtractions);
    localStorage.setItem('documentExtractions', JSON.stringify(newExtractions));
  };

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
  }, [selectedType]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!selectedType) {
      setError('Veuillez sélectionner un type de document');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', selectedType);

    try {
      const response = await axios.post(`${API_URL}/documents/extract`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const newExtraction = {
          id: Date.now(),
          fileName: file.name,
          ...response.data,
          timestamp: new Date().toISOString(),
        };

        const updated = [newExtraction, ...extractions];
        saveExtractions(updated);

        // Auto-apply extracted data to questionnaire
        applyExtractedData(response.data.data);

        setExpandedExtraction(newExtraction.id);
      } else {
        setError(response.data.error || 'Erreur lors de l\'extraction');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const applyExtractedData = (data) => {
    // Load existing questionnaire data
    const existing = JSON.parse(localStorage.getItem('taxDeclarationData') || '{}');

    // Merge extracted data (only non-null values)
    const merged = { ...existing };
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        merged[key] = value;
      }
    });

    // Save back to localStorage
    localStorage.setItem('taxDeclarationData', JSON.stringify(merged));
  };

  const deleteExtraction = (id) => {
    const updated = extractions.filter(e => e.id !== id);
    saveExtractions(updated);
  };

  const getTypeConfig = (typeId) => {
    return documentTypes.find(t => t.id === typeId);
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    if (type === 'number') return `CHF ${value.toLocaleString('fr-CH')}`;
    if (type === 'boolean') return value ? 'Oui' : 'Non';
    return value;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-gray-600 mt-1">
          Téléchargez vos justificatifs pour extraire automatiquement les données
        </p>
      </div>

      {/* Document Type Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Type de document à analyser
        </label>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          {documentTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.name} - {type.description}
            </option>
          ))}
        </select>
      </div>

      {/* Upload Zone */}
      <div
        className={`bg-white rounded-xl border-2 border-dashed p-8 mb-6 transition-colors ${
          dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
              <p className="text-gray-600">Analyse du document en cours...</p>
              <p className="text-sm text-gray-400 mt-1">Extraction des données avec Claude AI</p>
            </div>
          ) : (
            <>
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Glissez votre document ici
              </p>
              <p className="text-gray-500 mb-4">ou</p>
              <label className="cursor-pointer">
                <span className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors inline-block">
                  Choisir un fichier
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf"
                  onChange={handleFileInput}
                />
              </label>
              <p className="text-sm text-gray-400 mt-4">
                Formats acceptés: JPG, PNG, GIF, WEBP, PDF (max 10 MB)
              </p>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-sm text-red-600 hover:text-red-800 mt-1"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Extracted Documents List */}
      {extractions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Documents analysés</h2>
            <span className="text-sm text-gray-500">{extractions.length} document(s)</span>
          </div>

          <div className="divide-y divide-gray-100">
            {extractions.map((extraction) => {
              const typeConfig = getTypeConfig(extraction.documentType);
              const isExpanded = expandedExtraction === extraction.id;

              return (
                <div key={extraction.id} className="p-4">
                  {/* Header */}
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedExtraction(isExpanded ? null : extraction.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        extraction.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {extraction.success ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{extraction.documentName}</p>
                        <p className="text-sm text-gray-500">{extraction.fileName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteExtraction(extraction.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && extraction.success && (
                    <div className="mt-4 pl-13">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Données extraites</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {typeConfig?.fields.map(field => (
                            <div key={field.key} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                              <span className="text-sm text-gray-600">{field.label}</span>
                              <span className="font-medium text-gray-900">
                                {formatValue(extraction.data[field.key], field.type)}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => applyExtractedData(extraction.data)}
                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Réappliquer au questionnaire
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && !extraction.success && (
                    <div className="mt-4 pl-13">
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          Erreur: {extraction.error || 'Impossible d\'extraire les données'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Supported Documents Info */}
      <div className="mt-6 bg-blue-50 rounded-xl border border-blue-100 p-4">
        <h3 className="font-medium text-blue-900 mb-2">Documents supportés</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-800">
          <div>• Certificat de salaire</div>
          <div>• Attestation 3ème pilier A</div>
          <div>• Attestation rachat LPP</div>
          <div>• Relevés bancaires</div>
          <div>• État des titres</div>
          <div>• Attestation assurance maladie</div>
          <div>• Attestation assurance-vie</div>
          <div>• Factures frais de garde</div>
          <div>• Attestation hypothécaire</div>
          <div>• Factures formation</div>
          <div>• Relevés de crédit/leasing</div>
          <div>• Estimation immobilière</div>
        </div>
      </div>
    </div>
  );
}
