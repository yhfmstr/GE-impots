/**
 * ComparisonPanel Component
 *
 * Displays comparisons between:
 * 1. Declared amounts vs Final assessed amounts (same year)
 * 2. Year-over-year evolution
 *
 * Helps users understand:
 * - Why their final tax differs from declaration
 * - How their situation evolved over years
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Scale,
  Calendar
} from 'lucide-react';
import { formatCHF as formatCurrency } from '@/lib/formatting';
import { useTaxHistoryStore } from '@/stores/taxHistoryStore';

const ComparisonPanel = ({ selectedYear, previousYear = null }) => {
  const {
    getDeclarationByYear,
    getBordereauxByYear,
    getComparisonByYear
  } = useTaxHistoryStore();

  // Current year data
  const currentDeclaration = getDeclarationByYear(selectedYear);
  const currentBordereaux = getBordereauxByYear(selectedYear);
  const currentComparison = getComparisonByYear(selectedYear);

  // Previous year data (for YoY comparison)
  const prevYear = previousYear || (selectedYear ? selectedYear - 1 : null);
  const prevDeclaration = prevYear ? getDeclarationByYear(prevYear) : null;
  const prevBordereaux = prevYear ? getBordereauxByYear(prevYear) : null;

  // Check if we have data for comparisons
  const hasDeclaredVsAssessed = currentDeclaration && (currentBordereaux.icc || currentBordereaux.ifd);
  const hasYearOverYear = prevDeclaration && currentDeclaration;

  if (!hasDeclaredVsAssessed && !hasYearOverYear) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Comparaisons
          </CardTitle>
          <CardDescription>
            Importez plus de documents pour voir les comparaisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Les comparaisons seront disponibles une fois que vous aurez importé
            votre déclaration et les bordereaux correspondants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-5 h-5" />
          Comparaisons
        </CardTitle>
        <CardDescription>
          Analysez les écarts entre déclaré et final, et l'évolution année après année
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="declared-vs-assessed">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="declared-vs-assessed" disabled={!hasDeclaredVsAssessed}>
              Déclaré vs Final
            </TabsTrigger>
            <TabsTrigger value="year-over-year" disabled={!hasYearOverYear}>
              Évolution annuelle
            </TabsTrigger>
          </TabsList>

          {/* Declared vs Assessed Tab */}
          <TabsContent value="declared-vs-assessed" className="space-y-4 mt-4">
            {hasDeclaredVsAssessed && (
              <>
                <div className="text-sm text-muted-foreground mb-4">
                  Comparaison entre votre déclaration et les montants retenus par l'administration pour {selectedYear}
                </div>

                {/* ICC Comparison */}
                {currentBordereaux.icc && (
                  <ComparisonRow
                    label="Revenu imposable ICC"
                    declared={currentDeclaration?.revenuNetICC}
                    assessed={currentBordereaux.icc.revenuImposable}
                    type="icc"
                  />
                )}

                {/* Fortune comparison (ICC only) */}
                {currentBordereaux.icc && currentDeclaration?.fortuneNetteICC > 0 && (
                  <ComparisonRow
                    label="Fortune imposable"
                    declared={currentDeclaration?.fortuneNetteICC}
                    assessed={currentBordereaux.icc.fortuneImposable}
                    type="fortune"
                  />
                )}

                {/* IFD Comparison */}
                {currentBordereaux.ifd && (
                  <ComparisonRow
                    label="Revenu imposable IFD"
                    declared={currentDeclaration?.revenuNetIFD}
                    assessed={currentBordereaux.ifd.revenuImposable}
                    type="ifd"
                  />
                )}

                {/* Summary */}
                <DeltaSummary
                  iccDelta={currentBordereaux.icc?.deltaRevenu}
                  ifdDelta={currentBordereaux.ifd?.deltaRevenu}
                  fortuneDelta={currentBordereaux.icc?.deltaFortune}
                />
              </>
            )}
          </TabsContent>

          {/* Year over Year Tab */}
          <TabsContent value="year-over-year" className="space-y-4 mt-4">
            {hasYearOverYear && (
              <>
                <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Évolution {prevYear} → {selectedYear}
                </div>

                <YoYComparisonRow
                  label="Revenu brut"
                  previous={prevDeclaration?.revenuBrutICC}
                  current={currentDeclaration?.revenuBrutICC}
                />

                <YoYComparisonRow
                  label="Revenu net ICC"
                  previous={prevDeclaration?.revenuNetICC}
                  current={currentDeclaration?.revenuNetICC}
                />

                <YoYComparisonRow
                  label="Fortune nette"
                  previous={prevDeclaration?.fortuneNetteICC}
                  current={currentDeclaration?.fortuneNetteICC}
                />

                {/* Tax evolution if we have bordereaux for both years */}
                {prevBordereaux?.icc && currentBordereaux?.icc && (
                  <YoYComparisonRow
                    label="Impôt ICC"
                    previous={prevBordereaux.icc.totalTax}
                    current={currentBordereaux.icc.totalTax}
                    highlight
                  />
                )}

                {prevBordereaux?.ifd && currentBordereaux?.ifd && (
                  <YoYComparisonRow
                    label="Impôt IFD"
                    previous={prevBordereaux.ifd.totalTax}
                    current={currentBordereaux.ifd.totalTax}
                    highlight
                  />
                )}

                {/* Deductions evolution */}
                {(prevDeclaration?.deductions?.['31.40'] || currentDeclaration?.deductions?.['31.40']) && (
                  <YoYComparisonRow
                    label="Pilier 3a"
                    previous={prevDeclaration?.deductions?.['31.40'] || 0}
                    current={currentDeclaration?.deductions?.['31.40'] || 0}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

/**
 * Single comparison row for declared vs assessed
 */
const ComparisonRow = ({ label, declared, assessed, type }) => {
  const delta = (assessed || 0) - (declared || 0);
  const percentChange = declared > 0 ? (delta / declared) * 100 : 0;
  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < 100; // Less than 100 CHF difference

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-amber-600'
      : 'text-green-600';

  const badgeVariant = isNeutral ? 'secondary' : isPositive ? 'destructive' : 'default';

  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant={type === 'icc' ? 'default' : type === 'ifd' ? 'secondary' : 'outline'}>
          {type.toUpperCase()}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Déclaré</p>
            <p className="font-medium">{formatCurrency(declared || 0)}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">Retenu</p>
            <p className="font-medium">{formatCurrency(assessed || 0)}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1 ${colorClass}`}>
          <Icon className="w-4 h-4" />
          <span className="font-medium">
            {isPositive ? '+' : ''}{formatCurrency(delta)}
          </span>
          {Math.abs(percentChange) > 0.5 && (
            <span className="text-xs">
              ({isPositive ? '+' : ''}{percentChange.toFixed(1)}%)
            </span>
          )}
        </div>
      </div>

      {/* Progress bar visualization */}
      <div className="pt-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Déclaré</span>
          <span>Retenu</span>
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary/30 rounded-full"
            style={{ width: `${Math.min(100, (declared / Math.max(declared, assessed)) * 100)}%` }}
          />
          <div
            className={`absolute h-full rounded-full ${isPositive ? 'bg-amber-500' : 'bg-green-500'}`}
            style={{ width: `${Math.min(100, (assessed / Math.max(declared, assessed)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Year over Year comparison row
 */
const YoYComparisonRow = ({ label, previous, current, highlight = false }) => {
  const delta = (current || 0) - (previous || 0);
  const percentChange = previous > 0 ? (delta / previous) * 100 : 0;
  const isPositive = delta > 0;
  const isNeutral = Math.abs(percentChange) < 1;

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-amber-600'
      : 'text-green-600';

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg ${highlight ? 'bg-muted' : 'border'}`}>
      <span className={`text-sm ${highlight ? 'font-medium' : ''}`}>{label}</span>

      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {formatCurrency(previous || 0)}
        </span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className={`text-sm ${highlight ? 'font-semibold' : 'font-medium'}`}>
          {formatCurrency(current || 0)}
        </span>

        <div className={`flex items-center gap-1 ${colorClass} min-w-[100px] justify-end`}>
          <Icon className="w-4 h-4" />
          <span className="text-sm">
            {isPositive ? '+' : ''}{percentChange.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Summary of all deltas
 */
const DeltaSummary = ({ iccDelta, ifdDelta, fortuneDelta }) => {
  const totalDelta = (iccDelta || 0) + (ifdDelta || 0);
  const hasSignificantDelta = Math.abs(totalDelta) > 1000;

  if (!hasSignificantDelta) {
    return (
      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg text-green-700 dark:text-green-300">
        <CheckCircle className="w-5 h-5" />
        <span className="text-sm">
          Pas d'écart significatif entre votre déclaration et les montants retenus.
        </span>
      </div>
    );
  }

  const isHigher = totalDelta > 0;

  return (
    <div className={`p-4 rounded-lg ${isHigher ? 'bg-amber-50 dark:bg-amber-950' : 'bg-green-50 dark:bg-green-950'}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 ${isHigher ? 'text-amber-600' : 'text-green-600'}`} />
        <div>
          <p className={`text-sm font-medium ${isHigher ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
            {isHigher
              ? 'L\'administration a retenu un revenu imposable plus élevé'
              : 'L\'administration a retenu un revenu imposable plus bas'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isHigher
              ? 'Cela peut être dû à des déductions refusées ou des revenus supplémentaires pris en compte.'
              : 'Des déductions supplémentaires ont peut-être été appliquées.'}
          </p>
          <div className="mt-2 flex items-center gap-4">
            {iccDelta !== undefined && iccDelta !== 0 && (
              <Badge variant="outline">
                ICC: {iccDelta > 0 ? '+' : ''}{formatCurrency(iccDelta)}
              </Badge>
            )}
            {ifdDelta !== undefined && ifdDelta !== 0 && (
              <Badge variant="outline">
                IFD: {ifdDelta > 0 ? '+' : ''}{formatCurrency(ifdDelta)}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPanel;
