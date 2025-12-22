/**
 * Type definitions index file
 */

export * from './tax';

// Environment variables
declare global {
  interface ImportMetaEnv {
    readonly VITE_API_URL: string;
    readonly VITE_STORAGE_KEY: string;
    readonly VITE_TAX_YEAR: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}
