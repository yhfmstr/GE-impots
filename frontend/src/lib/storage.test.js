import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  saveSecure,
  loadSecure,
  removeSecure,
  clearAllData,
  exportData,
  importData,
  validateTaxData,
} from './storage';

describe('storage.js', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.getItem.mockReturnValue(null);
    localStorage.setItem.mockImplementation(() => {});
    localStorage.removeItem.mockImplementation(() => {});
    localStorage.clear.mockImplementation(() => {});
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required storage keys', () => {
      expect(STORAGE_KEYS.TAX_DATA).toBe('taxDeclarationData');
      expect(STORAGE_KEYS.EXTRACTIONS).toBe('documentExtractions');
      expect(STORAGE_KEYS.ARCHIVES).toBe('taxDeclarationArchives');
      expect(STORAGE_KEYS.SETTINGS).toBe('userSettings');
      expect(STORAGE_KEYS.CHAT_HISTORY).toBe('chatConversations');
    });
  });

  describe('saveSecure', () => {
    it('should save encrypted data to localStorage', () => {
      const data = { salary: 120000 };
      const result = saveSecure('testKey', data);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalledTimes(1);
      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', expect.stringContaining('GEI:v1:'));
    });

    it('should return false if encryption fails', () => {
      // Create circular reference that can't be stringified
      const circular = {};
      circular.self = circular;

      const result = saveSecure('testKey', circular);
      expect(result).toBe(false);
    });

    it('should handle localStorage errors', () => {
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      const result = saveSecure('testKey', { data: 'test' });
      expect(result).toBe(false);
    });
  });

  describe('loadSecure', () => {
    it('should return default value when key not found', () => {
      localStorage.getItem.mockReturnValue(null);

      const result = loadSecure('nonexistent', 'default');
      expect(result).toBe('default');
    });

    it('should return default value when decryption fails', () => {
      localStorage.getItem.mockReturnValue('GEI:v1:invalid_encrypted_data');

      const result = loadSecure('testKey', 'default');
      expect(result).toBe('default');
    });

    it('should migrate unencrypted JSON data', () => {
      const plainData = { salary: 50000 };
      localStorage.getItem.mockReturnValue(JSON.stringify(plainData));

      const result = loadSecure('testKey');

      expect(result).toEqual(plainData);
      // Should have re-saved encrypted
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should return default for invalid JSON', () => {
      localStorage.getItem.mockReturnValue('not valid json');

      const result = loadSecure('testKey', { empty: true });
      expect(result).toEqual({ empty: true });
    });
  });

  describe('removeSecure', () => {
    it('should remove item from localStorage', () => {
      const result = removeSecure('testKey');

      expect(result).toBe(true);
      expect(localStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should handle localStorage errors', () => {
      localStorage.removeItem.mockImplementation(() => {
        throw new Error('Error');
      });

      const result = removeSecure('testKey');
      expect(result).toBe(false);
    });
  });

  describe('clearAllData', () => {
    it('should remove all storage keys', () => {
      clearAllData();

      const keyCount = Object.values(STORAGE_KEYS).length;
      expect(localStorage.removeItem).toHaveBeenCalledTimes(keyCount);

      Object.values(STORAGE_KEYS).forEach(key => {
        expect(localStorage.removeItem).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('exportData', () => {
    it('should export all stored data', () => {
      localStorage.getItem.mockReturnValue(null);

      const result = exportData();

      expect(result).toHaveProperty('TAX_DATA');
      expect(result).toHaveProperty('EXTRACTIONS');
      expect(result).toHaveProperty('ARCHIVES');
      expect(result).toHaveProperty('SETTINGS');
      expect(result).toHaveProperty('CHAT_HISTORY');
    });
  });

  describe('importData', () => {
    it('should import data for all keys', () => {
      const data = {
        TAX_DATA: { salary: 100000 },
        EXTRACTIONS: [],
        ARCHIVES: [],
        SETTINGS: { theme: 'dark' },
      };

      const result = importData(data);

      expect(result).toBe(true);
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    it('should skip undefined values', () => {
      const data = {
        TAX_DATA: { salary: 100000 },
        // EXTRACTIONS is undefined
      };

      const result = importData(data);
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', () => {
      // importData returns true even if individual saves fail
      // because it tries to save each key independently
      localStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      // The function catches errors internally per-key
      const result = importData({ TAX_DATA: {} });
      // It returns true if iteration completes, regardless of individual saves
      expect(result).toBe(true);
    });
  });

  describe('validateTaxData', () => {
    it('should return empty object for null input', () => {
      expect(validateTaxData(null)).toEqual({});
    });

    it('should return empty object for non-object input', () => {
      expect(validateTaxData('string')).toEqual({});
      expect(validateTaxData(123)).toEqual({});
    });

    it('should keep allowed keys', () => {
      const data = {
        grossSalary: 120000,
        avsContributions: 6300,
        lppContributions: 8500,
        pilier3a: 7056,
      };

      const result = validateTaxData(data);

      expect(result.grossSalary).toBe(120000);
      expect(result.avsContributions).toBe(6300);
      expect(result.lppContributions).toBe(8500);
      expect(result.pilier3a).toBe(7056);
    });

    it('should filter out unknown keys', () => {
      const data = {
        grossSalary: 120000,
        maliciousScript: '<script>alert("xss")</script>',
        unknownField: 'should be removed',
      };

      const result = validateTaxData(data);

      expect(result.grossSalary).toBe(120000);
      expect(result.maliciousScript).toBeUndefined();
      expect(result.unknownField).toBeUndefined();
    });

    it('should preserve nested income object', () => {
      const data = {
        income: { primary: 100000, secondary: 20000 },
      };

      const result = validateTaxData(data);
      expect(result.income).toEqual({ primary: 100000, secondary: 20000 });
    });
  });
});
