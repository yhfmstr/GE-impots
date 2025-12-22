import { useState } from 'react';
import { Sparkles, Check, X, AlertCircle, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCHF, formatConfidence } from '@/lib/formatting';

/**
 * SuggestionIndicator - Shows a badge for fields with pending suggestions
 *
 * Props:
 * - suggestion: The suggestion object { fieldKey, value, confidence, source, ... }
 * - currentValue: Current value in the form
 * - onAccept: Callback when user accepts the suggestion
 * - onReject: Callback when user rejects the suggestion
 * - compact: Boolean for compact mode (just icon)
 */
export default function SuggestionIndicator({
  suggestion,
  currentValue,
  onAccept,
  onReject,
  compact = false
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!suggestion || suggestion.accepted !== null) {
    return null;
  }

  const confidenceStyle = formatConfidence(suggestion.confidence);
  const hasConflict = currentValue !== null && currentValue !== undefined && currentValue !== '' && currentValue !== 0;
  const suggestedValueFormatted = typeof suggestion.value === 'number'
    ? formatCHF(suggestion.value)
    : suggestion.value;

  // Compact mode - just the sparkle icon
  if (compact) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`relative inline-flex items-center justify-center w-6 h-6 rounded-full ${confidenceStyle.bgClass} hover:opacity-80 transition-opacity`}
        title={`Suggestion disponible: ${suggestedValueFormatted}`}
      >
        <Sparkles className={`w-3.5 h-3.5 ${confidenceStyle.textClass}`} />
        {isExpanded && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <SuggestionPopover
              suggestion={suggestion}
              currentValue={currentValue}
              onAccept={onAccept}
              onReject={onReject}
              onClose={() => setIsExpanded(false)}
            />
          </div>
        )}
      </button>
    );
  }

  // Full inline mode
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${confidenceStyle.borderClass} ${confidenceStyle.bgClass}`}>
      <Sparkles className={`w-4 h-4 ${confidenceStyle.textClass} flex-shrink-0`} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-secondary-foreground">
            Suggestion: {suggestedValueFormatted}
          </span>
          <Badge variant="outline" className={`text-xs ${confidenceStyle.bgClass} ${confidenceStyle.textClass}`}>
            {Math.round(suggestion.confidence * 100)}%
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <FileText className="w-3 h-3" />
          <span className="truncate">{suggestion.source}</span>
        </div>

        {hasConflict && (
          <div className="flex items-center gap-1 text-xs text-warning mt-1">
            <AlertCircle className="w-3 h-3" />
            <span>Remplace: {typeof currentValue === 'number' ? formatCHF(currentValue) : currentValue}</span>
          </div>
        )}
      </div>

      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-success hover:text-success-muted hover:bg-success-light"
          onClick={() => onAccept?.(suggestion)}
          title="Accepter"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive-muted hover:bg-destructive-light"
          onClick={() => onReject?.(suggestion)}
          title="Rejeter"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Popover content for compact mode
 */
function SuggestionPopover({ suggestion, currentValue, onAccept, onReject, onClose }) {
  const confidenceStyle = formatConfidence(suggestion.confidence);
  const hasConflict = currentValue !== null && currentValue !== undefined && currentValue !== '' && currentValue !== 0;
  const suggestedValueFormatted = typeof suggestion.value === 'number'
    ? formatCHF(suggestion.value)
    : suggestion.value;

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border p-3 w-64" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className={`w-4 h-4 ${confidenceStyle.textClass}`} />
          <span className="text-sm font-medium text-foreground">Suggestion</span>
        </div>
        <Badge variant="outline" className={`text-xs ${confidenceStyle.bgClass} ${confidenceStyle.textClass}`}>
          {confidenceStyle.label}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        <div className="bg-muted rounded p-2">
          <p className="text-xs text-muted-foreground">Valeur suggérée</p>
          <p className="text-sm font-semibold text-foreground">{suggestedValueFormatted}</p>
        </div>

        {suggestion.source && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileText className="w-3 h-3" />
            <span className="truncate">{suggestion.source}</span>
          </div>
        )}

        {hasConflict && (
          <div className="flex items-center gap-1.5 text-xs text-warning bg-warning-light rounded p-1.5">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>Remplacera: {typeof currentValue === 'number' ? formatCHF(currentValue) : currentValue}</span>
          </div>
        )}

        {suggestion.explanation && (
          <p className="text-xs text-muted-foreground italic">{suggestion.explanation}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="flex-1 h-8 bg-success hover:bg-success-muted text-success-foreground"
          onClick={() => {
            onAccept?.(suggestion);
            onClose?.();
          }}
        >
          <Check className="w-3 h-3 mr-1" />
          Accepter
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="flex-1 h-8 text-destructive border-destructive-light hover:bg-destructive-light"
          onClick={() => {
            onReject?.(suggestion);
            onClose?.();
          }}
        >
          <X className="w-3 h-3 mr-1" />
          Rejeter
        </Button>
      </div>
    </div>
  );
}

/**
 * Batch suggestion badge - shows count of pending suggestions
 */
export function SuggestionBadge({ count, onClick }) {
  if (!count || count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-info-light text-info hover:bg-info/20 transition-colors text-sm font-medium"
    >
      <Sparkles className="w-4 h-4" />
      {count} suggestion{count > 1 ? 's' : ''}
    </button>
  );
}
