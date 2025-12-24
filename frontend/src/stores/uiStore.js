/**
 * UI Store (Zustand)
 *
 * Manages UI state: theme, modals, toasts, sidebar state.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

const STORAGE_KEY = 'ge-impots-ui';

/**
 * Toast types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * UI Store
 */
export const useUIStore = create(
  devtools(
    persist(
      immer((set, get) => ({
        // Theme state
        theme: 'system', // 'light' | 'dark' | 'system'
        resolvedTheme: 'light', // Actual theme after resolving 'system'

        // Sidebar state
        sidebarOpen: true,
        sidebarCollapsed: false,

        // Modal state
        activeModal: null,
        modalData: null,

        // Toasts
        toasts: [],

        // Loading states
        globalLoading: false,
        loadingMessage: '',

        // Theme actions
        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
            // Resolve system theme
            if (theme === 'system') {
              const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              state.resolvedTheme = prefersDark ? 'dark' : 'light';
            } else {
              state.resolvedTheme = theme;
            }
          });
        },

        toggleTheme: () => {
          const current = get().resolvedTheme;
          get().setTheme(current === 'dark' ? 'light' : 'dark');
        },

        // Sidebar actions
        toggleSidebar: () => {
          set((state) => {
            state.sidebarOpen = !state.sidebarOpen;
          });
        },

        setSidebarOpen: (open) => {
          set((state) => {
            state.sidebarOpen = open;
          });
        },

        setSidebarCollapsed: (collapsed) => {
          set((state) => {
            state.sidebarCollapsed = collapsed;
          });
        },

        // Modal actions
        openModal: (modalId, data = null) => {
          set((state) => {
            state.activeModal = modalId;
            state.modalData = data;
          });
        },

        closeModal: () => {
          set((state) => {
            state.activeModal = null;
            state.modalData = null;
          });
        },

        // Toast actions
        showToast: ({ type = TOAST_TYPES.INFO, title, message, duration = 5000 }) => {
          const id = crypto.randomUUID();
          set((state) => {
            state.toasts.push({
              id,
              type,
              title,
              message,
              createdAt: Date.now()
            });
          });

          // Auto-dismiss
          if (duration > 0) {
            setTimeout(() => {
              get().dismissToast(id);
            }, duration);
          }

          return id;
        },

        dismissToast: (id) => {
          set((state) => {
            state.toasts = state.toasts.filter(t => t.id !== id);
          });
        },

        clearAllToasts: () => {
          set((state) => {
            state.toasts = [];
          });
        },

        // Loading actions
        setGlobalLoading: (loading, message = '') => {
          set((state) => {
            state.globalLoading = loading;
            state.loadingMessage = message;
          });
        }
      })),
      {
        name: STORAGE_KEY,
        partialize: (state) => ({
          theme: state.theme,
          sidebarCollapsed: state.sidebarCollapsed
        })
      }
    ),
    { name: 'UIStore' }
  )
);

/**
 * Hook to get resolved theme and apply to document
 */
export function useTheme() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useUIStore();

  // Apply theme to document
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }

  return { theme, resolvedTheme, setTheme, toggleTheme };
}

export default useUIStore;
