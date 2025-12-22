import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GETAX_PAGES, DOCUMENT_TYPE_NAMES, getAnnexeById } from '@/config/getax-annexes';

/**
 * Annexe selector dropdown with document hints
 */
export default function AnnexeSelector({ selectedPage, onSelectPage, uploadedDocTypes, onOpenUpload }) {
  // Get missing documents for current page
  const getMissingDocuments = () => {
    if (!selectedPage.documentTypes) return [];
    return selectedPage.documentTypes.filter(dt => !uploadedDocTypes.includes(dt));
  };

  const missingDocs = getMissingDocuments();

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <Label className="mb-2 block">Page GeTax actuelle:</Label>
        <Select
          value={selectedPage.id}
          onValueChange={(value) => onSelectPage(getAnnexeById(value) || GETAX_PAGES[0])}
        >
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
                onClick={onOpenUpload}
                className="ml-2 p-0 h-auto"
              >
                Importer un document
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
