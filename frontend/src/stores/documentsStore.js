/**
 * Documents Store (Zustand)
 *
 * Manages document uploads, extractions, and suggestions.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const STORAGE_KEY = 'ge-impots-documents';

/**
 * Documents Store
 */
export const useDocumentsStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // State
        documents: [],
        extractions: [],
        suggestions: {},
        uploadProgress: {},

        // Get extraction by document ID
        getExtractionByDocId: (docId) => {
          return get().extractions.find(e => e.documentId === docId);
        },

        // Get all suggestions for a field
        getSuggestionsForField: (fieldPath) => {
          return get().suggestions[fieldPath] || [];
        },

        // Actions
        addDocument: (document) => {
          set((state) => {
            state.documents.push({
              id: crypto.randomUUID(),
              uploadedAt: new Date().toISOString(),
              ...document
            });
          });
        },

        updateDocument: (id, updates) => {
          set((state) => {
            const index = state.documents.findIndex(d => d.id === id);
            if (index !== -1) {
              state.documents[index] = { ...state.documents[index], ...updates };
            }
          });
        },

        removeDocument: (id) => {
          set((state) => {
            state.documents = state.documents.filter(d => d.id !== id);
            state.extractions = state.extractions.filter(e => e.documentId !== id);
          });
        },

        addExtraction: (extraction) => {
          set((state) => {
            const id = crypto.randomUUID();
            state.extractions.push({
              id,
              extractedAt: new Date().toISOString(),
              ...extraction
            });

            // Generate suggestions from extraction
            if (extraction.data && extraction.fieldMappings) {
              for (const [sourceField, targetPath] of Object.entries(extraction.fieldMappings)) {
                if (extraction.data[sourceField] !== undefined) {
                  if (!state.suggestions[targetPath]) {
                    state.suggestions[targetPath] = [];
                  }
                  state.suggestions[targetPath].push({
                    value: extraction.data[sourceField],
                    source: extraction.documentType,
                    extractionId: id,
                    confidence: extraction.confidence || 0.9
                  });
                }
              }
            }
          });
        },

        clearSuggestion: (fieldPath, index) => {
          set((state) => {
            if (state.suggestions[fieldPath]) {
              state.suggestions[fieldPath].splice(index, 1);
              if (state.suggestions[fieldPath].length === 0) {
                delete state.suggestions[fieldPath];
              }
            }
          });
        },

        clearAllSuggestions: () => {
          set((state) => {
            state.suggestions = {};
          });
        },

        setUploadProgress: (documentId, progress) => {
          set((state) => {
            state.uploadProgress[documentId] = progress;
          });
        },

        clearUploadProgress: (documentId) => {
          set((state) => {
            delete state.uploadProgress[documentId];
          });
        },

        clearAll: () => {
          set((state) => {
            state.documents = [];
            state.extractions = [];
            state.suggestions = {};
            state.uploadProgress = {};
          });
        }
      })),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          documents: state.documents,
          extractions: state.extractions,
          suggestions: state.suggestions
        })
      }
    ),
    { name: 'DocumentsStore' }
  )
);

export default useDocumentsStore;
