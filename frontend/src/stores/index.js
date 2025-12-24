/**
 * Stores Index
 *
 * Central export for all Zustand stores.
 * Use these stores instead of direct localStorage access.
 */

export { useTaxDataStore } from './taxDataStore';
export { useDocumentsStore } from './documentsStore';
export { useUIStore, useTheme, TOAST_TYPES } from './uiStore';

/**
 * Combined hook to access all stores
 * Useful for components that need multiple stores
 */
export function useStores() {
  const { useTaxDataStore } = require('./taxDataStore');
  const { useDocumentsStore } = require('./documentsStore');
  const { useUIStore } = require('./uiStore');

  return {
    taxData: useTaxDataStore(),
    documents: useDocumentsStore(),
    ui: useUIStore()
  };
}
