/**
 * Inference Rules for Intelligent Auto-Fill
 *
 * These rules allow the system to suggest calculated values
 * based on other data points in the declaration.
 */

/**
 * Tax limits and constants for 2024
 */
export const TAX_LIMITS = {
  // Pilier 3a
  PILIER_3A_WITH_LPP: 7056,
  PILIER_3A_WITHOUT_LPP: 35280,
  PILIER_3A_INDEPENDENT_RATE: 0.20, // 20% of net income

  // Professional expenses forfait
  FORFAIT_RATE: 0.03,
  FORFAIT_MIN_ICC: 634,
  FORFAIT_MAX_ICC: 1796,
  FORFAIT_MIN_IFD: 2000,
  FORFAIT_MAX_IFD: 4000,

  // Health insurance (adult single)
  HEALTH_INSURANCE_ADULT: 16207,
  HEALTH_INSURANCE_YOUNG: 12442, // 18-26
  HEALTH_INSURANCE_CHILD: 3811,

  // Childcare
  CHILDCARE_MAX_ICC: 26080,
  CHILDCARE_MAX_IFD: 25500,

  // Training
  TRAINING_MAX_ICC: 12640,
  TRAINING_MAX_IFD: 12900,

  // Social contributions rates (approximate)
  AVS_RATE: 0.053,      // 5.3% employee share
  LPP_RATE_APPROX: 0.075, // 7.5% average (varies by age/plan)
  AC_RATE: 0.011,       // 1.1% unemployment

  // Fortune
  FORTUNE_THRESHOLD: 87864
};

/**
 * Inference rule definitions
 * Each rule describes how to calculate a suggested value
 */
export const INFERENCE_RULES = [
  // AVS from gross salary
  {
    id: 'avs-from-salary',
    targetField: 'avsContributions',
    targetLabel: 'Cotisations AVS/AI/APG',
    description: 'Cotisations AVS estimées à 5.3% du salaire brut',
    requires: ['grossSalary'],
    confidence: 0.85,
    calculate: (data) => {
      const gross = data.grossSalary || 0;
      if (gross <= 0) return null;
      return Math.round(gross * TAX_LIMITS.AVS_RATE);
    },
    explanation: (data, result) =>
      `${data.grossSalary?.toLocaleString('fr-CH')} × 5.3% = ${result?.toLocaleString('fr-CH')}`,
    source: 'Calcul automatique'
  },

  // LPP from gross salary (rough estimate)
  {
    id: 'lpp-from-salary',
    targetField: 'lppContributions',
    targetLabel: 'Cotisations LPP (2e pilier)',
    description: 'Cotisations LPP estimées (moyenne 7.5% du salaire)',
    requires: ['grossSalary'],
    confidence: 0.65, // Lower confidence as LPP varies greatly
    calculate: (data) => {
      const gross = data.grossSalary || 0;
      if (gross <= 0) return null;
      // Coordination deduction (2024): 25'725
      const coordSalary = Math.max(0, gross - 25725);
      return Math.round(coordSalary * TAX_LIMITS.LPP_RATE_APPROX);
    },
    explanation: (data, result) =>
      `(${data.grossSalary?.toLocaleString('fr-CH')} - 25'725) × 7.5% ≈ ${result?.toLocaleString('fr-CH')}`,
    source: 'Estimation (varie selon caisse)',
    warning: 'Le montant exact figure sur votre certificat de salaire'
  },

  // Professional expenses forfait
  {
    id: 'forfait-pro',
    targetField: 'professionalExpensesForfait',
    targetLabel: 'Frais professionnels (forfait)',
    description: 'Forfait 3% du revenu net, min CHF 634, max CHF 1\'796',
    requires: ['grossSalary', 'avsContributions', 'lppContributions'],
    confidence: 0.95,
    calculate: (data) => {
      const gross = data.grossSalary || 0;
      const avs = data.avsContributions || 0;
      const lpp = data.lppContributions || 0;
      const netBase = gross - avs - lpp;
      if (netBase <= 0) return null;
      const rawForfait = netBase * TAX_LIMITS.FORFAIT_RATE;
      return Math.round(Math.min(Math.max(rawForfait, TAX_LIMITS.FORFAIT_MIN_ICC), TAX_LIMITS.FORFAIT_MAX_ICC));
    },
    explanation: (data, result) => {
      const gross = data.grossSalary || 0;
      const avs = data.avsContributions || 0;
      const lpp = data.lppContributions || 0;
      const netBase = gross - avs - lpp;
      return `(${gross.toLocaleString('fr-CH')} - ${avs.toLocaleString('fr-CH')} - ${lpp.toLocaleString('fr-CH')}) × 3% = ${result?.toLocaleString('fr-CH')}`;
    },
    source: 'Calcul automatique (LIPP Art. 29)'
  },

  // Max Pilier 3a suggestion
  {
    id: 'max-pilier-3a',
    targetField: 'pilier3a',
    targetLabel: '3ème pilier A (maximum)',
    description: 'Déduction maximale 3a si affilié LPP',
    requires: ['hasLPP'],
    confidence: 0.90,
    condition: (data) => data.hasLPP === true || data.lppContributions > 0,
    calculate: (data) => TAX_LIMITS.PILIER_3A_WITH_LPP,
    explanation: () => `Maximum déductible avec LPP: CHF 7'056`,
    source: 'Plafond légal 2024'
  },

  // Taxable income
  {
    id: 'taxable-income',
    targetField: 'taxableIncome',
    targetLabel: 'Revenu imposable',
    description: 'Revenu brut moins déductions sociales',
    requires: ['grossSalary'],
    confidence: 0.90,
    calculate: (data) => {
      const gross = data.grossSalary || 0;
      const avs = data.avsContributions || 0;
      const lpp = data.lppContributions || 0;
      const p3a = data.pilier3a || 0;
      const health = data.healthInsurance || 0;
      const forfait = Math.min(Math.max((gross - avs - lpp) * 0.03, 634), 1796);

      return Math.max(0, gross - avs - lpp - Math.min(p3a, 7056) - health - forfait);
    },
    explanation: (data, result) =>
      `Revenu brut - déductions = CHF ${result?.toLocaleString('fr-CH')}`,
    source: 'Calcul automatique'
  },

  // Total wealth from bank + securities
  {
    id: 'total-wealth',
    targetField: 'totalWealth',
    targetLabel: 'Fortune totale',
    description: 'Somme des actifs moins dettes',
    requires: ['bankAccounts'],
    confidence: 0.85,
    calculate: (data) => {
      const bank = data.bankAccounts || 0;
      const securities = data.securities || 0;
      const vehicle = data.vehicleValue || 0;
      const loans = data.personalLoans || 0;
      const debts = data.otherDebts || 0;
      return bank + securities + vehicle - loans - debts;
    },
    explanation: (data, result) =>
      `Comptes + Titres + Véhicules - Dettes = CHF ${result?.toLocaleString('fr-CH')}`,
    source: 'Calcul automatique'
  }
];

/**
 * Get applicable inference rules based on current data
 * @param {Object} currentData - Current tax declaration data
 * @returns {Array} Array of applicable rules with calculated values
 */
export const getApplicableInferences = (currentData) => {
  const inferences = [];

  for (const rule of INFERENCE_RULES) {
    // Check if required fields are present
    const hasRequiredFields = rule.requires.every(field => {
      const value = currentData[field];
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });

    if (!hasRequiredFields) continue;

    // Check condition if exists
    if (rule.condition && !rule.condition(currentData)) continue;

    // Check if target field is not already filled
    const currentValue = currentData[rule.targetField];
    const hasExistingValue = currentValue !== null && currentValue !== undefined && currentValue !== '' && currentValue !== 0;

    // Calculate suggested value
    const suggestedValue = rule.calculate(currentData);

    if (suggestedValue === null || suggestedValue === undefined) continue;

    inferences.push({
      id: rule.id,
      field: rule.targetField,
      label: rule.targetLabel,
      description: rule.description,
      currentValue: hasExistingValue ? currentValue : null,
      suggestedValue,
      confidence: rule.confidence,
      explanation: rule.explanation(currentData, suggestedValue),
      source: rule.source,
      warning: rule.warning,
      isOverwrite: hasExistingValue && currentValue !== suggestedValue
    });
  }

  return inferences;
};

/**
 * Create a suggestion object for storage
 */
export const createSuggestion = (extraction, fieldKey, value, documentType, fileName) => {
  return {
    id: `${Date.now()}-${fieldKey}`,
    fieldKey,
    value,
    confidence: extraction.confidence || 0.8,
    source: fileName,
    documentType,
    extractedAt: new Date().toISOString(),
    accepted: null // null = pending, true = accepted, false = rejected
  };
};

/**
 * Merge suggestions with existing data
 * Only applies suggestions that haven't been rejected
 */
export const applySuggestions = (currentData, suggestions) => {
  const newData = { ...currentData };

  for (const suggestion of suggestions) {
    if (suggestion.accepted === true) {
      newData[suggestion.fieldKey] = suggestion.value;
    }
  }

  return newData;
};

/**
 * Field mapping from extraction data keys to questionnaire fields
 */
export const EXTRACTION_FIELD_MAP = {
  // Certificat de salaire
  grossSalary: { questionnaire: 'grossSalary', annexe: 'A', rubrique: '11.10' },
  avsContributions: { questionnaire: 'avsContributions', annexe: 'A', rubrique: '31.10' },
  lppContributions: { questionnaire: 'lppContributions', annexe: 'A', rubrique: '31.20' },
  bonus: { questionnaire: 'bonus', annexe: 'A', rubrique: '11.20' },

  // 3a attestation
  pilier3a: { questionnaire: 'pilier3a', annexe: 'A', rubrique: '31.40' },

  // Health insurance
  healthInsurance: { questionnaire: 'healthInsurance', annexe: 'C', rubrique: '52.10' },

  // Bank accounts
  bankAccounts: { questionnaire: 'bankAccounts', annexe: 'F', rubrique: '60.10' },
  securities: { questionnaire: 'securities', annexe: 'F', rubrique: '60.20' },

  // Mortgage
  mortgageBalance: { questionnaire: 'mortgageBalance', annexe: 'E', rubrique: '55.10' },
  mortgageInterest: { questionnaire: 'mortgageInterest', annexe: 'D', rubrique: '35.20' },

  // Childcare
  childcareCosts: { questionnaire: 'childcareCosts', annexe: 'C', rubrique: '80.10' }
};

export default {
  INFERENCE_RULES,
  TAX_LIMITS,
  getApplicableInferences,
  createSuggestion,
  applySuggestions,
  EXTRACTION_FIELD_MAP
};
