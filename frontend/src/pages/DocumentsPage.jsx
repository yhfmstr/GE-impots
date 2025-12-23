import { useState, useEffect, useCallback } from 'react';
import { Upload, Check, AlertCircle, Loader2, ChevronDown, ChevronUp, Trash2, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import api, { uploadApi } from '@/lib/api';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import { createSuggestion, EXTRACTION_FIELD_MAP } from '@/lib/inferenceRules';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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

export default function DocumentsPage() {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [extractions, setExtractions] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [expandedExtraction, setExpandedExtraction] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Auto-detection state with file tracking to prevent race conditions
  const [autoDetect, setAutoDetect] = useState(true);
  const [detectionResult, setDetectionResult] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingFileId, setPendingFileId] = useState(null);

  // Suggestions notification
  const [suggestionNotification, setSuggestionNotification] = useState(null);

  useEffect(() => {
    loadDocumentTypes();
    loadExtractions();
  }, []);

  const loadDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      setDocumentTypes(response.data);
      if (response.data.length > 0) {
        setSelectedType(response.data[0].id);
      }
    } catch (err) {
      setError('Impossible de charger les types de documents');
    }
  };

  const loadExtractions = () => {
    try {
      const saved = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
      setExtractions(Array.isArray(saved) ? saved : []);
    } catch {
      setExtractions([]);
    }
  };

  const saveExtractions = (newExtractions) => {
    setExtractions(newExtractions);
    saveSecure(STORAGE_KEYS.EXTRACTIONS, newExtractions);
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
  }, [autoDetect, selectedType]);

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Main file handler - either auto-detect or use selected type
  const handleFile = async (file) => {
    setError(null);

    // Generate unique ID for this file upload to prevent race conditions
    const fileId = Date.now();

    if (autoDetect) {
      // Auto-detect document type first
      setDetecting(true);
      setPendingFile(file);
      setPendingFileId(fileId);

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await uploadApi.post('/documents/extract-auto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        // Check if this is still the current pending file (race condition guard)
        setPendingFileId(currentId => {
          if (currentId !== fileId) {
            // A newer file was uploaded, ignore this result
            return currentId;
          }

          if (response.data.success && response.data.detectedType) {
            // Show confirmation dialog
            setDetectionResult({
              ...response.data,
              fileName: file.name,
              fileId
            });
          } else {
            // Detection failed, ask user to select manually
            setDetectionResult({
              success: false,
              error: response.data.error || 'Impossible de détecter automatiquement le type',
              fileName: file.name,
              fileId
            });
          }
          return currentId;
        });
      } catch (err) {
        // Only show error if this is still the current file
        setPendingFileId(currentId => {
          if (currentId === fileId) {
            setError(err.response?.data?.error || err.message || 'Erreur lors de la détection');
            setPendingFile(null);
          }
          return currentId;
        });
      } finally {
        setDetecting(false);
      }
    } else {
      // Direct extraction with selected type
      if (!selectedType) {
        setError('Veuillez sélectionner un type de document');
        return;
      }
      await extractDocument(file, selectedType);
    }
  };

  // Extract document with confirmed type
  const extractDocument = async (file, documentType) => {
    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    try {
      const response = await uploadApi.post('/documents/extract', formData, {
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

        // Create suggestions instead of direct merge
        createSuggestionsFromExtraction(response.data.data, documentType, file.name);

        setExpandedExtraction(newExtraction.id);
      } else {
        setError(response.data.error || 'Erreur lors de l\'extraction');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
      setPendingFile(null);
      setDetectionResult(null);
    }
  };

  // Confirm detected type and extract
  const confirmDetection = async () => {
    if (!pendingFile || !detectionResult?.detectedType) return;
    await extractDocument(pendingFile, detectionResult.detectedType);
  };

  // Change detected type before confirming
  const changeDetectedType = (newType) => {
    setDetectionResult(prev => ({
      ...prev,
      detectedType: newType,
      detectedTypeName: documentTypes.find(t => t.id === newType)?.name || newType,
      confidence: 1 // User selected, so 100% confidence
    }));
  };

  // Cancel detection and clear pending file
  const cancelDetection = () => {
    setDetectionResult(null);
    setPendingFile(null);
    setPendingFileId(null);
  };

  // Create suggestions from extracted data instead of direct merge
  const createSuggestionsFromExtraction = (data, documentType, fileName) => {
    try {
      // Load existing suggestions
      const existingSuggestions = loadSecure(STORAGE_KEYS.SUGGESTIONS, []);
      const newSuggestions = [];

      // Map extracted fields to suggestions
      Object.entries(data).forEach(([key, value]) => {
        // Skip meta fields
        if (['notes', 'warnings', 'additionalAmounts', 'period'].includes(key)) return;
        if (value === null || value === undefined || value === '') return;

        // Check if we already have a pending suggestion for this field
        const existingPending = existingSuggestions.find(
          s => s.fieldKey === key && s.accepted === null
        );
        if (existingPending) return; // Don't duplicate

        // Create new suggestion
        const suggestion = createSuggestion(
          { confidence: 0.85 }, // Default confidence from document extraction
          key,
          value,
          documentType,
          fileName
        );

        // Add label from field map if available
        const fieldInfo = EXTRACTION_FIELD_MAP[key];
        if (fieldInfo) {
          suggestion.annexe = fieldInfo.annexe;
          suggestion.rubrique = fieldInfo.rubrique;
        }

        newSuggestions.push(suggestion);
      });

      // Save combined suggestions
      if (newSuggestions.length > 0) {
        const combined = [...newSuggestions, ...existingSuggestions];
        saveSecure(STORAGE_KEYS.SUGGESTIONS, combined);

        // Show notification
        setSuggestionNotification({
          count: newSuggestions.length,
          fileName
        });

        // Auto-hide notification after 5 seconds
        setTimeout(() => {
          setSuggestionNotification(null);
        }, 5000);
      }

      return newSuggestions.length;
    } catch {
      return 0;
    }
  };

  // Legacy direct merge (for manual "reapply" button)
  const applyExtractedData = (data) => {
    try {
      const existing = loadSecure(STORAGE_KEYS.TAX_DATA, {});
      const merged = { ...existing };
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          merged[key] = value;
        }
      });
      saveSecure(STORAGE_KEYS.TAX_DATA, merged);
    } catch {
      // Silent fail for storage errors
    }
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Téléchargez vos justificatifs pour extraire automatiquement les données
        </p>
      </div>

      {/* Auto-detection toggle */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className={`w-5 h-5 ${autoDetect ? 'text-purple' : 'text-muted-foreground'}`} />
              <div>
                <Label className="font-medium">Détection automatique</Label>
                <p className="text-sm text-muted-foreground">L'IA identifie le type de document pour vous</p>
              </div>
            </div>
            <Button
              variant={autoDetect ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoDetect(!autoDetect)}
            >
              {autoDetect ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          {/* Manual type selector (shown when auto-detect is off) */}
          {!autoDetect && (
            <div className="mt-4 pt-4 border-t">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Zone */}
      <Card className={`mb-6 border-2 border-dashed transition-colors ${
        dragActive ? 'border-primary bg-primary-light' : 'border-border hover:border-muted-foreground'
      }`}>
        <CardContent
          className="p-8"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            {(uploading || detecting) ? (
              <div className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-text-secondary">
                  {detecting ? 'Détection du type de document...' : 'Analyse du document en cours...'}
                </p>
                <p className="text-sm text-text-muted mt-1">Extraction des données avec Claude AI</p>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Glissez votre document ici
                </p>
                <p className="text-muted-foreground mb-4">ou</p>
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
                <p className="text-sm text-text-muted mt-4">
                  Formats acceptés: JPG, PNG, GIF, WEBP, PDF (max 10 MB)
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              Fermer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Suggestion Success Notification */}
      {suggestionNotification && (
        <Alert className="mb-6 border-success bg-success-light">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-success-muted">
                <strong>{suggestionNotification.count} champ{suggestionNotification.count > 1 ? 's' : ''}</strong> extrait{suggestionNotification.count > 1 ? 's' : ''} de {suggestionNotification.fileName}
              </span>
              <Badge variant="success">
                <Sparkles className="w-3 h-3 mr-1" />
                À valider
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-success-muted border-success hover:bg-success-light"
              onClick={() => window.location.href = '/declaration'}
            >
              Voir les suggestions
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Extracted Documents List */}
      {extractions.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Documents analysés</CardTitle>
            <span className="text-sm text-muted-foreground">{extractions.length} document(s)</span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
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
                          extraction.success ? 'bg-success-light' : 'bg-destructive-light'
                        }`}>
                          {extraction.success ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-destructive" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{extraction.documentName}</p>
                          <p className="text-sm text-muted-foreground">{extraction.fileName}</p>
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
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && extraction.success && (
                      <div className="mt-4 space-y-4">
                        <div className="bg-muted rounded-lg p-4">
                          <h4 className="text-sm font-medium text-secondary-foreground mb-3">Données extraites</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {typeConfig?.fields.map(field => (
                              <div key={field.key} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                <span className="text-sm text-text-secondary">{field.label}</span>
                                <span className="font-medium text-foreground">
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
                                <p className="text-sm text-text-secondary">Période: {extraction.data.period}</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyExtractedData(extraction.data)}
                          className="text-primary hover:text-primary-hover"
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

      {/* Detection Confirmation Dialog */}
      <Dialog open={!!detectionResult} onOpenChange={() => cancelDetection()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple" />
              Confirmation du type de document
            </DialogTitle>
            <DialogDescription>
              {detectionResult?.success
                ? 'L\'IA a identifié le type de document. Veuillez confirmer ou corriger.'
                : 'L\'IA n\'a pas pu identifier le type. Veuillez le sélectionner manuellement.'}
            </DialogDescription>
          </DialogHeader>

          {detectionResult && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Fichier:</p>
                <p className="font-medium">{detectionResult.fileName}</p>
              </div>

              {detectionResult.success && (
                <div className="p-3 bg-purple-light rounded-lg border border-purple">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple">Type détecté:</p>
                      <p className="font-medium text-purple-muted">{detectionResult.detectedTypeName}</p>
                    </div>
                    <div className={`text-sm font-medium ${getConfidenceColor(detectionResult.confidence)}`}>
                      {Math.round(detectionResult.confidence * 100)}% confiance
                    </div>
                  </div>
                  {detectionResult.reasoning && (
                    <p className="text-sm text-purple-muted mt-2">{detectionResult.reasoning}</p>
                  )}
                </div>
              )}

              <div>
                <Label className="mb-2 block">
                  {detectionResult.success ? 'Corriger si nécessaire:' : 'Sélectionner le type:'}
                </Label>
                <Select
                  value={detectionResult.detectedType || ''}
                  onValueChange={changeDetectedType}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={cancelDetection}>
              Annuler
            </Button>
            <Button
              onClick={confirmDetection}
              disabled={!detectionResult?.detectedType}
            >
              Confirmer et extraire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

          <p className="text-sm text-text-secondary">
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
