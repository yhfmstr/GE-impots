import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Calculate professional expenses forfait
 */
const calculateForfait = (gross, avs, lpp, type) => {
  const base = gross - avs - lpp;
  const forfait = base * 0.03;
  if (type === 'ICC') {
    return Math.min(Math.max(forfait, 634), 1796);
  } else {
    return Math.min(Math.max(forfait, 2000), 4000);
  }
};

/**
 * Get field value from user data or calculate it
 */
const getFieldValue = (field, userData) => {
  if (field.calculated) {
    // Only calculate if we have the required base data
    if (field.code === '31.50' || field.code === '31.20') {
      if (!userData.grossSalary) return null; // Can't calculate without salary
      const type = field.code === '31.50' ? 'ICC' : 'IFD';
      const result = calculateForfait(
        userData.grossSalary || 0,
        userData.avsContributions || 0,
        userData.lppContributions || 0,
        type
      );
      return isNaN(result) ? null : result;
    }
    return null;
  }
  const value = userData[field.dataKey];
  return value !== undefined && value !== null ? value : null;
};

/**
 * Rubriques list component - displays all fields for the selected annexe
 */
export default function RubriquesList({ selectedPage, userData }) {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyValue = (code, value) => {
    navigator.clipboard.writeText(value.toString());
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle>Rubriques à remplir</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {selectedPage.fields.map((field) => {
            const value = getFieldValue(field, userData);
            const isOverLimit = field.limit && value > field.limit;

            return (
              <div key={field.code} className="p-4 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{field.code}</Badge>
                      <span className="font-medium text-foreground">{field.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {field.calculated ? (
                        <span className="text-info">Calculé: {field.formula}</span>
                      ) : (
                        <span>Source: {field.source}</span>
                      )}
                    </div>
                    {isOverLimit && (
                      <div className="mt-1 flex items-center gap-1 text-warning text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Limite dépassée! Max: {field.limit.toLocaleString('fr-CH')} CHF</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {value !== null ? (
                      <>
                        <span className={`font-mono text-lg ${isOverLimit ? 'text-warning' : 'text-foreground'}`}>
                          CHF {value.toLocaleString('fr-CH')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyValue(field.code, value)}
                          title="Copier la valeur"
                        >
                          {copiedCode === field.code ? (
                            <Check className="w-5 h-5 text-success" />
                          ) : (
                            <Copy className="w-5 h-5 text-text-light" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="text-text-light italic">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
