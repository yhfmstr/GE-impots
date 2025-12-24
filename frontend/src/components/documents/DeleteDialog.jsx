import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/**
 * DeleteDialog - Confirmation dialog for deleting extractions
 *
 * Props:
 * - open: boolean - Dialog open state
 * - extraction: object - Extraction to delete
 * - onConfirm: function - Confirm delete handler
 * - onCancel: function - Cancel delete handler
 */
export default function DeleteDialog({
  open,
  extraction,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog open={open} onOpenChange={() => onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer le document?</DialogTitle>
          <DialogDescription>
            Cette action supprimera les données extraites de ce document.
          </DialogDescription>
        </DialogHeader>

        {extraction && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription>
              <p className="font-medium">{extraction.documentName}</p>
              <p className="text-sm">{extraction.fileName}</p>
            </AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-text-secondary">
          Les données déjà appliquées au questionnaire ne seront pas affectées.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
