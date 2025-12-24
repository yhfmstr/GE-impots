import CryptoJS from 'crypto-js';

/**
 * LOCAL STORAGE ENCRYPTION & ZUSTAND BRIDGE
 *
 * This module provides:
 * 1. Encrypted localStorage utilities (obfuscation layer)
 * 2. Bridge functions to sync with Zustand stores
 *
 * IMPORTANT SECURITY NOTE:
 * This encryption provides obfuscation of localStorage data to prevent casual
 * inspection. It does NOT provide true security against determined attackers
 * since the key is embedded in the client-side JavaScript bundle.
 *
 * For true security, implement:
 * - Server-side storage with proper authentication
 * - User-derived encryption keys (from password)
 *
 * Current implementation protects against:
 * - Casual localStorage inspection by other users of shared computer
 * - Basic browser extensions reading localStorage
 *
 * Does NOT protect against:
 * - Attackers with access to the JavaScript bundle
 * - Browser developer tools when app is open
 */

// Encryption key - obfuscation only, not true security
// SECURITY: Fallback key is used ONLY in development. In production, VITE_STORAGE_KEY must be set.
const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_KEY || (
  import.meta.env.DEV
    ? 'ge-impots-dev-local-key-not-for-production'
    : (() => {
        console.error('CRITICAL: VITE_STORAGE_KEY is not configured in production!');
        return 'ge-impots-emergency-fallback-please-configure';
      })()
);

// Encryption version marker for format detection
const ENCRYPTION_PREFIX = 'GEI:v1:';

// Storage keys (kept for backward compatibility)
export const STORAGE_KEYS = {
  TAX_DATA: 'taxDeclarationData',
  EXTRACTIONS: 'documentExtractions',
  ARCHIVES: 'taxDeclarationArchives',
  SETTINGS: 'userSettings',
  CHAT_HISTORY: 'chatConversations',
  SUGGESTIONS: 'fieldSuggestions', // Auto-fill suggestions from documents
  WIZARD_PROFILE: 'wizardProfile', // Selected wizard profile
  PROFILER_ANSWERS: 'profilerAnswers', // Pre-login survey answers
  PROFILER_PROFILE: 'profilerProfile', // Detected user profile from survey
};

// Zustand store keys (mapped to new persist middleware)
export const ZUSTAND_STORAGE_KEYS = {
  TAX_DATA: 'ge-impots-tax-data',
  DOCUMENTS: 'ge-impots-documents',
  UI: 'ge-impots-ui',
};

// Encrypt data with version prefix
function encrypt(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
    return ENCRYPTION_PREFIX + encrypted;
  } catch {
    return null;
  }
}

// Decrypt data
function decrypt(encryptedData) {
  try {
    // Remove version prefix if present
    let data = encryptedData;
    if (data.startsWith(ENCRYPTION_PREFIX)) {
      data = data.slice(ENCRYPTION_PREFIX.length);
    }
    const bytes = CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      return null;
    }
    return JSON.parse(decryptedString);
  } catch {
    return null;
  }
}

// Check if data is encrypted using version prefix or legacy format
function isEncrypted(data) {
  if (typeof data !== 'string') return false;
  // Check for versioned format first
  if (data.startsWith(ENCRYPTION_PREFIX)) return true;
  // Legacy format check (CryptoJS AES base64 starts with U2F)
  if (data.startsWith('U2F')) return true;
  return false;
}

// Save data to localStorage with encryption
export function saveSecure(key, data) {
  try {
    const encrypted = encrypt(data);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Load data from localStorage with decryption
export function loadSecure(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    // Handle migration from unencrypted data
    if (!isEncrypted(stored)) {
      // Try to parse as plain JSON (old format)
      try {
        const data = JSON.parse(stored);
        // Re-save encrypted
        saveSecure(key, data);
        return data;
      } catch {
        return defaultValue;
      }
    }

    const decrypted = decrypt(stored);
    return decrypted !== null ? decrypted : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Remove data from localStorage
export function removeSecure(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Clear all tax-related data
export function clearAllData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
}

// Export data as JSON (for download)
export function exportData() {
  const data = {};
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = loadSecure(key);
  });
  return data;
}

// Import data from JSON
export function importData(data) {
  try {
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name] !== undefined) {
        saveSecure(key, data[name]);
      }
    });
    return true;
  } catch {
    return false;
  }
}

// Validate and sanitize tax data structure
export function validateTaxData(data) {
  if (!data || typeof data !== 'object') return {};

  // Basic structure validation
  const sanitized = {};
  const allowedTopLevelKeys = [
    'year', 'income', 'deductions', 'wealth', 'personal',
    'grossSalary', 'avsContributions', 'lppContributions', 'pilier3a',
    'healthInsurance', 'bankAccounts', 'securities', 'mortgageInterest',
    'childcareCosts', 'trainingCosts', 'rachatLPP', 'pilier3b'
  ];

  for (const key of allowedTopLevelKeys) {
    if (data[key] !== undefined) {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
}

// ============================================
// ZUSTAND PERSISTENCE ADAPTER
// ============================================

/**
 * Create encrypted storage adapter for Zustand persist middleware
 * Use this when configuring Zustand stores for encrypted persistence
 *
 * @example
 * import { createEncryptedStorage } from '@/lib/storage';
 *
 * const useMyStore = create(
 *   persist(
 *     (set, get) => ({ ... }),
 *     {
 *       name: 'my-store',
 *       storage: createEncryptedStorage(),
 *     }
 *   )
 * );
 */
export function createEncryptedStorage() {
  return {
    getItem: (name) => {
      const value = localStorage.getItem(name);
      if (!value) return null;

      // Decrypt if encrypted
      if (isEncrypted(value)) {
        const decrypted = decrypt(value);
        return decrypted ? JSON.stringify(decrypted) : null;
      }

      // Return as-is if not encrypted (for migration)
      return value;
    },
    setItem: (name, value) => {
      try {
        // Parse and re-encrypt
        const parsed = JSON.parse(value);
        const encrypted = encrypt(parsed);
        if (encrypted) {
          localStorage.setItem(name, encrypted);
        }
      } catch {
        // Store raw if parsing fails
        localStorage.setItem(name, value);
      }
    },
    removeItem: (name) => {
      localStorage.removeItem(name);
    },
  };
}

/**
 * Migrate legacy storage data to Zustand stores
 * Call this once on app initialization to migrate old data
 */
export function migrateLegacyStorageToZustand() {
  const migrationResults = {
    taxData: false,
    documents: false,
    settings: false,
  };

  try {
    // Migrate tax declaration data
    const legacyTaxData = loadSecure(STORAGE_KEYS.TAX_DATA);
    if (legacyTaxData) {
      const zustandTaxData = localStorage.getItem(ZUSTAND_STORAGE_KEYS.TAX_DATA);
      if (!zustandTaxData) {
        // Convert legacy format to Zustand format
        const zustandFormat = {
          state: {
            declaration: validateTaxData(legacyTaxData),
            isDirty: false,
            validationErrors: {},
          },
          version: 0,
        };
        const encrypted = encrypt(zustandFormat);
        if (encrypted) {
          localStorage.setItem(ZUSTAND_STORAGE_KEYS.TAX_DATA, encrypted);
          migrationResults.taxData = true;
        }
      }
    }

    // Migrate document extractions
    const legacyExtractions = loadSecure(STORAGE_KEYS.EXTRACTIONS);
    const legacySuggestions = loadSecure(STORAGE_KEYS.SUGGESTIONS);
    if (legacyExtractions || legacySuggestions) {
      const zustandDocData = localStorage.getItem(ZUSTAND_STORAGE_KEYS.DOCUMENTS);
      if (!zustandDocData) {
        const zustandFormat = {
          state: {
            documents: [],
            extractions: legacyExtractions || [],
            suggestions: legacySuggestions || {},
            pendingSuggestions: [],
            isUploading: false,
            isExtracting: false,
          },
          version: 0,
        };
        const encrypted = encrypt(zustandFormat);
        if (encrypted) {
          localStorage.setItem(ZUSTAND_STORAGE_KEYS.DOCUMENTS, encrypted);
          migrationResults.documents = true;
        }
      }
    }

    // Migrate user settings
    const legacySettings = loadSecure(STORAGE_KEYS.SETTINGS);
    if (legacySettings) {
      const zustandUIData = localStorage.getItem(ZUSTAND_STORAGE_KEYS.UI);
      if (!zustandUIData) {
        const zustandFormat = {
          state: {
            theme: legacySettings.theme || 'system',
            sidebarCollapsed: legacySettings.sidebarCollapsed || false,
          },
          version: 0,
        };
        const encrypted = encrypt(zustandFormat);
        if (encrypted) {
          localStorage.setItem(ZUSTAND_STORAGE_KEYS.UI, encrypted);
          migrationResults.settings = true;
        }
      }
    }
  } catch (error) {
    console.error('[Storage] Migration error:', error);
  }

  return migrationResults;
}

/**
 * Check if legacy storage data exists that needs migration
 */
export function hasLegacyData() {
  return !!(
    localStorage.getItem(STORAGE_KEYS.TAX_DATA) ||
    localStorage.getItem(STORAGE_KEYS.EXTRACTIONS) ||
    localStorage.getItem(STORAGE_KEYS.SETTINGS)
  );
}

/**
 * Clean up legacy storage keys after successful migration
 * Only call this after confirming migration was successful
 */
export function cleanupLegacyStorage() {
  const legacyKeys = [
    STORAGE_KEYS.TAX_DATA,
    STORAGE_KEYS.EXTRACTIONS,
    STORAGE_KEYS.SETTINGS,
    STORAGE_KEYS.SUGGESTIONS,
  ];

  legacyKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore removal errors
    }
  });
}
