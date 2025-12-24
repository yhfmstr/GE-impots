import { Check, AlertCircle, ChevronDown, ChevronUp, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * ExtractionList - Displays list of extracted documents
 *
 * Props:
 * - extractions: array - List of extraction results
 * - expandedId: string|null - Currently expanded extraction ID
 * - documentTypes: array - Available document types
 * - onToggleExpand: function - Toggle expansion of an extraction
 * - onDelete: function - Delete extraction handler
 * - onReapply: function - Reapply extraction data handler
 */
export default function ExtractionList({
  extractions,
  expandedId,
  documentTypes,
  onToggleExpand,
  onDelete,
  onReapply,
}) {
  const getTypeConfig = (typeId) => {
    return documentTypes.find(t => t.id === typeId);
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '-';
    if (type === 'number') return `CHF ${value.toLocaleString('fr-CH')}`;
    if (type === 'boolean') return value ? 'Oui' : 'Non';
    return value;
  };

  if (extractions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents analysés</CardTitle>
        <span className="text-sm text-muted-foreground">{extractions.length} document(s)</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {extractions.map((extraction) => {
            const typeConfig = getTypeConfig(extraction.documentType);
            const isExpanded = expandedId === extraction.id;

            return (
              <div key={extraction.id} className="p-4">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => onToggleExpand(extraction.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onToggleExpand(extraction.id);
                    }
                  }}
                  aria-expanded={isExpanded}
                  aria-label={`${extraction.documentName} - ${extraction.fileName}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      extraction.success ? 'bg-success-light' : 'bg-destructive-light'
                    }`}>
                      {extraction.success ? (
                        <Check className="w-5 h-5 text-success" aria-hidden="true" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-destructive" aria-hidden="true" />
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
                        onDelete(extraction);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Supprimer ce document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
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
                      onClick={() => onReapply(extraction.data)}
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
  );
}
