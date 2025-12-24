/**
 * BordereauCard Component
 *
 * Displays a single bordereau (tax assessment notice) with:
 * - Type badge (ICC/IFD)
 * - Key amounts (revenu imposable, total tax)
 * - Delta vs declaration (if available)
 * - Payment status
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { formatCHF as formatCurrency } from '@/lib/formatting';

const BordereauCard = ({
  bordereau,
  comparison = null,
  compact = false,
  onView = null
}) => {
  if (!bordereau) return null;

  const { type, taxYear, revenuImposable, fortuneImposable, totalTax, notificationDate, paymentStatus } = bordereau;

  const isICC = type === 'icc';
  const typeLabel = isICC ? 'ICC' : 'IFD';
  const typeColor = isICC ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  const fullLabel = isICC
    ? 'Impôts cantonaux et communaux'
    : 'Impôt fédéral direct';

  // Delta display
  const deltaRevenu = comparison?.deltaRevenu || bordereau.deltaRevenu || 0;
  const hasDelta = Math.abs(deltaRevenu) > 0;
  const deltaIsPositive = deltaRevenu > 0;

  // Payment status
  const getPaymentBadge = () => {
    switch (paymentStatus) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Payé</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      case 'partial':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Partiel</Badge>;
      default:
        return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />En attente</Badge>;
    }
  };

  // Compact variant for inline display
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-lg border ${onView ? 'cursor-pointer hover:bg-muted/50' : ''}`}
        onClick={onView}
      >
        <div className="flex items-center gap-2">
          <Badge className={typeColor}>{typeLabel}</Badge>
          <span className="text-sm text-muted-foreground">
            {notificationDate ? new Date(notificationDate).toLocaleDateString('fr-CH') : taxYear}
          </span>
        </div>
        <div className="flex items-center gap-4">
          {hasDelta && (
            <span className={`text-xs flex items-center ${deltaIsPositive ? 'text-amber-600' : 'text-green-600'}`}>
              {deltaIsPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
              {deltaIsPositive ? '+' : ''}{formatCurrency(deltaRevenu)}
            </span>
          )}
          <span className="font-semibold">{formatCurrency(totalTax)}</span>
        </div>
      </div>
    );
  }

  // Full card variant
  return (
    <Card className={onView ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onView}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-base">{fullLabel}</CardTitle>
          </div>
          <Badge className={typeColor}>{typeLabel} {taxYear}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main amounts */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenu imposable</p>
            <p className="text-lg font-semibold">{formatCurrency(revenuImposable)}</p>
            {hasDelta && (
              <p className={`text-xs flex items-center mt-1 ${deltaIsPositive ? 'text-amber-600' : 'text-green-600'}`}>
                {deltaIsPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : deltaRevenu < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
                {deltaIsPositive ? '+' : ''}{formatCurrency(deltaRevenu)} vs déclaré
              </p>
            )}
          </div>

          {isICC && fortuneImposable > 0 && (
            <div>
              <p className="text-xs text-muted-foreground">Fortune imposable</p>
              <p className="text-lg font-semibold">{formatCurrency(fortuneImposable)}</p>
            </div>
          )}
        </div>

        {/* Tax total */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total des impôts</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(totalTax)}</p>
            </div>
            {getPaymentBadge()}
          </div>
        </div>

        {/* IFD specific: degrevement */}
        {!isICC && bordereau.adjustmentAmount && bordereau.adjustmentAmount !== 0 && (
          <div className="p-2 bg-muted rounded text-sm">
            <span className="text-muted-foreground">Dégrèvement: </span>
            <span className={bordereau.adjustmentAmount < 0 ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {formatCurrency(bordereau.adjustmentAmount)}
            </span>
          </div>
        )}

        {/* Notification date */}
        {notificationDate && (
          <p className="text-xs text-muted-foreground">
            Notifié le {new Date(notificationDate).toLocaleDateString('fr-CH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BordereauCard;
