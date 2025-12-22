import { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCHF, formatConfidence } from '@/lib/formatting';

/**
 * AutoFillPanel - Floating panel showing all pending suggestions
 *
 * Props:
 * - suggestions: Array of suggestion objects
 * - onAccept: Callback when accepting a suggestion
 * - onReject: Callback when rejecting a suggestion
 * - onAcceptAll: Callback when accepting all suggestions
 * - onRejectAll: Callback when rejecting all suggestions
 * - onClose: Callback to close the panel
 */
export default function AutoFillPanel({
  suggestions = [],
  onAccept,
  onReject,
  onAcceptAll,
  onRejectAll,
  onClose
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter to only pending suggestions
  const pendingSuggestions = suggestions.filter(s => s.accepted === null);
  const acceptedSuggestions = suggestions.filter(s => s.accepted === true);
  const rejectedSuggestions = suggestions.filter(s => s.accepted === false);

  // Group by confidence level
  const highConfidence = pendingSuggestions.filter(s => s.confidence >= 0.8);
  const mediumConfidence = pendingSuggestions.filter(s => s.confidence >= 0.6 && s.confidence < 0.8);
  const lowConfidence = pendingSuggestions.filter(s => s.confidence < 0.6);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-info shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-info" />
            Suggestions automatiques
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingSuggestions.length > 0 && (
              <Badge variant="secondary" className="bg-info-light text-info-muted">
                {pendingSuggestions.length} en attente
              </Badge>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-secondary rounded"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* Bulk actions */}
          {pendingSuggestions.length > 0 && (
            <div className="flex gap-2 mb-4">
              <Button
                size="sm"
                className="flex-1 bg-success hover:bg-success-muted text-success-foreground"
                onClick={() => onAcceptAll?.(highConfidence.length > 0 ? highConfidence : pendingSuggestions)}
              >
                <Check className="w-4 h-4 mr-1" />
                {highConfidence.length > 0
                  ? `Accepter ${highConfidence.length} fiable${highConfidence.length > 1 ? 's' : ''}`
                  : 'Tout accepter'
                }
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-text-secondary"
                onClick={() => onRejectAll?.(pendingSuggestions)}
              >
                <X className="w-4 h-4 mr-1" />
                Tout rejeter
              </Button>
            </div>
          )}

          {/* Pending suggestions list */}
          {pendingSuggestions.length > 0 ? (
            <div className="space-y-2">
              {/* High confidence */}
              {highConfidence.length > 0 && (
                <SuggestionGroup
                  title="Confiance élevée"
                  suggestions={highConfidence}
                  onAccept={onAccept}
                  onReject={onReject}
                  badgeClass="bg-success-light text-success-muted"
                />
              )}

              {/* Medium confidence */}
              {mediumConfidence.length > 0 && (
                <SuggestionGroup
                  title="Confiance moyenne"
                  suggestions={mediumConfidence}
                  onAccept={onAccept}
                  onReject={onReject}
                  badgeClass="bg-warning-light text-warning-muted"
                />
              )}

              {/* Low confidence */}
              {lowConfidence.length > 0 && (
                <SuggestionGroup
                  title="À vérifier"
                  suggestions={lowConfidence}
                  onAccept={onAccept}
                  onReject={onReject}
                  badgeClass="bg-destructive-light text-destructive-muted"
                />
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
              <p className="text-sm text-text-secondary">Toutes les suggestions ont été traitées</p>
              {acceptedSuggestions.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {acceptedSuggestions.length} acceptée{acceptedSuggestions.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* History of processed suggestions */}
          {(acceptedSuggestions.length > 0 || rejectedSuggestions.length > 0) && pendingSuggestions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Historique</p>
              <div className="flex gap-2 text-xs">
                {acceptedSuggestions.length > 0 && (
                  <span className="flex items-center gap-1 text-success">
                    <CheckCircle2 className="w-3 h-3" />
                    {acceptedSuggestions.length} acceptée{acceptedSuggestions.length > 1 ? 's' : ''}
                  </span>
                )}
                {rejectedSuggestions.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive">
                    <XCircle className="w-3 h-3" />
                    {rejectedSuggestions.length} rejetée{rejectedSuggestions.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Group of suggestions with a title
 */
function SuggestionGroup({ title, suggestions, onAccept, onReject, badgeClass }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Badge variant="outline" className={`text-xs ${badgeClass}`}>
          {title}
        </Badge>
        <span className="text-xs text-text-light">({suggestions.length})</span>
      </div>
      <div className="space-y-1.5">
        {suggestions.map(suggestion => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual suggestion item
 */
function SuggestionItem({ suggestion, onAccept, onReject }) {
  const confidenceStyle = formatConfidence(suggestion.confidence);
  const valueFormatted = typeof suggestion.value === 'number'
    ? formatCHF(suggestion.value)
    : suggestion.value;

  return (
    <div className={`flex items-center gap-2 p-2 rounded-lg border ${confidenceStyle.borderClass} ${confidenceStyle.bgClass}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-secondary-foreground truncate">
            {suggestion.label || suggestion.fieldKey}
          </span>
          <span className="text-sm text-muted-foreground">→</span>
          <span className="text-sm font-semibold text-foreground">
            {valueFormatted}
          </span>
        </div>
        {suggestion.source && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <FileText className="w-3 h-3" />
            <span className="truncate">{suggestion.source}</span>
          </div>
        )}
        {suggestion.warning && (
          <div className="flex items-center gap-1 text-xs text-warning mt-0.5">
            <AlertCircle className="w-3 h-3" />
            <span>{suggestion.warning}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-success hover:text-success-muted hover:bg-success-light"
          onClick={() => onAccept?.(suggestion)}
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive-muted hover:bg-destructive-light"
          onClick={() => onReject?.(suggestion)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Floating trigger button for the panel
 */
export function AutoFillTrigger({ count, onClick }) {
  if (!count || count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-2.5 bg-info text-info-foreground rounded-full shadow-lg hover:bg-info/90 transition-all hover:scale-105"
    >
      <Sparkles className="w-5 h-5" />
      <span className="font-medium">{count} suggestion{count > 1 ? 's' : ''}</span>
    </button>
  );
}
