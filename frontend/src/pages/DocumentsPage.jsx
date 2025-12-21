import { useState, useEffect, useCallback } from 'react';
import { Upload, Check, AlertCircle, Loader2, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = 'http://localhost:3002/api';

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [extractions, setExtractions] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [expandedExtraction, setExpandedExtraction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
    const existing = JSON.parse(localStorage.getItem('taxDeclarationData') || '{}');
    const merged = { ...existing };
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        merged[key] = value;
      }
    });
    localStorage.setItem('taxDeclarationData', JSON.stringify(merged));
  };

  const confirmDelete = (extraction) => {
    setDeleteConfirm(extraction);
  };

  const deleteExtraction = () => {
    if (!deleteConfirm) return;
    const updated = extractions.filter(e => e.id !== deleteConfirm.id);
    saveExtractions(updated);
    setDeleteConfirm(null);
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
      <Card className="mb-6">
        <CardContent className="p-6">
          <Label className="mb-2 block">Type de document à analyser</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner un type" />
            </SelectTrigger>
            <SelectContent>
              {documentTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name} - {type.description}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card className={`mb-6 border-2 border-dashed transition-colors ${
        dragActive ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent
          className="p-8"
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
                  <Button asChild>
                    <span>Choisir un fichier</span>
                  </Button>
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
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Fermer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Extracted Documents List */}
      {extractions.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documents analysés</CardTitle>
            <span className="text-sm text-gray-500">{extractions.length} document(s)</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {extractions.map((extraction) => {
                const typeConfig = getTypeConfig(extraction.documentType);
                const isExpanded = expandedExtraction === extraction.id;

                return (
                  <div key={extraction.id} className="p-4">
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete(extraction);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && extraction.success && (
                      <div className="mt-4 space-y-4">
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
                        </div>

                        {(extraction.data.notes || extraction.data.warnings || extraction.data.additionalAmounts) && (
                          <Alert variant="warning">
                            <AlertCircle className="h-5 w-5" />
                            <AlertDescription>
                              <h4 className="font-medium mb-2">Informations supplémentaires</h4>
                              {extraction.data.warnings && (
                                <p className="text-sm mb-1"><strong>Points d'attention:</strong> {extraction.data.warnings}</p>
                              )}
                              {extraction.data.notes && (
                                <p className="text-sm mb-1"><strong>Notes:</strong> {extraction.data.notes}</p>
                              )}
                              {extraction.data.additionalAmounts && (
                                <p className="text-sm mb-1"><strong>Autres montants:</strong> {extraction.data.additionalAmounts}</p>
                              )}
                              {extraction.data.period && (
                                <p className="text-sm text-gray-600">Période: {extraction.data.period}</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyExtractedData(extraction.data)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Réappliquer au questionnaire
                        </Button>
                      </div>
                    )}

                    {isExpanded && !extraction.success && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription>
                          Erreur: {extraction.error || 'Impossible d\'extraire les données'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Supported Documents Info */}
      <Alert variant="info">
        <AlertDescription>
          <h3 className="font-medium mb-2">Documents supportés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
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
        </AlertDescription>
      </Alert>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le document?</DialogTitle>
            <DialogDescription>
              Cette action supprimera les données extraites de ce document.
            </DialogDescription>
          </DialogHeader>

          {deleteConfirm && (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription>
                <p className="font-medium">{deleteConfirm.documentName}</p>
                <p className="text-sm">{deleteConfirm.fileName}</p>
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-gray-600">
            Les données déjà appliquées au questionnaire ne seront pas affectées.
          </p>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={deleteExtraction}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
