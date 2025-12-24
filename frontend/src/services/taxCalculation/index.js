/**
 * Tax Calculation Service
 *
 * Service layer wrapper around the tax calculator.
 * Provides integration with stores and additional utilities.
 */

import {
  calculateTaxWithSteps,
  calculateTax,
  ICC_BRACKETS,
  TAX_CONSTANTS,
  formatCHF,
  formatPercent,
  findBracket
} from '../../lib/taxCalculator';

// Re-export calculator functions and constants
export {
  calculateTaxWithSteps,
  calculateTax,
  ICC_BRACKETS,
  TAX_CONSTANTS,
  formatCHF,
  formatPercent,
  findBracket
};

/**
 * Tax Calculation Service
 */
class TaxCalculationService {
  /**
   * Calculate tax from store data
   */
  calculateFromDeclaration(declaration) {
    if (!declaration) {
      return null;
    }

    // Flatten nested structure for calculator compatibility
    const flatData = this.flattenDeclaration(declaration);
    return calculateTaxWithSteps(flatData);
  }

  /**
   * Flatten nested declaration structure
   */
  flattenDeclaration(declaration) {
    return {
      // Income
      grossSalary: declaration.income?.grossSalary || 0,
      netSalary: declaration.income?.netSalary || 0,
      avsContributions: declaration.income?.avsContributions || 0,
      lppContributions: declaration.income?.lppContributions || 0,
      bonus: declaration.income?.bonus || 0,
      otherIncome: declaration.income?.otherIncome || 0,

      // Deductions
      pilier3a: declaration.deductions?.pilier3a || 0,
      pilier3b: declaration.deductions?.pilier3b || 0,
      rachatLPP: declaration.deductions?.rachatLPP || 0,
      healthInsurance: declaration.deductions?.healthInsurance || 0,
      childcareCosts: declaration.deductions?.childcareCosts || 0,
      trainingCosts: declaration.deductions?.trainingCosts || 0,
      professionalExpenses: declaration.deductions?.professionalExpenses || 0,

      // Wealth
      bankAccounts: declaration.wealth?.bankAccounts || 0,
      securities: declaration.wealth?.securities || 0,
      vehicleValue: declaration.wealth?.vehicles || 0,
      personalLoans: declaration.wealth?.loans || 0,
      otherDebts: declaration.wealth?.otherDebts || 0
    };
  }

  /**
   * Calculate potential savings from deductions
   */
  calculateDeductionSavings(declaration, deductionType, amount) {
    const current = this.calculateFromDeclaration(declaration);
    if (!current) return 0;

    // Create modified declaration with additional deduction
    const modified = {
      ...declaration,
      deductions: {
        ...declaration.deductions,
        [deductionType]: (declaration.deductions?.[deductionType] || 0) + amount
      }
    };

    const withDeduction = this.calculateFromDeclaration(modified);
    if (!withDeduction) return 0;

    return current.summary.total - withDeduction.summary.total;
  }

  /**
   * Get optimization suggestions based on current data
   */
  getOptimizationSuggestions(declaration) {
    const suggestions = [];

    // Check Pilier 3a
    const current3a = declaration.deductions?.pilier3a || 0;
    if (current3a < TAX_CONSTANTS.PILIER_3A_LIMIT) {
      const remaining = TAX_CONSTANTS.PILIER_3A_LIMIT - current3a;
      const savings = this.calculateDeductionSavings(declaration, 'pilier3a', remaining);

      suggestions.push({
        type: 'pilier3a',
        title: 'Maximiser le 3ème pilier A',
        description: `Vous pouvez encore verser ${formatCHF(remaining)} en 2024`,
        potentialSavings: savings,
        priority: savings > 500 ? 'high' : 'medium',
        action: {
          field: 'deductions.pilier3a',
          suggestedValue: TAX_CONSTANTS.PILIER_3A_LIMIT
        }
      });
    }

    // Check LPP Rachat opportunity
    if (!declaration.deductions?.rachatLPP || declaration.deductions.rachatLPP === 0) {
      const estimatedRachat = 10000; // Example amount
      const savings = this.calculateDeductionSavings(declaration, 'rachatLPP', estimatedRachat);

      if (savings > 1000) {
        suggestions.push({
          type: 'rachatLPP',
          title: 'Rachat LPP potentiel',
          description: 'Vérifiez votre lacune de prévoyance auprès de votre caisse de pension',
          potentialSavings: savings,
          priority: 'medium',
          note: 'Estimation basée sur CHF 10\'000 de rachat'
        });
      }
    }

    // Sort by potential savings
    suggestions.sort((a, b) => b.potentialSavings - a.potentialSavings);

    return suggestions;
  }

  /**
   * Generate tax breakdown for visualization
   */
  generateBreakdown(result) {
    if (!result?.summary) return [];

    const { icc, centimesAdd, ifd, fortuneTax, total } = result.summary;

    return [
      {
        label: 'ICC (cantonal)',
        value: icc,
        percentage: total > 0 ? (icc / total) * 100 : 0,
        color: '#3b82f6' // blue
      },
      {
        label: 'Centimes additionnels',
        value: centimesAdd,
        percentage: total > 0 ? (centimesAdd / total) * 100 : 0,
        color: '#8b5cf6' // purple
      },
      {
        label: 'IFD (fédéral)',
        value: ifd,
        percentage: total > 0 ? (ifd / total) * 100 : 0,
        color: '#ef4444' // red
      },
      {
        label: 'Impôt fortune',
        value: fortuneTax,
        percentage: total > 0 ? (fortuneTax / total) * 100 : 0,
        color: '#10b981' // green
      }
    ].filter(item => item.value > 0);
  }

  /**
   * Compare two tax calculations
   */
  compareCalculations(before, after) {
    if (!before?.summary || !after?.summary) {
      return null;
    }

    return {
      totalDifference: after.summary.total - before.summary.total,
      iccDifference: after.summary.icc - before.summary.icc,
      ifdDifference: after.summary.ifd - before.summary.ifd,
      fortuneDifference: after.summary.fortuneTax - before.summary.fortuneTax,
      percentageChange: before.summary.total > 0
        ? ((after.summary.total - before.summary.total) / before.summary.total) * 100
        : 0
    };
  }
}

// Singleton instance
export const taxCalculationService = new TaxCalculationService();

export default taxCalculationService;
