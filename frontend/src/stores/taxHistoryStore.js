/**
 * Tax History Store (Zustand)
 *
 * Manages historical tax declarations and bordereaux (assessment notices).
 * Used for:
 * - Storing extracted data from previous year declarations
 * - Managing bordereau documents (ICC and IFD)
 * - Year-over-year comparison
 * - Prefilling new declarations
 */

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Storage key
const STORAGE_KEY = 'ge-impots-tax-history';

/**
 * Default structure for a historical declaration
 */
const defaultHistoricalDeclaration = {
  taxYear: null,
  numeroContribuable: '',
  filingDate: null,
  filingReference: '',

  // Personal info snapshot
  personalInfo: {
    fullName: '',
    dateOfBirth: '',
    civilStatus: '',
    nationality: '',
    profession: '',
    address: '',
    commune: '',
    phone: '',
    annualRent: 0
  },

  // Summary totals
  summary: {
    revenuBrutICC: 0,
    revenuBrutIFD: 0,
    revenuNetICC: 0,
    revenuNetIFD: 0,
    fortuneBrute: 0,
    fortuneNette: 0
  },

  // Detailed breakdown by GeTax code
  revenus: {},      // { "11.00": 192581, "14.00": 551, ... }
  deductions: {},   // { "31.10": 13014, "31.12": 4441, "31.40": 7056, ... }
  fortune: {},      // { "14.00": 132622, "16.70": 10506, ... }

  // For prefill
  employeurs: [],          // [{ name, address, salary, bonus }]
  comptesBancaires: [],    // [{ iban, bank, balance }]
  assurances: [],          // [{ type, provider, amount }]
  dettes: [],              // [{ creditor, type, amount, interest }]
  titres: [],              // [{ type, name, quantity, value }]

  // Extraction metadata
  sourceDocumentId: null,
  extractedAt: null,
  extractionConfidence: null
};

/**
 * Default structure for a bordereau
 */
const defaultBordereau = {
  taxYear: null,
  type: null, // 'icc' or 'ifd'
  numeroContribuable: '',
  referenceNumber: '',
  notificationDate: null,
  periode: { debut: null, fin: null },

  // Assessed amounts
  revenuImposable: 0,
  fortuneImposable: 0, // ICC only
  tauxRevenu: 0,
  tauxFortune: 0, // ICC only
  bareme: '',

  // Tax breakdown
  taxBreakdown: {},

  // Total
  totalTax: 0,

  // Comparison with declaration
  declaredRevenu: 0,
  declaredFortune: 0,
  deltaRevenu: 0,
  deltaFortune: 0,

  // Payment
  paymentDeadline: null,
  paymentStatus: 'pending',

  // Metadata
  sourceDocumentId: null,
  extractedAt: null
};

/**
 * Calculate comparison metrics between declaration and bordereaux
 */
function calculateComparison(declaration, bordereau) {
  if (!declaration || !bordereau) return null;

  const deltaRevenu = bordereau.type === 'icc'
    ? (bordereau.revenuImposable || 0) - (declaration.summary?.revenuNetICC || 0)
    : (bordereau.revenuImposable || 0) - (declaration.summary?.revenuNetIFD || 0);

  const deltaFortune = bordereau.type === 'icc'
    ? (bordereau.fortuneImposable || 0) - (declaration.summary?.fortuneNette || 0)
    : 0;

  return {
    deltaRevenu,
    deltaFortune,
    percentageChange: declaration.summary?.revenuNetICC
      ? ((deltaRevenu / declaration.summary.revenuNetICC) * 100).toFixed(1)
      : 0,
    hasAdjustment: Math.abs(deltaRevenu) > 100 || Math.abs(deltaFortune) > 100
  };
}

/**
 * Tax History Store
 */
export const useTaxHistoryStore = create(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // State
          declarations: {}, // Keyed by year: { 2023: {...}, 2022: {...} }
          bordereaux: {},   // Keyed by year_type: { "2023_icc": {...}, "2023_ifd": {...} }
          isLoading: false,
          error: null,

          // ========================================
          // GETTERS
          // ========================================

          /**
           * Get all years with data
           */
          getAvailableYears: () => {
            const state = get();
            const years = new Set([
              ...Object.keys(state.declarations).map(Number),
              ...Object.keys(state.bordereaux).map(k => Number(k.split('_')[0]))
            ]);
            return Array.from(years).sort((a, b) => b - a);
          },

          /**
           * Get declaration for a specific year
           */
          getDeclarationByYear: (year) => {
            return get().declarations[year] || null;
          },

          /**
           * Get bordereaux for a specific year
           */
          getBordereauxByYear: (year) => {
            const state = get();
            return {
              icc: state.bordereaux[`${year}_icc`] || null,
              ifd: state.bordereaux[`${year}_ifd`] || null
            };
          },

          /**
           * Get total taxes for a year
           */
          getTotalTaxesByYear: (year) => {
            const { icc, ifd } = get().getBordereauxByYear(year);
            return {
              icc: icc?.totalTax || 0,
              ifd: ifd?.totalTax || 0,
              total: (icc?.totalTax || 0) + (ifd?.totalTax || 0)
            };
          },

          /**
           * Get comparison between declaration and bordereaux for a year
           */
          getComparisonByYear: (year) => {
            const declaration = get().getDeclarationByYear(year);
            const { icc, ifd } = get().getBordereauxByYear(year);

            return {
              icc: calculateComparison(declaration, icc),
              ifd: calculateComparison(declaration, ifd)
            };
          },

          /**
           * Get most recent declaration (for prefill)
           */
          getMostRecentDeclaration: () => {
            const years = get().getAvailableYears();
            if (years.length === 0) return null;
            return get().declarations[years[0]] || null;
          },

          /**
           * Get prefill data from most recent declaration
           */
          getPrefillData: () => {
            const declaration = get().getMostRecentDeclaration();
            if (!declaration) return null;

            return {
              taxYear: declaration.taxYear,
              personal: declaration.personalInfo,
              employeurs: declaration.employeurs,
              comptesBancaires: declaration.comptesBancaires,
              assurances: declaration.assurances,
              dettes: declaration.dettes,
              titres: declaration.titres,
              // Base amounts (user should verify/update)
              suggestedAmounts: {
                pilier3a: declaration.deductions?.['31.40'] || 0,
                primesMaladie: declaration.deductions?.['52.21'] || 0,
                healthInsurance: declaration.deductions?.['52.00']
              }
            };
          },

          /**
           * Get year-over-year comparison
           */
          getYearOverYearComparison: (year1, year2) => {
            const d1 = get().getDeclarationByYear(year1);
            const d2 = get().getDeclarationByYear(year2);

            if (!d1 || !d2) return null;

            return {
              revenuChange: (d1.summary?.revenuNetICC || 0) - (d2.summary?.revenuNetICC || 0),
              fortuneChange: (d1.summary?.fortuneNette || 0) - (d2.summary?.fortuneNette || 0),
              year1: d1,
              year2: d2
            };
          },

          // ========================================
          // ACTIONS - Declarations
          // ========================================

          /**
           * Add or update a historical declaration
           */
          setDeclaration: (year, data) => {
            set((state) => {
              state.declarations[year] = {
                ...defaultHistoricalDeclaration,
                ...data,
                taxYear: year
              };
            });
          },

          /**
           * Update specific fields of a declaration
           */
          updateDeclaration: (year, updates) => {
            set((state) => {
              if (state.declarations[year]) {
                state.declarations[year] = {
                  ...state.declarations[year],
                  ...updates
                };
              }
            });
          },

          /**
           * Remove a declaration
           */
          removeDeclaration: (year) => {
            set((state) => {
              delete state.declarations[year];
            });
          },

          // ========================================
          // ACTIONS - Bordereaux
          // ========================================

          /**
           * Add or update a bordereau
           */
          setBordereau: (year, type, data) => {
            const key = `${year}_${type}`;
            set((state) => {
              state.bordereaux[key] = {
                ...defaultBordereau,
                ...data,
                taxYear: year,
                type
              };

              // Auto-calculate deltas if declaration exists
              const declaration = state.declarations[year];
              if (declaration) {
                const comparison = calculateComparison(declaration, state.bordereaux[key]);
                if (comparison) {
                  state.bordereaux[key].deltaRevenu = comparison.deltaRevenu;
                  state.bordereaux[key].deltaFortune = comparison.deltaFortune;
                }
              }
            });
          },

          /**
           * Update specific fields of a bordereau
           */
          updateBordereau: (year, type, updates) => {
            const key = `${year}_${type}`;
            set((state) => {
              if (state.bordereaux[key]) {
                state.bordereaux[key] = {
                  ...state.bordereaux[key],
                  ...updates
                };
              }
            });
          },

          /**
           * Remove a bordereau
           */
          removeBordereau: (year, type) => {
            const key = `${year}_${type}`;
            set((state) => {
              delete state.bordereaux[key];
            });
          },

          /**
           * Update payment status of a bordereau
           */
          updatePaymentStatus: (year, type, status, paidAmount = null) => {
            const key = `${year}_${type}`;
            set((state) => {
              if (state.bordereaux[key]) {
                state.bordereaux[key].paymentStatus = status;
                if (paidAmount !== null) {
                  state.bordereaux[key].paidAmount = paidAmount;
                }
                if (status === 'paid') {
                  state.bordereaux[key].paidAt = new Date().toISOString();
                }
              }
            });
          },

          // ========================================
          // ACTIONS - Import from extraction
          // ========================================

          /**
           * Import declaration from document extraction
           */
          importDeclarationFromExtraction: (extractedData, sourceDocumentId = null) => {
            const year = extractedData.taxYear;
            if (!year) return false;

            const declaration = {
              taxYear: year,
              numeroContribuable: extractedData.numeroContribuable || '',
              filingDate: extractedData.filingDate || null,
              filingReference: extractedData.filingReference || '',

              personalInfo: {
                fullName: extractedData.fullName || '',
                dateOfBirth: extractedData.dateOfBirth || '',
                civilStatus: extractedData.civilStatus || '',
                nationality: extractedData.nationality || '',
                profession: extractedData.profession || '',
                address: extractedData.address || '',
                commune: extractedData.commune || '',
                phone: extractedData.phone || '',
                annualRent: extractedData.annualRent || 0
              },

              summary: {
                revenuBrutICC: extractedData.revenuBrutICC || 0,
                revenuBrutIFD: extractedData.revenuBrutIFD || 0,
                revenuNetICC: extractedData.revenuNetICC || 0,
                revenuNetIFD: extractedData.revenuNetIFD || 0,
                fortuneBrute: extractedData.fortuneBrute || 0,
                fortuneNette: extractedData.fortuneNette || 0
              },

              revenus: {
                '11.10': extractedData.salaireBrut || 0,
                '11.15': extractedData.bonus || 0,
                '14.00': extractedData.revenuMobilier || 0
              },

              deductions: {
                '31.10': extractedData.cotisationsAVS || 0,
                '31.12': extractedData.cotisationsLPP || 0,
                '31.40': extractedData.pilier3a || 0,
                '31.30': extractedData.rachatLPP || 0,
                '31.60': extractedData.fraisRepas || 0,
                '31.70': extractedData.fraisDeplacements || 0,
                '31.63': extractedData.autresFraisPro || 0,
                '52.11': extractedData.primesAssuranceVie || 0,
                '52.21': extractedData.primesMaladie || 0,
                '52.22': extractedData.primesAccident || 0,
                '55.00': extractedData.interetsDettes || 0,
                '71.00': extractedData.fraisMedicaux || 0
              },

              fortune: {
                'comptes': extractedData.comptesBancaires || 0,
                'titres': extractedData.titres || 0,
                '16.70': extractedData.valeurRachatAssVie || 0,
                '16.00': extractedData.autresElementsFortune || 0,
                '55.00': extractedData.dettes || 0,
                '51.50': extractedData.deductionSociale || 0
              },

              employeurs: extractedData.employerName ? [{
                name: extractedData.employerName,
                address: extractedData.employerAddress || ''
              }] : [],

              sourceDocumentId,
              extractedAt: new Date().toISOString(),
              extractionConfidence: extractedData.confidence || null
            };

            set((state) => {
              state.declarations[year] = declaration;
            });

            return true;
          },

          /**
           * Import bordereau from document extraction
           */
          importBordereauFromExtraction: (extractedData, type, sourceDocumentId = null) => {
            const year = extractedData.taxYear;
            if (!year || !type) return false;

            const key = `${year}_${type}`;

            const bordereau = {
              taxYear: year,
              type,
              numeroContribuable: extractedData.numeroContribuable || '',
              referenceNumber: extractedData.referenceNumber || '',
              notificationDate: extractedData.notificationDate || null,
              periode: {
                debut: extractedData.periodeDebut || null,
                fin: extractedData.periodeFin || null
              },

              revenuImposable: extractedData.revenuImposable || 0,
              fortuneImposable: extractedData.fortuneImposable || 0,
              tauxRevenu: extractedData.tauxRevenu || 0,
              tauxFortune: extractedData.tauxFortune || 0,
              bareme: extractedData.bareme || '',

              taxBreakdown: type === 'icc' ? {
                cantonal: {
                  impotBaseRevenu: extractedData.impotBaseRevenu || 0,
                  centimesAdditionnelsRevenu: extractedData.centimesAdditionnelsRevenu || 0,
                  reduction12pct: extractedData.reduction12pct || 0,
                  aideDomicileRevenu: extractedData.aideDomicileRevenu || 0,
                  impotBaseFortune: extractedData.impotBaseFortune || 0,
                  centimesAdditionnelsFortune: extractedData.centimesAdditionnelsFortune || 0,
                  aideDomicileFortune: extractedData.aideDomicileFortune || 0
                },
                communal: {
                  commune: extractedData.commune || '',
                  partPrivilegieeRevenu: extractedData.partPrivilegieeRevenu || 0,
                  centimesCommunauxRevenu: extractedData.centimesCommunauxRevenu || 0,
                  partPrivilegieeFortune: extractedData.partPrivilegieeFortune || 0,
                  centimesCommunauxFortune: extractedData.centimesCommunauxFortune || 0
                },
                autres: {
                  taxePersonnelle: extractedData.taxePersonnelle || 0,
                  frais: extractedData.frais || 0
                },
                imputations: {
                  impotAnticipe: extractedData.impotAnticipe || 0,
                  retenueSupplementaire: extractedData.retenueSupplementaire || 0,
                  imputationEtrangers: extractedData.imputationEtrangers || 0
                }
              } : {
                impotBaseRevenu: extractedData.impotBaseRevenu || 0
              },

              totalTax: extractedData.totalImpots || 0,

              // IFD specific
              previousProvisional: type === 'ifd' ? extractedData.dernierBordereauProvisoire || 0 : null,
              adjustmentAmount: type === 'ifd' ? extractedData.degrevement || 0 : null,

              paymentDeadline: extractedData.delaiPaiement || null,
              paymentStatus: 'pending',

              sourceDocumentId,
              extractedAt: new Date().toISOString()
            };

            set((state) => {
              state.bordereaux[key] = bordereau;

              // Calculate deltas if declaration exists
              const declaration = state.declarations[year];
              if (declaration) {
                const comparison = calculateComparison(declaration, bordereau);
                if (comparison) {
                  state.bordereaux[key].deltaRevenu = comparison.deltaRevenu;
                  state.bordereaux[key].deltaFortune = comparison.deltaFortune;
                }
              }
            });

            return true;
          },

          // ========================================
          // ACTIONS - Utility
          // ========================================

          /**
           * Clear all data
           */
          clearAll: () => {
            set((state) => {
              state.declarations = {};
              state.bordereaux = {};
              state.error = null;
            });
          },

          /**
           * Clear data for a specific year
           */
          clearYear: (year) => {
            set((state) => {
              delete state.declarations[year];
              delete state.bordereaux[`${year}_icc`];
              delete state.bordereaux[`${year}_ifd`];
            });
          },

          /**
           * Set loading state
           */
          setLoading: (loading) => {
            set((state) => {
              state.isLoading = loading;
            });
          },

          /**
           * Set error state
           */
          setError: (error) => {
            set((state) => {
              state.error = error;
            });
          }
        }))
      ),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          declarations: state.declarations,
          bordereaux: state.bordereaux
        })
      }
    ),
    { name: 'TaxHistoryStore' }
  )
);

export default useTaxHistoryStore;
