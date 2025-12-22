import CryptoJS from 'crypto-js';

/**
 * LOCAL STORAGE ENCRYPTION
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
const ENCRYPTION_KEY = import.meta.env.VITE_STORAGE_KEY || 'ge-impots-2024-local-key';

// Encryption version marker for format detection
const ENCRYPTION_PREFIX = 'GEI:v1:';

// Storage keys
export const STORAGE_KEYS = {
  TAX_DATA: 'taxDeclarationData',
  EXTRACTIONS: 'documentExtractions',
  ARCHIVES: 'taxDeclarationArchives',
  SETTINGS: 'userSettings',
  CHAT_HISTORY: 'chatConversations',
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
