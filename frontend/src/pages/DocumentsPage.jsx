import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import api, { uploadApi } from '@/lib/api';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import { createSuggestion, EXTRACTION_FIELD_MAP } from '@/lib/inferenceRules';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UploadZone,
  ExtractionList,
  DetectionDialog,
  DeleteDialog,
} from '@/components/documents';

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
    const fileId = Date.now();

    if (autoDetect) {
      setDetecting(true);
      setPendingFile(file);
      setPendingFileId(fileId);

      const formData = new FormData();
      formData.append('document', file);

      try {
        const response = await uploadApi.post('/documents/extract-auto', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setPendingFileId(currentId => {
          if (currentId !== fileId) return currentId;

          if (response.data.success && response.data.detectedType) {
            setDetectionResult({
              ...response.data,
              fileName: file.name,
              fileId
            });
          } else {
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
      if (!selectedType) {
        setError('Veuillez sélectionner un type de document');
        return;
      }
      await extractDocument(file, selectedType);
    }
  };

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

  const confirmDetection = async () => {
    if (!pendingFile || !detectionResult?.detectedType) return;
    await extractDocument(pendingFile, detectionResult.detectedType);
  };

  const changeDetectedType = (newType) => {
    setDetectionResult(prev => ({
      ...prev,
      detectedType: newType,
      detectedTypeName: documentTypes.find(t => t.id === newType)?.name || newType,
      confidence: 1
    }));
  };

  const cancelDetection = () => {
    setDetectionResult(null);
    setPendingFile(null);
    setPendingFileId(null);
  };

  const createSuggestionsFromExtraction = (data, documentType, fileName) => {
    try {
      const existingSuggestions = loadSecure(STORAGE_KEYS.SUGGESTIONS, []);
      const newSuggestions = [];

      Object.entries(data).forEach(([key, value]) => {
        if (['notes', 'warnings', 'additionalAmounts', 'period'].includes(key)) return;
        if (value === null || value === undefined || value === '') return;

        const existingPending = existingSuggestions.find(
          s => s.fieldKey === key && s.accepted === null
        );
        if (existingPending) return;

        const suggestion = createSuggestion(
          { confidence: 0.85 },
          key,
          value,
          documentType,
          fileName
        );

        const fieldInfo = EXTRACTION_FIELD_MAP[key];
        if (fieldInfo) {
          suggestion.annexe = fieldInfo.annexe;
          suggestion.rubrique = fieldInfo.rubrique;
        }

        newSuggestions.push(suggestion);
      });

      if (newSuggestions.length > 0) {
        const combined = [...newSuggestions, ...existingSuggestions];
        saveSecure(STORAGE_KEYS.SUGGESTIONS, combined);

        setSuggestionNotification({ count: newSuggestions.length, fileName });
        setTimeout(() => setSuggestionNotification(null), 5000);
      }

      return newSuggestions.length;
    } catch {
      return 0;
    }
  };

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

  const toggleExpand = (id) => {
    setExpandedExtraction(expandedExtraction === id ? null : id);
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
              <Sparkles className={`w-5 h-5 ${autoDetect ? 'text-purple' : 'text-muted-foreground'}`} aria-hidden="true" />
              <div>
                <Label className="font-medium">Détection automatique</Label>
                <p className="text-sm text-muted-foreground">L'IA identifie le type de document pour vous</p>
              </div>
            </div>
            <Button
              variant={autoDetect ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAutoDetect(!autoDetect)}
              aria-pressed={autoDetect}
            >
              {autoDetect ? 'Activé' : 'Désactivé'}
            </Button>
          </div>

          {!autoDetect && (
            <div className="mt-4 pt-4 border-t">
              <Label htmlFor="doc-type-select" className="mb-2 block">Type de document à analyser</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger id="doc-type-select" className="w-full">
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
      <UploadZone
        uploading={uploading}
        detecting={detecting}
        dragActive={dragActive}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onFileInput={handleFileInput}
      />

      {/* Error Message */}
      {error && (
        <Alert variant="destructive" role="alert">
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
        <Alert className="mb-6 border-success bg-success-light" role="status" aria-live="polite">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-success-muted">
                <strong>{suggestionNotification.count} champ{suggestionNotification.count > 1 ? 's' : ''}</strong> extrait{suggestionNotification.count > 1 ? 's' : ''} de {suggestionNotification.fileName}
              </span>
              <Badge variant="success">
                <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" />
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
      <ExtractionList
        extractions={extractions}
        expandedId={expandedExtraction}
        documentTypes={documentTypes}
        onToggleExpand={toggleExpand}
        onDelete={confirmDelete}
        onReapply={applyExtractedData}
      />

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
      <DetectionDialog
        open={!!detectionResult}
        detectionResult={detectionResult}
        documentTypes={documentTypes}
        onConfirm={confirmDetection}
        onChangeType={changeDetectedType}
        onCancel={cancelDetection}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={!!deleteConfirm}
        extraction={deleteConfirm}
        onConfirm={deleteExtraction}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
