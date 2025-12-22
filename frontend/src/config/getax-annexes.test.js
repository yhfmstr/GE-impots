import { describe, it, expect } from 'vitest';
import {
  GETAX_PAGES,
  DOCUMENT_TYPE_NAMES,
  getAnnexeById,
  getDocumentTypeName,
  getAllDocumentTypes,
  getTotalFieldCount,
} from './getax-annexes';

describe('getax-annexes.js', () => {
  describe('GETAX_PAGES', () => {
    it('should have 6 annexes', () => {
      expect(GETAX_PAGES).toHaveLength(6);
    });

    it('should have correct annexe IDs', () => {
      const ids = GETAX_PAGES.map(p => p.id);
      expect(ids).toEqual([
        'annexe-a',
        'annexe-b',
        'annexe-c',
        'annexe-d',
        'annexe-e',
        'annexe-f',
      ]);
    });

    it('should have name, description and fields for each annexe', () => {
      GETAX_PAGES.forEach(annexe => {
        expect(annexe.name).toBeDefined();
        expect(annexe.description).toBeDefined();
        expect(annexe.fields).toBeInstanceOf(Array);
        expect(annexe.fields.length).toBeGreaterThan(0);
      });
    });

    it('should have valid field structure', () => {
      GETAX_PAGES.forEach(annexe => {
        annexe.fields.forEach(field => {
          expect(field.code).toBeDefined();
          expect(field.name).toBeDefined();
          // Either calculated or has source
          if (!field.calculated) {
            expect(field.source).toBeDefined();
          }
        });
      });
    });

    it('should have unique rubrique codes across all annexes', () => {
      const allCodes = GETAX_PAGES.flatMap(p => p.fields.map(f => f.code));
      const uniqueCodes = new Set(allCodes);
      expect(uniqueCodes.size).toBe(allCodes.length);
    });
  });

  describe('DOCUMENT_TYPE_NAMES', () => {
    it('should have French names for all document types', () => {
      Object.entries(DOCUMENT_TYPE_NAMES).forEach(([key, value]) => {
        expect(typeof key).toBe('string');
        expect(typeof value).toBe('string');
        expect(value.length).toBeGreaterThan(0);
      });
    });

    it('should include key document types', () => {
      expect(DOCUMENT_TYPE_NAMES['certificat-salaire']).toBe('Certificat de salaire');
      expect(DOCUMENT_TYPE_NAMES['attestation-3a']).toBe('Attestation 3ème pilier A');
      expect(DOCUMENT_TYPE_NAMES['attestation-maladie']).toBe('Attestation assurance maladie');
    });
  });

  describe('getAnnexeById', () => {
    it('should find annexe by ID', () => {
      const annexeA = getAnnexeById('annexe-a');
      expect(annexeA).toBeDefined();
      expect(annexeA.id).toBe('annexe-a');
      expect(annexeA.name).toContain('Annexe A');
    });

    it('should return undefined for unknown ID', () => {
      expect(getAnnexeById('annexe-z')).toBeUndefined();
    });
  });

  describe('getDocumentTypeName', () => {
    it('should return French name for known types', () => {
      expect(getDocumentTypeName('certificat-salaire')).toBe('Certificat de salaire');
    });

    it('should return key for unknown types', () => {
      expect(getDocumentTypeName('unknown-type')).toBe('unknown-type');
    });
  });

  describe('getAllDocumentTypes', () => {
    it('should return array of unique document types', () => {
      const types = getAllDocumentTypes();
      expect(types).toBeInstanceOf(Array);
      expect(types.length).toBeGreaterThan(5);

      // Should be unique
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(types.length);
    });

    it('should include common document types', () => {
      const types = getAllDocumentTypes();
      expect(types).toContain('certificat-salaire');
      expect(types).toContain('releve-bancaire');
    });
  });

  describe('getTotalFieldCount', () => {
    it('should return total number of fields', () => {
      const count = getTotalFieldCount();
      expect(count).toBeGreaterThan(50); // We have ~80+ fields
      expect(typeof count).toBe('number');
    });

    it('should match sum of individual annexe fields', () => {
      const manualCount = GETAX_PAGES.reduce((sum, p) => sum + p.fields.length, 0);
      expect(getTotalFieldCount()).toBe(manualCount);
    });
  });
});
