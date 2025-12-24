import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

/**
 * UploadZone - Drag and drop upload area for documents
 *
 * Props:
 * - uploading: boolean - Is upload in progress
 * - detecting: boolean - Is type detection in progress
 * - dragActive: boolean - Is file being dragged over
 * - onDragEnter: function - Drag enter handler
 * - onDragLeave: function - Drag leave handler
 * - onDragOver: function - Drag over handler
 * - onDrop: function - Drop handler
 * - onFileInput: function - File input change handler
 */
export default function UploadZone({
  uploading,
  detecting,
  dragActive,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
  onFileInput,
}) {
  const isProcessing = uploading || detecting;

  return (
    <Card className={`mb-6 border-2 border-dashed transition-colors ${
      dragActive ? 'border-primary bg-primary-light' : 'border-border hover:border-muted-foreground'
    }`}>
      <CardContent
        className="p-8"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="text-center">
          {isProcessing ? (
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
                  onChange={onFileInput}
                  aria-label="Sélectionner un fichier à télécharger"
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
  );
}
