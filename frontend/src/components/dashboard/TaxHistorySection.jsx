/**
 * TaxHistorySection Component
 *
 * Displays historical tax declarations and bordereaux in the dashboard.
 * Features:
 * - Year selector for available tax years
 * - Declaration summary with key amounts
 * - Bordereaux cards (ICC and IFD)
 * - Quick comparison view
 * - Drag and drop file upload
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Calendar,
  ChevronRight,
  Upload,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2,
  Eye,
  Loader2
} from 'lucide-react';
import { useTaxHistoryStore } from '@/stores/taxHistoryStore';
import BordereauCard from './BordereauCard';
import { formatCHF as formatCurrency } from '@/lib/formatting';

const TaxHistorySection = ({ onUploadClick, onViewDetails, onFileDrop }) => {
  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Drag handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if leaving the card entirely
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file =>
      file.type === 'application/pdf' ||
      file.type.startsWith('image/')
    );

    if (validFiles.length > 0 && onFileDrop) {
      setIsProcessing(true);
      try {
        await onFileDrop(validFiles);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [onFileDrop]);

  // File input handler
  const handleFileInput = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0 && onFileDrop) {
      setIsProcessing(true);
      try {
        await onFileDrop(files);
      } finally {
        setIsProcessing(false);
      }
    }
    // Reset input
    e.target.value = '';
  }, [onFileDrop]);
  const {
    getAvailableYears,
    getDeclarationByYear,
    getBordereauxByYear,
    getMostRecentDeclaration,
    isLoading
  } = useTaxHistoryStore();

  const availableYears = getAvailableYears();
  const [selectedYear, setSelectedYear] = useState(
    availableYears.length > 0 ? availableYears[0] : null
  );

  const declaration = useMemo(() =>
    selectedYear ? getDeclarationByYear(selectedYear) : null,
    [selectedYear, getDeclarationByYear]
  );

  const bordereaux = useMemo(() =>
    selectedYear ? getBordereauxByYear(selectedYear) : { icc: null, ifd: null },
    [selectedYear, getBordereauxByYear]
  );

  const mostRecent = getMostRecentDeclaration();

  // Calculate total tax for the year
  const totalTax = useMemo(() => {
    const iccTax = bordereaux.icc?.totalTax || 0;
    const ifdTax = bordereaux.ifd?.totalTax || 0;
    return iccTax + ifdTax;
  }, [bordereaux]);

  // Check if we have complete data for the year
  const hasDeclaration = !!declaration;
  const hasICC = !!bordereaux.icc;
  const hasIFD = !!bordereaux.ifd;
  const isComplete = hasDeclaration && hasICC && hasIFD;

  // Empty state with drop zone
  if (availableYears.length === 0) {
    return (
      <Card
        className={`transition-all duration-200 ${
          isDragging
            ? 'border-primary border-2 bg-primary/5 shadow-lg'
            : 'border-dashed border-2'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Historique fiscal
          </CardTitle>
          <CardDescription>
            Importez vos documents fiscaux pour voir votre historique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {isProcessing ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">
                  Analyse du document en cours...
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Extraction des données avec Claude AI
                </p>
              </>
            ) : isDragging ? (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <p className="text-primary font-medium mb-2">
                  Déposez votre document ici
                </p>
                <p className="text-sm text-muted-foreground">
                  Déclaration fiscale, bordereau ICC ou IFD
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">
                  Glissez vos documents ici
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Déclaration fiscale, bordereau ICC ou IFD (PDF)
                </p>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <Button variant="default" asChild>
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        Choisir un fichier
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileInput}
                      multiple
                    />
                  </label>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`relative transition-all duration-200 ${
        isDragging ? 'border-primary border-2 bg-primary/5 shadow-lg' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Upload className="w-12 h-12 text-primary mx-auto mb-2 animate-bounce" />
            <p className="text-primary font-medium">Déposez votre document ici</p>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Analyse en cours...</p>
          </div>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historique fiscal
            </CardTitle>
            <CardDescription>
              Consultez vos déclarations et bordereaux par année
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedYear?.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={onUploadClick}>
              <Upload className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Year completeness indicator */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            <span className="text-sm font-medium">
              Année {selectedYear}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasDeclaration ? 'default' : 'outline'} className="text-xs">
              Déclaration
            </Badge>
            <Badge variant={hasICC ? 'default' : 'outline'} className="text-xs">
              ICC
            </Badge>
            <Badge variant={hasIFD ? 'default' : 'outline'} className="text-xs">
              IFD
            </Badge>
          </div>
          {totalTax > 0 && (
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Total impôts</p>
              <p className="font-semibold">{formatCurrency(totalTax)}</p>
            </div>
          )}
        </div>

        {/* Declaration summary */}
        {hasDeclaration && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Déclaration {selectedYear}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Revenu brut</p>
                <p className="font-semibold">{formatCurrency(declaration.revenuBrutICC || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Revenu net ICC</p>
                <p className="font-semibold">{formatCurrency(declaration.revenuNetICC || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fortune nette</p>
                <p className="font-semibold">{formatCurrency(declaration.fortuneNetteICC || 0)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pilier 3a</p>
                <p className="font-semibold">{formatCurrency(declaration.deductions?.['31.40'] || 0)}</p>
              </div>
            </div>

            {/* Delta indicators if we have bordereaux */}
            {(hasICC || hasIFD) && (
              <div className="flex items-center gap-4 text-sm">
                {hasICC && bordereaux.icc.deltaRevenu !== 0 && (
                  <DeltaIndicator
                    label="Δ Revenu ICC"
                    value={bordereaux.icc.deltaRevenu}
                  />
                )}
                {hasIFD && bordereaux.ifd.deltaRevenu !== 0 && (
                  <DeltaIndicator
                    label="Δ Revenu IFD"
                    value={bordereaux.ifd.deltaRevenu}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Bordereaux */}
        {(hasICC || hasIFD) && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Bordereaux {selectedYear}</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {hasICC && (
                <BordereauCard
                  bordereau={bordereaux.icc}
                  onView={() => onViewDetails?.('bordereau', bordereaux.icc.id)}
                />
              )}
              {hasIFD && (
                <BordereauCard
                  bordereau={bordereaux.ifd}
                  onView={() => onViewDetails?.('bordereau', bordereaux.ifd.id)}
                />
              )}
            </div>
          </div>
        )}

        {/* Missing documents notice */}
        {!isComplete && (
          <div className="p-4 border border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Documents manquants pour {selectedYear}:
            </p>
            <div className="flex flex-wrap gap-2">
              {!hasDeclaration && (
                <Button variant="outline" size="sm" onClick={onUploadClick}>
                  <Upload className="w-3 h-3 mr-1" />
                  Déclaration fiscale
                </Button>
              )}
              {!hasICC && (
                <Button variant="outline" size="sm" onClick={onUploadClick}>
                  <Upload className="w-3 h-3 mr-1" />
                  Bordereau ICC
                </Button>
              )}
              {!hasIFD && (
                <Button variant="outline" size="sm" onClick={onUploadClick}>
                  <Upload className="w-3 h-3 mr-1" />
                  Bordereau IFD
                </Button>
              )}
            </div>
          </div>
        )}

        {/* View details button */}
        {(hasDeclaration || hasICC || hasIFD) && onViewDetails && (
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onViewDetails?.('year', selectedYear)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Voir le détail complet
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Delta indicator component
 */
const DeltaIndicator = ({ label, value }) => {
  if (value === 0) return null;

  const isPositive = value > 0;
  const Icon = isPositive ? TrendingUp : value < 0 ? TrendingDown : Minus;
  const colorClass = isPositive ? 'text-amber-600' : 'text-green-600';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs">
        {label}: {isPositive ? '+' : ''}{formatCurrency(value)}
      </span>
    </div>
  );
};

export default TaxHistorySection;
