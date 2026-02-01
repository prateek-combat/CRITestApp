/**
 * Tests for secure storage functionality
 * @jest-environment node
 *
 * Note: These tests run in a Node.js environment where `typeof window === 'undefined'`
 * is true, so the storage functions operate in server-side mode (no-op).
 * We test the exported interfaces and verify no errors occur.
 */

import {
  secureStorage,
  testProgressStorage,
  clearAllClientStorage,
} from '@/lib/secure-storage';

describe('Secure Storage', () => {
  describe('secureStorage', () => {
    describe('setItem', () => {
      it('should not throw when called', () => {
        expect(() =>
          secureStorage.setItem('test-key', { value: 123 })
        ).not.toThrow();
      });

      it('should handle various data types', () => {
        expect(() => secureStorage.setItem('string', 'hello')).not.toThrow();
        expect(() => secureStorage.setItem('number', 42)).not.toThrow();
        expect(() => secureStorage.setItem('boolean', true)).not.toThrow();
        expect(() => secureStorage.setItem('array', [1, 2, 3])).not.toThrow();
        expect(() => secureStorage.setItem('object', { a: 1 })).not.toThrow();
        expect(() => secureStorage.setItem('null', null)).not.toThrow();
      });
    });

    describe('getItem', () => {
      it('should return null in server environment', () => {
        const result = secureStorage.getItem('any-key');
        expect(result).toBeNull();
      });

      it('should accept type parameter', () => {
        const result = secureStorage.getItem<string>('typed-key');
        expect(result).toBeNull();
      });
    });

    describe('removeItem', () => {
      it('should not throw when called', () => {
        expect(() => secureStorage.removeItem('test-key')).not.toThrow();
      });
    });

    describe('clear', () => {
      it('should not throw when called', () => {
        expect(() => secureStorage.clear()).not.toThrow();
      });
    });

    describe('hasItem', () => {
      it('should return false in server environment', () => {
        const result = secureStorage.hasItem('any-key');
        expect(result).toBe(false);
      });
    });
  });

  describe('testProgressStorage', () => {
    describe('saveProgress', () => {
      it('should not throw when saving progress', () => {
        const progress = { questionIndex: 5, answers: { q1: 'a' } };
        expect(() =>
          testProgressStorage.saveProgress('attempt-123', progress)
        ).not.toThrow();
      });
    });

    describe('loadProgress', () => {
      it('should return null in server environment', () => {
        const result = testProgressStorage.loadProgress('attempt-456');
        expect(result).toBeNull();
      });
    });

    describe('clearProgress', () => {
      it('should not throw when clearing progress', () => {
        expect(() =>
          testProgressStorage.clearProgress('attempt-789')
        ).not.toThrow();
      });
    });
  });

  describe('clearAllClientStorage', () => {
    it('should not throw when called', () => {
      expect(() => clearAllClientStorage()).not.toThrow();
    });

    it('should be safe to call multiple times', () => {
      clearAllClientStorage();
      clearAllClientStorage();
      clearAllClientStorage();
      expect(true).toBe(true);
    });
  });
});
