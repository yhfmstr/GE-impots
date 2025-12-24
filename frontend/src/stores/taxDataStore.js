/**
 * Tax Data Store (Zustand)
 *
 * Centralized state management for tax declaration data.
 * Handles persistence, validation, and computed values.
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Storage key
const STORAGE_KEY = 'ge-impots-tax-data';

/**
 * Default tax declaration structure
 */
const defaultDeclaration = {
  year: new Date().getFullYear(),
  personal: {
    name: '',
    firstName: '',
    birthDate: null,
    maritalStatus: 'single', // single, married, divorced, widowed, separated
    children: 0
  },
  income: {
    grossSalary: 0,
    netSalary: 0,
    avsContributions: 0,
    lppContributions: 0,
    bonus: 0,
    otherIncome: 0
  },
  deductions: {
    pilier3a: 0,
    pilier3b: 0,
    rachatLPP: 0,
    healthInsurance: 0,
    childcareCosts: 0,
    trainingCosts: 0,
    professionalExpenses: 0,
    donationsAndGifts: 0,
    alimony: 0,
    otherDeductions: 0
  },
  wealth: {
    bankAccounts: 0,
    securities: 0,
    realEstate: [],
    vehicles: 0,
    otherAssets: 0,
    mortgages: 0,
    loans: 0,
    otherDebts: 0
  },
  realEstate: {
    properties: []
  }
};

/**
 * Calculate completion percentage based on filled fields
 */
function calculateCompletion(declaration) {
  if (!declaration) return 0;

  const requiredFields = [
    declaration.income?.grossSalary > 0,
    declaration.income?.avsContributions > 0,
    declaration.wealth?.bankAccounts > 0 ||
      declaration.wealth?.securities > 0 ||
      (declaration.wealth?.realEstate?.length || 0) > 0
  ];

  const filled = requiredFields.filter(Boolean).length;
  return Math.round((filled / requiredFields.length) * 100);
}

/**
 * Deep merge helper
 */
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

/**
 * Tax Data Store
 */
export const useTaxDataStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // State
          declaration: { ...defaultDeclaration },
          isDirty: false,
          lastSaved: null,
          validationErrors: {},

          // Computed getters
          getCompletion: () => calculateCompletion(get().declaration),

          getTaxableIncome: () => {
            const { income, deductions } = get().declaration;
            const gross = (income.grossSalary || 0) + (income.bonus || 0) + (income.otherIncome || 0);
            const totalDeductions =
              (deductions.pilier3a || 0) +
              (deductions.rachatLPP || 0) +
              (deductions.healthInsurance || 0) +
              (deductions.childcareCosts || 0) +
              (deductions.trainingCosts || 0) +
              (deductions.professionalExpenses || 0) +
              (deductions.donationsAndGifts || 0) +
              (deductions.alimony || 0);
            return Math.max(0, gross - totalDeductions);
          },

          getNetWealth: () => {
            const { wealth } = get().declaration;
            const assets =
              (wealth.bankAccounts || 0) +
              (wealth.securities || 0) +
              (wealth.vehicles || 0) +
              (wealth.otherAssets || 0);
            const debts =
              (wealth.mortgages || 0) +
              (wealth.loans || 0) +
              (wealth.otherDebts || 0);
            return Math.max(0, assets - debts);
          },

          // Actions
          setDeclaration: (data) => {
            set((state) => {
              state.declaration = deepMerge(defaultDeclaration, data);
              state.isDirty = true;
            });
          },

          updateField: (path, value) => {
            set((state) => {
              const keys = path.split('.');
              let current = state.declaration;
              for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                  current[keys[i]] = {};
                }
                current = current[keys[i]];
              }
              current[keys[keys.length - 1]] = value;
              state.isDirty = true;
            });
          },

          updateSection: (section, data) => {
            set((state) => {
              state.declaration[section] = {
                ...state.declaration[section],
                ...data
              };
              state.isDirty = true;
            });
          },

          // Apply auto-fill data from document extraction
          applyAutoFill: (extractedData, fieldMappings) => {
            set((state) => {
              for (const [sourceField, targetPath] of Object.entries(fieldMappings)) {
                if (extractedData[sourceField] !== undefined) {
                  const keys = targetPath.split('.');
                  let current = state.declaration;
                  for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                      current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                  }
                  current[keys[keys.length - 1]] = extractedData[sourceField];
                }
              }
              state.isDirty = true;
            });
          },

          markSaved: () => {
            set((state) => {
              state.isDirty = false;
              state.lastSaved = new Date().toISOString();
            });
          },

          resetDeclaration: () => {
            set((state) => {
              state.declaration = { ...defaultDeclaration };
              state.isDirty = false;
              state.validationErrors = {};
            });
          },

          setValidationErrors: (errors) => {
            set((state) => {
              state.validationErrors = errors;
            });
          }
        }))
      ),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          declaration: state.declaration,
          lastSaved: state.lastSaved
        })
      }
    ),
    { name: 'TaxDataStore' }
  )
);

export default useTaxDataStore;
