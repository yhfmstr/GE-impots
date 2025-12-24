/**
 * DeclarationStatusCard Component
 *
 * Shows declaration status for a specific year with:
 * - Status indicator (Non commencée, En cours %, Finalisée)
 * - Progress bar
 * - Action buttons (Start, Continue, View)
 * - Last modified date
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Play,
  ArrowRight,
  CheckCircle2,
  Clock,
  Circle,
  Eye,
  RotateCcw,
  Loader2
} from 'lucide-react';
import { useDeclarationYearStore, DECLARATION_STATUS } from '@/stores/declarationYearStore';
import { formatRelativeTime } from '@/lib/formatting';

const DeclarationStatusCard = ({
  year,
  onStart,
  onContinue,
  onView,
  onReopen,
  compact = false
}) => {
  const {
    getDeclaration,
    getStatus,
    getStatusLabel,
    getCompletionPercent,
    activeYear,
    setActiveYear,
    isLoading
  } = useDeclarationYearStore();

  const declaration = getDeclaration(year);
  const status = getStatus(year);
  const statusLabel = getStatusLabel(year);
  const percent = getCompletionPercent(year);
  const isActive = activeYear === year;

  // Status config
  const statusConfig = {
    [DECLARATION_STATUS.NOT_STARTED]: {
      icon: Circle,
      color: 'text-muted-foreground',
      badgeVariant: 'secondary',
      bgClass: ''
    },
    [DECLARATION_STATUS.IN_PROGRESS]: {
      icon: Clock,
      color: 'text-amber-500',
      badgeVariant: 'warning',
      bgClass: 'border-amber-200 dark:border-amber-800'
    },
    [DECLARATION_STATUS.FINALIZED]: {
      icon: CheckCircle2,
      color: 'text-green-500',
      badgeVariant: 'default',
      bgClass: 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20'
    }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  // Handle actions
  const handleStart = () => {
    setActiveYear(year);
    onStart?.(year);
  };

  const handleContinue = () => {
    setActiveYear(year);
    onContinue?.(year);
  };

  const handleView = () => {
    setActiveYear(year);
    onView?.(year);
  };

  const handleReopen = () => {
    onReopen?.(year);
  };

  // Compact variant for list view
  if (compact) {
    return (
      <div
        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
          isActive ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/50'
        } ${config.bgClass}`}
      >
        <div className="flex items-center gap-3">
          <StatusIcon className={`w-5 h-5 ${config.color}`} />
          <div>
            <p className="font-medium">Déclaration {year}</p>
            <p className="text-sm text-muted-foreground">{statusLabel}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === DECLARATION_STATUS.IN_PROGRESS && (
            <div className="w-24 mr-2">
              <Progress value={percent} className="h-2" />
            </div>
          )}

          {status === DECLARATION_STATUS.NOT_STARTED && (
            <Button size="sm" onClick={handleStart} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Play className="w-4 h-4 mr-1" />}
              Commencer
            </Button>
          )}

          {status === DECLARATION_STATUS.IN_PROGRESS && (
            <Button size="sm" onClick={handleContinue} disabled={isLoading}>
              Continuer
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}

          {status === DECLARATION_STATUS.FINALIZED && (
            <>
              <Button size="sm" variant="outline" onClick={handleView} disabled={isLoading}>
                <Eye className="w-4 h-4 mr-1" />
                Voir
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReopen} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full card variant
  return (
    <Card className={`transition-colors ${isActive ? 'border-primary' : ''} ${config.bgClass}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Déclaration {year}</CardTitle>
          </div>
          <Badge variant={config.badgeVariant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {status === DECLARATION_STATUS.IN_PROGRESS ? `${percent}%` : statusLabel}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar for in-progress declarations */}
        {status === DECLARATION_STATUS.IN_PROGRESS && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{percent}%</span>
            </div>
            <Progress value={percent} className="h-2" />
          </div>
        )}

        {/* Timestamps */}
        {declaration.lastModifiedAt && (
          <p className="text-xs text-muted-foreground">
            Dernière modification: {formatRelativeTime(declaration.lastModifiedAt)}
          </p>
        )}

        {declaration.finalizedAt && (
          <p className="text-xs text-green-600">
            Finalisée: {formatRelativeTime(declaration.finalizedAt)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {status === DECLARATION_STATUS.NOT_STARTED && (
            <Button className="flex-1" onClick={handleStart} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Commencer la déclaration
            </Button>
          )}

          {status === DECLARATION_STATUS.IN_PROGRESS && (
            <Button className="flex-1" onClick={handleContinue} disabled={isLoading}>
              Continuer la déclaration
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {status === DECLARATION_STATUS.FINALIZED && (
            <>
              <Button variant="outline" className="flex-1" onClick={handleView} disabled={isLoading}>
                <Eye className="w-4 h-4 mr-2" />
                Consulter
              </Button>
              <Button variant="ghost" onClick={handleReopen} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RotateCcw className="w-4 h-4 mr-2" />}
                Modifier
              </Button>
            </>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <p className="text-xs text-primary text-center">
            Année sélectionnée
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DeclarationStatusCard;
