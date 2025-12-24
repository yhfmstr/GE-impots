/**
 * Quick Tax Estimator
 * Provides rough tax estimates from profiler survey answers
 * For pre-login engagement - NOT for final calculations
 */

// Geneva ICC brackets 2024 (simplified for estimation)
const ICC_BRACKETS = [
  { min: 0, max: 17493, rate: 0 },
  { min: 17493, max: 21076, rate: 0.08 },
  { min: 21076, max: 23184, rate: 0.09 },
  { min: 23184, max: 25291, rate: 0.10 },
  { min: 25291, max: 27399, rate: 0.11 },
  { min: 27399, max: 32668, rate: 0.12 },
  { min: 32668, max: 36883, rate: 0.13 },
  { min: 36883, max: 41625, rate: 0.14 },
  { min: 41625, max: 45313, rate: 0.1450 },
  { min: 45313, max: 72712, rate: 0.1475 },
  { min: 72712, max: 119298, rate: 0.1525 },
  { min: 119298, max: 160923, rate: 0.16 },
  { min: 160923, max: 498422, rate: 0.17 },
  { min: 498422, max: Infinity, rate: 0.19 },
];

// IFD brackets 2024 (federal - simplified)
const IFD_BRACKETS_SINGLE = [
  { min: 0, max: 14500, rate: 0 },
  { min: 14500, max: 31600, rate: 0.0077 },
  { min: 31600, max: 41400, rate: 0.0088 },
  { min: 41400, max: 55200, rate: 0.0266 },
  { min: 55200, max: 72500, rate: 0.0297 },
  { min: 72500, max: 78100, rate: 0.0561 },
  { min: 78100, max: 103600, rate: 0.0660 },
  { min: 103600, max: 134600, rate: 0.0880 },
  { min: 134600, max: 176000, rate: 0.1100 },
  { min: 176000, max: Infinity, rate: 0.1150 },
];

// Centime additionnel Geneva
const CENTIME_RATE = 0.475;

/**
 * Calculate ICC from taxable income
 */
function calculateICC(taxableIncome) {
  let tax = 0;
  let remainingIncome = taxableIncome;

  for (const bracket of ICC_BRACKETS) {
    if (remainingIncome <= 0) break;

    const taxableInBracket = Math.min(
      remainingIncome,
      bracket.max - bracket.min
    );

    if (taxableInBracket > 0 && taxableIncome > bracket.min) {
      const incomeInBracket = Math.min(
        taxableIncome - bracket.min,
        bracket.max - bracket.min
      );
      if (incomeInBracket > 0) {
        tax += incomeInBracket * bracket.rate;
      }
    }

    remainingIncome -= (bracket.max - bracket.min);
  }

  return Math.max(0, tax);
}

/**
 * Calculate IFD from taxable income
 */
function calculateIFD(taxableIncome, isMarried) {
  // Married couples have different brackets - simplified here
  const effectiveIncome = isMarried ? taxableIncome * 0.9 : taxableIncome;
  let tax = 0;

  for (const bracket of IFD_BRACKETS_SINGLE) {
    if (effectiveIncome > bracket.min) {
      const taxableInBracket = Math.min(effectiveIncome, bracket.max) - bracket.min;
      tax += taxableInBracket * bracket.rate;
    }
  }

  return Math.max(0, tax);
}

/**
 * Estimate standard deductions based on profile
 */
function estimateDeductions(answers) {
  let deductions = 0;

  // Employment deductions
  if (answers.employment === 'employed') {
    // Professional expenses forfait (3% of salary, min 634, max 1796)
    const incomeRange = getIncomeFromRange(answers.grossIncome);
    const avgIncome = (incomeRange[0] + incomeRange[1]) / 2;
    deductions += Math.min(Math.max(avgIncome * 0.03, 634), 1796);

    // Transport forfait
    deductions += 500;

    // AVS/AI/APG (approx 5.3%)
    deductions += avgIncome * 0.053;

    // LPP (approx 7.5% average)
    deductions += avgIncome * 0.075;
  }

  // Children deductions
  const childCount = getChildCount(answers.children);
  if (childCount > 0) {
    // Child deduction: ~10,000 CHF per child
    deductions += childCount * 10000;

    // Childcare if selected
    if (answers.additionalIncome?.includes('childcare')) {
      deductions += childCount * 10000; // Max per child
    }
  }

  // 3rd pillar
  if (answers.additionalIncome?.includes('pillar3a')) {
    deductions += 7056; // 2024 max
  }

  // Insurance premiums (standard estimate)
  if (answers.civilStatus === 'married') {
    deductions += 5000; // Both spouses
  } else {
    deductions += 2500;
  }

  // Property deductions
  if (answers.property !== 'none') {
    const incomeRange = getIncomeFromRange(answers.grossIncome);
    const avgIncome = (incomeRange[0] + incomeRange[1]) / 2;
    // Mortgage interest estimate (rough)
    deductions += avgIncome * 0.05;
    // Maintenance forfait
    deductions += 5000;
  }

  return deductions;
}

/**
 * Get income midpoint from range selection
 */
function getIncomeFromRange(rangeValue) {
  const ranges = {
    '0-50000': [0, 50000],
    '50000-80000': [50000, 80000],
    '80000-120000': [80000, 120000],
    '120000-200000': [120000, 200000],
    '200000+': [200000, 300000],
  };
  return ranges[rangeValue] || [0, 50000];
}

/**
 * Get child count from selection
 */
function getChildCount(childValue) {
  const counts = {
    '0': 0,
    '1': 1,
    '2': 2,
    '3+': 3,
  };
  return counts[childValue] || 0;
}

/**
 * Main estimation function
 * @param {Object} answers - Profiler survey answers
 * @returns {Object} - Estimated tax breakdown
 */
export function estimateTax(answers) {
  // Get gross income estimate
  const incomeRange = getIncomeFromRange(answers.grossIncome);
  const grossIncome = (incomeRange[0] + incomeRange[1]) / 2;

  // Estimate deductions
  const deductions = estimateDeductions(answers);

  // Calculate taxable income
  const taxableIncome = Math.max(0, grossIncome - deductions);

  // Is married?
  const isMarried = answers.civilStatus === 'married';

  // Calculate taxes
  const icc = calculateICC(taxableIncome);
  const centimes = icc * CENTIME_RATE;
  const ifd = calculateIFD(taxableIncome, isMarried);

  const totalCantonal = icc + centimes;
  const totalFederal = ifd;
  const totalTax = totalCantonal + totalFederal;

  // Calculate range (±15%)
  const minTax = Math.round(totalTax * 0.85);
  const maxTax = Math.round(totalTax * 1.15);

  // Effective rate
  const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;

  return {
    grossIncome: Math.round(grossIncome),
    deductions: Math.round(deductions),
    taxableIncome: Math.round(taxableIncome),
    breakdown: {
      icc: Math.round(icc),
      centimes: Math.round(centimes),
      ifd: Math.round(ifd),
      totalCantonal: Math.round(totalCantonal),
      totalFederal: Math.round(totalFederal),
    },
    totalTax: Math.round(totalTax),
    range: {
      min: minTax,
      max: maxTax,
    },
    effectiveRate: effectiveRate.toFixed(1),
    isEstimate: true,
    disclaimer: 'Cette estimation est indicative. Le montant réel dépend de votre situation exacte.',
  };
}

/**
 * Format CHF amount
 */
export function formatCHF(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'CHF 0';
  return `CHF ${Math.round(amount).toLocaleString('fr-CH')}`;
}

/**
 * Format range
 */
export function formatRange(min, max) {
  return `${formatCHF(min)} - ${formatCHF(max)}`;
}
