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
    if (field.code === '31.50') {
      return calculateForfait(userData.grossSalary, userData.avsContributions, userData.lppContributions, 'ICC');
    }
    if (field.code === '31.20') {
      return calculateForfait(userData.grossSalary, userData.avsContributions, userData.lppContributions, 'IFD');
    }
    return null;
  }
  return userData[field.dataKey] || null;
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
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <CardTitle>Rubriques à remplir</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {selectedPage.fields.map((field) => {
            const value = getFieldValue(field, userData);
            const isOverLimit = field.limit && value > field.limit;

            return (
              <div key={field.code} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{field.code}</Badge>
                      <span className="font-medium text-gray-900">{field.name}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {field.calculated ? (
                        <span className="text-blue-600">Calculé: {field.formula}</span>
                      ) : (
                        <span>Source: {field.source}</span>
                      )}
                    </div>
                    {isOverLimit && (
                      <div className="mt-1 flex items-center gap-1 text-amber-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Limite dépassée! Max: {field.limit.toLocaleString('fr-CH')} CHF</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {value !== null ? (
                      <>
                        <span className={`font-mono text-lg ${isOverLimit ? 'text-amber-600' : 'text-gray-900'}`}>
                          CHF {value.toLocaleString('fr-CH')}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyValue(field.code, value)}
                          title="Copier la valeur"
                        >
                          {copiedCode === field.code ? (
                            <Check className="w-5 h-5 text-green-600" />
                          ) : (
                            <Copy className="w-5 h-5 text-gray-400" />
                          )}
                        </Button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Non renseigné</span>
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
