/**
 * Tax Calculator with Step-by-Step Transparency
 * Geneva Canton Tax Calculation for 2024
 *
 * Legal References:
 * - LIPP: Loi sur l'imposition des personnes physiques (Geneva)
 * - LIFD: Loi fédérale sur l'impôt fédéral direct
 */

// ICC Tax Brackets for Geneva 2024 (LIPP Art. 41)
export const ICC_BRACKETS = [
  { min: 0, max: 17493, rate: 0.08, base: 0 },
  { min: 17493, max: 21076, rate: 0.09, base: 1399 },
  { min: 21076, max: 23184, rate: 0.10, base: 1722 },
  { min: 23184, max: 25291, rate: 0.11, base: 1933 },
  { min: 25291, max: 27399, rate: 0.12, base: 2165 },
  { min: 27399, max: 33198, rate: 0.13, base: 2417 },
  { min: 33198, max: 36889, rate: 0.14, base: 3171 },
  { min: 36889, max: 40580, rate: 0.145, base: 3688 },
  { min: 40580, max: 45854, rate: 0.15, base: 4223 },
  { min: 45854, max: 72420, rate: 0.155, base: 5014 },
  { min: 72420, max: 119107, rate: 0.16, base: 9132 },
  { min: 119107, max: 160520, rate: 0.175, base: 16602 },
  { min: 160520, max: 498293, rate: 0.185, base: 23849 },
  { min: 498293, max: Infinity, rate: 0.19, base: 86387 }
];

// Tax constants
export const TAX_CONSTANTS = {
  FORFAIT_RATE: 0.03,
  FORFAIT_MIN: 634,
  FORFAIT_MAX: 1796,
  CENTIMES_RATE: 0.45,
  IFD_BASE_RATE: 0.115,
  IFD_FACTOR: 0.8,
  FORTUNE_THRESHOLD: 87864,
  FORTUNE_RATE: 0.005,
  PILIER_3A_LIMIT: 7056
};

/**
 * Format CHF amount for display
 */
export const formatCHF = (amount) => {
  if (amount === null || amount === undefined) return 'CHF 0';
  return `CHF ${Math.round(amount).toLocaleString('fr-CH')}`;
};

/**
 * Format percentage for display
 */
export const formatPercent = (rate) => {
  return `${(rate * 100).toFixed(1)}%`;
};

/**
 * Find the applicable ICC bracket for a given income
 */
export const findBracket = (income) => {
  return ICC_BRACKETS.find(b => income > b.min && income <= b.max) || ICC_BRACKETS[ICC_BRACKETS.length - 1];
};

/**
 * Calculate ICC with bracket details
 */
const calculateICCWithDetails = (taxableIncome) => {
  if (taxableIncome <= 0) {
    return { amount: 0, bracket: null, calculation: null };
  }

  const bracket = findBracket(taxableIncome);
  const excessIncome = taxableIncome - bracket.min;
  const marginalTax = excessIncome * bracket.rate;
  const totalICC = bracket.base + marginalTax;

  return {
    amount: Math.round(totalICC),
    bracket,
    calculation: {
      base: bracket.base,
      excess: excessIncome,
      marginal: marginalTax,
      rate: bracket.rate
    }
  };
};

/**
 * Main calculation function with step-by-step transparency
 * Returns both the final results and detailed calculation steps
 */
export const calculateTaxWithSteps = (declarationData) => {
  const steps = [];

  // Extract values with fallbacks
  const grossIncome = declarationData.grossSalary || declarationData.income?.grossSalary || 0;
  const avsContributions = declarationData.avsContributions || declarationData.income?.avsContributions || 0;
  const lppContributions = declarationData.lppContributions || declarationData.income?.lppContributions || 0;
  const pilier3a = declarationData.pilier3a || declarationData.deductions?.pilier3a || 0;
  const healthInsurance = declarationData.healthInsurance || declarationData.deductions?.healthInsurance || 0;
  const bankAccounts = declarationData.bankAccounts || declarationData.wealth?.bankAccounts || 0;
  const securities = declarationData.securities || declarationData.wealth?.securities || 0;
  const vehicleValue = declarationData.vehicleValue || declarationData.wealth?.vehicleValue || 0;
  const personalLoans = declarationData.personalLoans || declarationData.wealth?.personalLoans || 0;
  const otherDebts = declarationData.otherDebts || declarationData.wealth?.otherDebts || 0;

  // Step 1: Gross Income
  steps.push({
    id: 'gross-income',
    category: 'income',
    title: 'Revenu brut total',
    description: 'Total des revenus de l\'activité lucrative dépendante',
    formula: 'Salaire brut annuel',
    legalRef: 'LIPP Art. 18',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art18',
    inputs: [
      { label: 'Salaire brut', value: grossIncome, key: 'grossSalary' }
    ],
    result: grossIncome,
    isSubtotal: false
  });

  // Step 2: Social Contributions (AVS/AI/APG)
  steps.push({
    id: 'avs-contributions',
    category: 'deduction',
    title: 'Cotisations AVS/AI/APG',
    description: 'Cotisations obligatoires à l\'assurance vieillesse, invalidité et perte de gain',
    formula: 'Montant prélevé sur le certificat de salaire (case 9)',
    legalRef: 'LIPP Art. 31 let. a',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art31',
    inputs: [
      { label: 'Cotisations AVS', value: avsContributions, key: 'avsContributions' }
    ],
    result: avsContributions,
    isSubtotal: false
  });

  // Step 3: LPP Contributions
  steps.push({
    id: 'lpp-contributions',
    category: 'deduction',
    title: 'Cotisations LPP (2ème pilier)',
    description: 'Cotisations à la prévoyance professionnelle obligatoire',
    formula: 'Montant prélevé sur le certificat de salaire (case 10)',
    legalRef: 'LIPP Art. 31 let. b',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art31',
    inputs: [
      { label: 'Cotisations LPP', value: lppContributions, key: 'lppContributions' }
    ],
    result: lppContributions,
    isSubtotal: false
  });

  // Step 4: Pilier 3a
  const appliedPilier3a = Math.min(pilier3a, TAX_CONSTANTS.PILIER_3A_LIMIT);
  const pilier3aLimited = pilier3a > TAX_CONSTANTS.PILIER_3A_LIMIT;

  steps.push({
    id: 'pilier-3a',
    category: 'deduction',
    title: '3ème pilier A',
    description: 'Prévoyance individuelle liée (si affilié à une caisse de pension)',
    formula: `Min(montant versé, ${formatCHF(TAX_CONSTANTS.PILIER_3A_LIMIT)})`,
    legalRef: 'LIPP Art. 31 let. e',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art31',
    inputs: [
      { label: 'Montant versé', value: pilier3a, key: 'pilier3a' }
    ],
    result: appliedPilier3a,
    limit: {
      max: TAX_CONSTANTS.PILIER_3A_LIMIT,
      applied: appliedPilier3a,
      exceeded: pilier3aLimited
    },
    isSubtotal: false
  });

  // Step 5: Health Insurance
  steps.push({
    id: 'health-insurance',
    category: 'deduction',
    title: 'Assurance maladie',
    description: 'Primes d\'assurance maladie obligatoire (LAMal)',
    formula: 'Primes payées (plafond selon situation familiale)',
    legalRef: 'LIPP Art. 32 let. a',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art32',
    inputs: [
      { label: 'Primes maladie', value: healthInsurance, key: 'healthInsurance' }
    ],
    result: healthInsurance,
    isSubtotal: false
  });

  // Step 6: Professional Expenses (Forfait)
  const rawForfait = grossIncome * TAX_CONSTANTS.FORFAIT_RATE;
  const forfait = Math.min(Math.max(rawForfait, TAX_CONSTANTS.FORFAIT_MIN), TAX_CONSTANTS.FORFAIT_MAX);

  steps.push({
    id: 'forfait-pro',
    category: 'deduction',
    title: 'Frais professionnels (forfait)',
    description: 'Déduction forfaitaire pour frais professionnels',
    formula: `3% du revenu brut, min ${formatCHF(TAX_CONSTANTS.FORFAIT_MIN)}, max ${formatCHF(TAX_CONSTANTS.FORFAIT_MAX)}`,
    legalRef: 'LIPP Art. 29',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art29',
    inputs: [
      { label: 'Revenu brut', value: grossIncome, key: 'grossSalary' },
      { label: 'Taux forfaitaire', value: TAX_CONSTANTS.FORFAIT_RATE, isPercent: true }
    ],
    calculation: {
      raw: rawForfait,
      min: TAX_CONSTANTS.FORFAIT_MIN,
      max: TAX_CONSTANTS.FORFAIT_MAX,
      applied: forfait
    },
    result: forfait,
    limit: {
      max: TAX_CONSTANTS.FORFAIT_MAX,
      applied: forfait,
      exceeded: rawForfait > TAX_CONSTANTS.FORFAIT_MAX
    },
    isSubtotal: false
  });

  // Step 7: Total Deductions
  const totalDeductions = avsContributions + lppContributions + appliedPilier3a + healthInsurance + forfait;

  steps.push({
    id: 'total-deductions',
    category: 'subtotal',
    title: 'Total des déductions',
    description: 'Somme de toutes les déductions du revenu',
    formula: 'AVS + LPP + 3a + Maladie + Forfait',
    legalRef: 'LIPP Art. 31-35',
    inputs: [
      { label: 'Cotisations AVS', value: avsContributions },
      { label: 'Cotisations LPP', value: lppContributions },
      { label: '3ème pilier A', value: appliedPilier3a },
      { label: 'Assurance maladie', value: healthInsurance },
      { label: 'Frais professionnels', value: forfait }
    ],
    result: totalDeductions,
    isSubtotal: true
  });

  // Step 8: Taxable Income
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);

  steps.push({
    id: 'taxable-income',
    category: 'subtotal',
    title: 'Revenu imposable',
    description: 'Base de calcul pour l\'impôt sur le revenu',
    formula: 'Revenu brut − Total déductions',
    legalRef: 'LIPP Art. 36',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art36',
    inputs: [
      { label: 'Revenu brut', value: grossIncome },
      { label: 'Déductions', value: totalDeductions, isNegative: true }
    ],
    result: taxableIncome,
    isSubtotal: true
  });

  // Step 9: ICC Calculation
  const iccDetails = calculateICCWithDetails(taxableIncome);
  const bracket = iccDetails.bracket;

  steps.push({
    id: 'icc',
    category: 'tax',
    title: 'ICC (Impôt cantonal sur le revenu)',
    description: 'Impôt progressif selon le barème cantonal genevois',
    formula: bracket
      ? `${formatCHF(bracket.base)} + (${formatCHF(taxableIncome)} − ${formatCHF(bracket.min)}) × ${formatPercent(bracket.rate)}`
      : 'Aucun impôt',
    legalRef: 'LIPP Art. 41',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art41',
    inputs: [
      { label: 'Revenu imposable', value: taxableIncome }
    ],
    calculation: iccDetails.calculation,
    bracket: bracket ? {
      min: bracket.min,
      max: bracket.max,
      rate: bracket.rate,
      baseAmount: bracket.base
    } : null,
    result: iccDetails.amount,
    isSubtotal: false
  });

  // Step 10: Centimes Additionnels
  const centimesAdd = Math.round(iccDetails.amount * TAX_CONSTANTS.CENTIMES_RATE);

  steps.push({
    id: 'centimes-add',
    category: 'tax',
    title: 'Centimes additionnels communaux',
    description: 'Surtaxe communale calculée sur l\'ICC',
    formula: `ICC × ${formatPercent(TAX_CONSTANTS.CENTIMES_RATE)}`,
    legalRef: 'LIPP Art. 295',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art295',
    inputs: [
      { label: 'ICC', value: iccDetails.amount },
      { label: 'Taux communal', value: TAX_CONSTANTS.CENTIMES_RATE, isPercent: true }
    ],
    note: 'Le taux de 45% est une moyenne. Le taux exact varie selon la commune de domicile.',
    result: centimesAdd,
    isSubtotal: false
  });

  // Step 11: IFD
  const ifdBase = taxableIncome * TAX_CONSTANTS.IFD_BASE_RATE;
  const ifd = Math.round(ifdBase * TAX_CONSTANTS.IFD_FACTOR);

  steps.push({
    id: 'ifd',
    category: 'tax',
    title: 'IFD (Impôt fédéral direct)',
    description: 'Impôt sur le revenu prélevé par la Confédération',
    formula: `Revenu × ${formatPercent(TAX_CONSTANTS.IFD_BASE_RATE)} × ${formatPercent(TAX_CONSTANTS.IFD_FACTOR)} (réduction)`,
    legalRef: 'LIFD Art. 36',
    legalUrl: 'https://www.fedlex.admin.ch/eli/cc/1991/1184_1184_1184/fr#art_36',
    inputs: [
      { label: 'Revenu imposable', value: taxableIncome },
      { label: 'Taux de base', value: TAX_CONSTANTS.IFD_BASE_RATE, isPercent: true },
      { label: 'Facteur de réduction', value: TAX_CONSTANTS.IFD_FACTOR, isPercent: true }
    ],
    calculation: {
      base: ifdBase,
      factor: TAX_CONSTANTS.IFD_FACTOR,
      final: ifd
    },
    note: 'Calcul simplifié. Le barème IFD est également progressif.',
    result: ifd,
    isSubtotal: false
  });

  // Step 12: Wealth Calculation
  const totalWealth = bankAccounts + securities + vehicleValue - personalLoans - otherDebts;

  steps.push({
    id: 'total-wealth',
    category: 'wealth',
    title: 'Fortune nette',
    description: 'Actifs moins dettes au 31 décembre',
    formula: 'Comptes + Titres + Véhicules − Dettes',
    legalRef: 'LIPP Art. 46-56',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art46',
    inputs: [
      { label: 'Comptes bancaires', value: bankAccounts },
      { label: 'Titres', value: securities },
      { label: 'Véhicules', value: vehicleValue },
      { label: 'Emprunts personnels', value: personalLoans, isNegative: true },
      { label: 'Autres dettes', value: otherDebts, isNegative: true }
    ],
    result: totalWealth,
    isSubtotal: true
  });

  // Step 13: Fortune Tax
  const taxableWealth = Math.max(0, totalWealth - TAX_CONSTANTS.FORTUNE_THRESHOLD);
  const fortuneTax = Math.round(taxableWealth * TAX_CONSTANTS.FORTUNE_RATE);

  steps.push({
    id: 'fortune-tax',
    category: 'tax',
    title: 'Impôt sur la fortune',
    description: 'Impôt cantonal sur le patrimoine net',
    formula: totalWealth > TAX_CONSTANTS.FORTUNE_THRESHOLD
      ? `(${formatCHF(totalWealth)} − ${formatCHF(TAX_CONSTANTS.FORTUNE_THRESHOLD)}) × ${formatPercent(TAX_CONSTANTS.FORTUNE_RATE)}`
      : `Fortune inférieure au seuil de ${formatCHF(TAX_CONSTANTS.FORTUNE_THRESHOLD)}`,
    legalRef: 'LIPP Art. 59',
    legalUrl: 'https://silgeneve.ch/legis/program/books/RSG/htm/rsg_d3_08.htm#Art59',
    inputs: [
      { label: 'Fortune nette', value: totalWealth },
      { label: 'Seuil d\'imposition', value: TAX_CONSTANTS.FORTUNE_THRESHOLD }
    ],
    calculation: {
      threshold: TAX_CONSTANTS.FORTUNE_THRESHOLD,
      taxableAmount: taxableWealth,
      rate: TAX_CONSTANTS.FORTUNE_RATE
    },
    result: fortuneTax,
    isSubtotal: false
  });

  // Step 14: Total Tax
  const totalTax = iccDetails.amount + centimesAdd + ifd + fortuneTax;

  steps.push({
    id: 'total-tax',
    category: 'total',
    title: 'Total des impôts estimés',
    description: 'Somme de tous les impôts (revenu + fortune)',
    formula: 'ICC + Centimes + IFD + Fortune',
    inputs: [
      { label: 'ICC cantonal', value: iccDetails.amount },
      { label: 'Centimes communaux', value: centimesAdd },
      { label: 'IFD fédéral', value: ifd },
      { label: 'Impôt fortune', value: fortuneTax }
    ],
    result: totalTax,
    isSubtotal: true,
    isFinal: true
  });

  // Calculate effective rate
  const effectiveRate = grossIncome > 0
    ? ((iccDetails.amount + centimesAdd + ifd) / grossIncome * 100).toFixed(1)
    : 0;

  return {
    // Summary results (backwards compatible)
    summary: {
      grossIncome,
      totalDeductions,
      taxableIncome,
      icc: iccDetails.amount,
      centimesAdd,
      ifd,
      fortuneTax,
      total: totalTax,
      effectiveRate,
      totalWealth
    },
    // Detailed steps for transparency
    steps,
    // Additional metadata
    meta: {
      calculatedAt: new Date().toISOString(),
      taxYear: 2024,
      version: '1.0.0'
    }
  };
};

/**
 * Simple calculation function (backwards compatible with existing code)
 */
export const calculateTax = (declarationData) => {
  const result = calculateTaxWithSteps(declarationData);
  return result.summary;
};

export default calculateTaxWithSteps;
