import { useState, useCallback, useEffect } from 'react';
import { Upload, ChevronRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadApi } from '@/lib/api';
import { loadSecure, saveSecure, STORAGE_KEYS } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { DOCUMENT_TYPE_NAMES } from '@/config/getax-annexes';

/**
 * Document upload section with drag-and-drop support
 */
export default function DocumentUpload({
  selectedPage,
  onDataExtracted,
  onDocTypeUploaded
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

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

        // Save extraction to extractions list
        const extractions = loadSecure(STORAGE_KEYS.EXTRACTIONS, []);
        extractions.unshift({
          id: Date.now(),
          fileName: file.name,
          ...response.data,
          timestamp: new Date().toISOString(),
        });
        saveSecure(STORAGE_KEYS.EXTRACTIONS, extractions);

        // Notify parent components
        onDataExtracted(merged);
        onDocTypeUploaded(uploadDocType);

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

  // Don't render if no document types for this page
  if (!selectedPage.documentTypes?.length) {
    return null;
  }

  return (
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
  );
}
