import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

/**
 * DetectionDialog - Auto-detection confirmation dialog
 *
 * Props:
 * - open: boolean - Dialog open state
 * - detectionResult: object - Detection result data
 * - documentTypes: array - Available document types
 * - onConfirm: function - Confirm detection handler
 * - onChangeType: function - Change detected type handler
 * - onCancel: function - Cancel detection handler
 */
export default function DetectionDialog({
  open,
  detectionResult,
  documentTypes,
  onConfirm,
  onChangeType,
  onCancel,
}) {
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'text-success';
    if (confidence >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple" aria-hidden="true" />
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
              <Label htmlFor="detection-type-select" className="mb-2 block">
                {detectionResult.success ? 'Corriger si nécessaire:' : 'Sélectionner le type:'}
              </Label>
              <Select
                value={detectionResult.detectedType || ''}
                onValueChange={onChangeType}
              >
                <SelectTrigger id="detection-type-select" className="w-full">
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
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!detectionResult?.detectedType}
          >
            Confirmer et extraire
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
