import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Calculator,
  Minus,
  Plus,
  Equal,
  ExternalLink,
  Info,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCHF, formatPercent } from '@/lib/formatting';

/**
 * Category configuration for visual styling
 */
const CATEGORY_CONFIG = {
  income: {
    icon: Plus,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    label: 'Revenu'
  },
  deduction: {
    icon: Minus,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    label: 'Déduction'
  },
  subtotal: {
    icon: Equal,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-600',
    label: 'Sous-total'
  },
  tax: {
    icon: Calculator,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    label: 'Impôt'
  },
  wealth: {
    icon: Info,
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconColor: 'text-purple-600',
    label: 'Fortune'
  },
  total: {
    icon: CheckCircle,
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    iconColor: 'text-red-700',
    label: 'Total'
  }
};

/**
 * Individual calculation step component
 */
function CalculationStep({ step, isExpanded, onToggle }) {
  const config = CATEGORY_CONFIG[step.category] || CATEGORY_CONFIG.subtotal;
  const IconComponent = config.icon;

  return (
    <div className={`border-b last:border-b-0 ${step.isFinal ? 'border-red-200' : 'border-gray-100'}`}>
      {/* Header - always visible */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors ${
          step.isFinal ? 'bg-red-50 hover:bg-red-100' : ''
        }`}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${config.bgColor}`}>
            <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
          </div>
          <div className="text-left">
            <p className={`font-medium ${step.isFinal ? 'text-red-700' : 'text-gray-900'}`}>
              {step.title}
            </p>
            {step.legalRef && (
              <p className="text-xs text-gray-500">{step.legalRef}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-semibold ${
            step.category === 'deduction' ? 'text-green-600' :
            step.isFinal ? 'text-red-700 text-lg' :
            'text-gray-900'
          }`}>
            {step.category === 'deduction' ? '−' : ''}{formatCHF(step.result)}
          </span>
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className={`px-4 pb-4 ${config.bgColor} border-t ${config.borderColor}`}>
          <div className="pt-3 space-y-3">
            {/* Description */}
            <p className="text-sm text-gray-600">{step.description}</p>

            {/* Formula */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">Formule</p>
              <p className="font-mono text-sm text-gray-800">{step.formula}</p>
            </div>

            {/* Inputs breakdown */}
            {step.inputs && step.inputs.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Détail du calcul</p>
                {step.inputs.map((input, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 px-2 rounded bg-white">
                    <span className="text-gray-600">{input.label}</span>
                    <span className={`font-medium ${input.isNegative ? 'text-red-600' : 'text-gray-900'}`}>
                      {input.isNegative ? '−' : ''}
                      {input.isPercent
                        ? formatPercent(input.value)
                        : formatCHF(input.value)
                      }
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Limit warning */}
            {step.limit && step.limit.exceeded && (
              <div className="flex items-start gap-2 text-sm bg-amber-50 text-amber-700 p-2 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Plafond atteint: maximum {formatCHF(step.limit.max)} appliqué
                </span>
              </div>
            )}

            {/* Bracket info for ICC */}
            {step.bracket && (
              <div className="text-sm bg-white p-2 rounded border border-gray-200">
                <p className="text-xs text-gray-500 mb-1">Tranche d'imposition</p>
                <p className="text-gray-700">
                  De {formatCHF(step.bracket.min)} à {formatCHF(step.bracket.max)} : {formatPercent(step.bracket.rate)}
                </p>
              </div>
            )}

            {/* Note */}
            {step.note && (
              <p className="text-xs text-gray-500 italic flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {step.note}
              </p>
            )}

            {/* Legal reference link */}
            {step.legalUrl && (
              <a
                href={step.legalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Voir le texte de loi
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TaxBreakdown - Main component showing step-by-step calculation transparency
 */
export default function TaxBreakdown({ steps, defaultExpanded = false }) {
  const [expandedSteps, setExpandedSteps] = useState(
    defaultExpanded ? steps.map(s => s.id) : []
  );
  const [showAll, setShowAll] = useState(defaultExpanded);

  const toggleStep = (stepId) => {
    setExpandedSteps(prev =>
      prev.includes(stepId)
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const expandAll = () => {
    setExpandedSteps(steps.map(s => s.id));
    setShowAll(true);
  };

  const collapseAll = () => {
    setExpandedSteps([]);
    setShowAll(false);
  };

  // Group steps by category for summary view
  const groupedSteps = {
    income: steps.filter(s => s.category === 'income'),
    deductions: steps.filter(s => s.category === 'deduction'),
    taxes: steps.filter(s => s.category === 'tax'),
    subtotals: steps.filter(s => s.isSubtotal && !s.isFinal),
    total: steps.filter(s => s.isFinal)
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-gray-500" />
            Détail du calcul
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={showAll ? collapseAll : expandAll}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
            >
              {showAll ? 'Tout réduire' : 'Tout développer'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Cliquez sur chaque ligne pour voir le détail et les références légales
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {/* Category badges */}
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            if (key === 'total') return null;
            const IconComponent = config.icon;
            return (
              <Badge
                key={key}
                variant="outline"
                className={`${config.bgColor} ${config.borderColor} text-xs`}
              >
                <IconComponent className={`w-3 h-3 mr-1 ${config.iconColor}`} />
                {config.label}
              </Badge>
            );
          })}
        </div>

        {/* Steps list */}
        <div className="border-t border-gray-200">
          {steps.map((step) => (
            <CalculationStep
              key={step.id}
              step={step}
              isExpanded={expandedSteps.includes(step.id)}
              onToggle={() => toggleStep(step.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
