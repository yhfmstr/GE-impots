/**
 * Declaration Year Store (Zustand)
 *
 * Manages multi-year declaration state with Supabase as source of truth.
 * No localStorage - all data comes from the database.
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import declarationService from '@/services/declarationService';

// Status constants (frontend)
export const DECLARATION_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  FINALIZED: 'finalized'
};

// Status display labels
export const STATUS_LABELS = {
  [DECLARATION_STATUS.NOT_STARTED]: 'Non commencée',
  [DECLARATION_STATUS.IN_PROGRESS]: 'En cours',
  [DECLARATION_STATUS.FINALIZED]: 'Finalisée'
};

/**
 * Declaration Year Store
 */
export const useDeclarationYearStore = create(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // State
        activeYear: declarationService.getAvailableTaxYears()[0],
        declarations: {}, // { 2024: { status, completionPercent, ... }, 2023: {...} }
        isLoading: false,
        isInitialized: false,
        error: null,

        // ==========================================
        // Getters (synchronous, from local state)
        // ==========================================

        getAvailableYears: () => declarationService.getAvailableTaxYears(),

        getActiveYear: () => get().activeYear,

        getDeclaration: (year) => {
          const decl = get().declarations[year];
          if (!decl) {
            return {
              year,
              status: DECLARATION_STATUS.NOT_STARTED,
              completionPercent: 0,
              startedAt: null,
              lastModifiedAt: null,
              finalizedAt: null,
              data: null
            };
          }
          return decl;
        },

        getActiveDeclaration: () => {
          return get().getDeclaration(get().activeYear);
        },

        getStatus: (year) => {
          const decl = get().declarations[year];
          return decl?.status || DECLARATION_STATUS.NOT_STARTED;
        },

        getStatusLabel: (year) => {
          const status = get().getStatus(year);
          const percent = get().getCompletionPercent(year);

          if (status === DECLARATION_STATUS.IN_PROGRESS) {
            return `En cours (${percent}%)`;
          }
          return STATUS_LABELS[status];
        },

        getCompletionPercent: (year) => {
          const decl = get().declarations[year];
          return decl?.completionPercent || 0;
        },

        getAllDeclarationsSummary: () => {
          const years = declarationService.getAvailableTaxYears();
          return years.map(year => ({
            year,
            ...get().getDeclaration(year),
            statusLabel: get().getStatusLabel(year)
          }));
        },

        // ==========================================
        // Actions (async, sync with Supabase)
        // ==========================================

        /**
         * Initialize store from Supabase (call on auth)
         */
        initialize: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const declarations = await declarationService.fetchUserDeclarations();

            set((state) => {
              state.declarations = {};
              declarations.forEach(decl => {
                state.declarations[decl.year] = decl;
              });
              state.isInitialized = true;
              state.isLoading = false;
            });

            return declarations;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        /**
         * Reset store (call on logout)
         */
        reset: () => {
          set((state) => {
            state.activeYear = declarationService.getAvailableTaxYears()[0];
            state.declarations = {};
            state.isInitialized = false;
            state.isLoading = false;
            state.error = null;
          });
        },

        /**
         * Set active year (local only, no DB call)
         */
        setActiveYear: (year) => {
          set((state) => {
            state.activeYear = year;
          });
        },

        /**
         * Start a declaration (creates/updates in DB)
         */
        startDeclaration: async (year) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const decl = await declarationService.startDeclaration(year);

            set((state) => {
              state.declarations[year] = decl;
              state.activeYear = year;
              state.isLoading = false;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        /**
         * Update progress (syncs to DB)
         */
        updateProgress: async (year, completionPercent, data = {}) => {
          try {
            const decl = await declarationService.updateProgress(year, completionPercent, data);

            set((state) => {
              state.declarations[year] = decl;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
            });
            throw error;
          }
        },

        /**
         * Finalize a declaration (mark as submitted)
         */
        finalizeDeclaration: async (year) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const decl = await declarationService.finalizeDeclaration(year);

            set((state) => {
              state.declarations[year] = decl;
              state.isLoading = false;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        /**
         * Reopen a finalized declaration for editing
         */
        reopenDeclaration: async (year) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          try {
            const decl = await declarationService.reopenDeclaration(year);

            set((state) => {
              state.declarations[year] = decl;
              state.isLoading = false;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
              state.isLoading = false;
            });
            throw error;
          }
        },

        /**
         * Save full declaration data
         */
        saveDeclarationData: async (year, declarationData) => {
          try {
            const decl = await declarationService.saveDeclarationData(year, declarationData);

            set((state) => {
              state.declarations[year] = decl;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
            });
            throw error;
          }
        },

        /**
         * Get declaration ID for document linking
         */
        getDeclarationId: async (year) => {
          // Check local cache first
          const decl = get().declarations[year];
          if (decl?.id) return decl.id;

          // Fetch from DB
          return await declarationService.getDeclarationIdForYear(year);
        },

        /**
         * Ensure a declaration exists for a year (get or create)
         */
        ensureDeclaration: async (year) => {
          // Check if already loaded
          const existing = get().declarations[year];
          if (existing?.id) return existing;

          try {
            const decl = await declarationService.getOrCreateDeclaration(year);

            set((state) => {
              state.declarations[year] = decl;
            });

            return decl;
          } catch (error) {
            set((state) => {
              state.error = error.message;
            });
            throw error;
          }
        }
      }))
    ),
    { name: 'DeclarationYearStore' }
  )
);

export default useDeclarationYearStore;
