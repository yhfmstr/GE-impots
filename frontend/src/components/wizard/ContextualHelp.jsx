import { useState } from 'react';
import { HelpCircle, X, ExternalLink, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Default help content for common fields
 */
const DEFAULT_HELP = {
  grossSalary: {
    title: 'Salaire brut annuel',
    content: 'Montant total de votre salaire avant déductions, indiqué à la rubrique 1 de votre certificat de salaire.',
    tip: 'Incluez les bonus et 13ème salaire',
    link: 'https://www.ge.ch/revenus-imposables'
  },
  avsContributions: {
    title: 'Cotisations AVS/AI/APG',
    content: 'Cotisations sociales prélevées sur votre salaire. Rubrique 9.1 du certificat de salaire.',
    tip: 'Environ 5.3% de votre salaire brut'
  },
  lppContributions: {
    title: 'Cotisations LPP (2ème pilier)',
    content: 'Cotisations à votre caisse de pension professionnelle. Rubrique 10.1 du certificat de salaire.',
    tip: 'Le taux varie selon votre âge et votre caisse'
  },
  pilier3a: {
    title: '3ème pilier A',
    content: 'Versements volontaires sur un compte de prévoyance 3a. Entièrement déductible jusqu\'au plafond.',
    tip: 'Maximum CHF 7\'056 si affilié LPP, CHF 35\'280 sinon',
    link: 'https://www.ge.ch/deductions-prevoyance'
  },
  rachatLPP: {
    title: 'Rachat 2ème pilier',
    content: 'Versements volontaires pour combler des lacunes de cotisation LPP.',
    tip: 'Demandez une attestation de rachat à votre caisse'
  },
  healthInsurance: {
    title: 'Primes d\'assurance maladie',
    content: 'Total des primes LAMal (obligatoire) payées pour vous et votre famille.',
    tip: 'Plafond: CHF 16\'207 adulte, CHF 3\'811 enfant',
    link: 'https://www.ge.ch/subsides-assurance-maladie'
  },
  childcareCosts: {
    title: 'Frais de garde',
    content: 'Coûts de garde d\'enfants (crèche, parascolaire, nounou) pour enfants de moins de 14 ans.',
    tip: 'Maximum CHF 26\'080 ICC, CHF 25\'500 IFD par enfant'
  },
  bankAccounts: {
    title: 'Comptes bancaires',
    content: 'Solde total de tous vos comptes au 31 décembre. Comptes courants, épargne, etc.',
    tip: 'N\'oubliez pas les comptes à l\'étranger'
  },
  securities: {
    title: 'Titres et placements',
    content: 'Valeur au 31 décembre des actions, obligations, fonds de placement.',
    tip: 'Utilisez la valeur fiscale (cours de fin d\'année)'
  },
  propertyValue: {
    title: 'Valeur fiscale immobilière',
    content: 'Valeur de votre bien selon l\'estimation officielle de l\'administration fiscale.',
    tip: 'Indiquée sur votre avis d\'imposition précédent'
  },
  rentalValue: {
    title: 'Valeur locative',
    content: 'Revenu fictif correspondant à l\'avantage de vivre dans votre propre logement.',
    tip: 'Calculée à 70% de la valeur de marché locative',
    link: 'https://www.ge.ch/valeur-locative'
  },
  mortgageInterest: {
    title: 'Intérêts hypothécaires',
    content: 'Intérêts payés sur votre hypothèque durant l\'année fiscale.',
    tip: 'Demandez une attestation à votre banque'
  },
  mortgageBalance: {
    title: 'Solde hypothécaire',
    content: 'Dette hypothécaire restante au 31 décembre.',
    tip: 'Cette dette est déductible de votre fortune'
  },
  trainingCosts: {
    title: 'Frais de formation continue',
    content: 'Coûts de formation ou perfectionnement liés à votre activité professionnelle.',
    tip: 'Maximum CHF 12\'640 ICC, CHF 12\'900 IFD'
  }
};

/**
 * ContextualHelp - Help tooltip for a specific field
 *
 * Props:
 * - fieldName: Name of the field to show help for
 * - customHelp: Optional custom help text (from profile)
 * - compact: Boolean for compact mode (icon only)
 */
export default function ContextualHelp({ fieldName, customHelp, compact = true }) {
  const [isOpen, setIsOpen] = useState(false);

  const helpContent = DEFAULT_HELP[fieldName];

  // No help available
  if (!helpContent && !customHelp) {
    return null;
  }

  // Compact mode - just icon
  if (compact) {
    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-full text-muted-foreground hover:text-text-secondary hover:bg-muted transition-colors"
          title="Aide"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Popover */}
            <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-card rounded-lg shadow-lg border border-border p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-foreground">
                  {helpContent?.title || fieldName}
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-muted-foreground hover:text-text-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-text-secondary mb-3">
                {helpContent?.content || customHelp}
              </p>

              {(helpContent?.tip || customHelp) && (
                <div className="flex items-start gap-2 bg-warning-light rounded p-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-warning">
                    {helpContent?.tip || customHelp}
                  </p>
                </div>
              )}

              {helpContent?.link && (
                <a
                  href={helpContent.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  En savoir plus
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Full inline mode
  return (
    <div className="bg-muted rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-info-light flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-4 h-4 text-info" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-1">
            {helpContent?.title || fieldName}
          </h4>
          <p className="text-sm text-text-secondary mb-2">
            {helpContent?.content || customHelp}
          </p>

          {(helpContent?.tip || customHelp) && (
            <div className="flex items-start gap-2 bg-warning-light rounded p-2 mb-2">
              <Lightbulb className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                {helpContent?.tip || customHelp}
              </p>
            </div>
          )}

          {helpContent?.link && (
            <a
              href={helpContent.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              En savoir plus
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * HelpTooltip - Simple tooltip wrapper for help text
 */
export function HelpTooltip({ children, text }) {
  if (!text) return children;

  return (
    <div className="relative group inline-flex items-center gap-1">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 border border-border shadow-md">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover" />
      </div>
    </div>
  );
}
