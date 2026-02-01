/**
 * Tests for validation utilities
 * @jest-environment node
 */

import { validateEmail, parseMultipleEmails } from '@/lib/validation-utils';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    describe('valid emails', () => {
      it('should accept standard email format', () => {
        expect(validateEmail('user@example.com')).toBe(true);
      });

      it('should accept email with subdomain', () => {
        expect(validateEmail('user@mail.example.com')).toBe(true);
      });

      it('should accept email with numbers', () => {
        expect(validateEmail('user123@example.com')).toBe(true);
      });

      it('should accept email with dots in local part', () => {
        expect(validateEmail('first.last@example.com')).toBe(true);
      });

      it('should accept email with plus sign', () => {
        expect(validateEmail('user+tag@example.com')).toBe(true);
      });

      it('should accept email with hyphen in domain', () => {
        expect(validateEmail('user@my-domain.com')).toBe(true);
      });

      it('should accept email with country TLD', () => {
        expect(validateEmail('user@example.co.uk')).toBe(true);
      });

      it('should trim whitespace before validation', () => {
        expect(validateEmail('  user@example.com  ')).toBe(true);
      });

      it('should accept email with underscore', () => {
        expect(validateEmail('user_name@example.com')).toBe(true);
      });
    });

    describe('invalid emails', () => {
      it('should reject empty string', () => {
        expect(validateEmail('')).toBe(false);
      });

      it('should reject null', () => {
        expect(validateEmail(null as unknown as string)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validateEmail(undefined as unknown as string)).toBe(false);
      });

      it('should reject email without @', () => {
        expect(validateEmail('userexample.com')).toBe(false);
      });

      it('should reject email without domain', () => {
        expect(validateEmail('user@')).toBe(false);
      });

      it('should reject email without local part', () => {
        expect(validateEmail('@example.com')).toBe(false);
      });

      it('should reject email with spaces', () => {
        expect(validateEmail('user name@example.com')).toBe(false);
      });

      it('should reject email without TLD', () => {
        expect(validateEmail('user@example')).toBe(false);
      });

      it('should reject email with multiple @', () => {
        expect(validateEmail('user@@example.com')).toBe(false);
      });

      it('should reject non-string input', () => {
        expect(validateEmail(123 as unknown as string)).toBe(false);
      });

      it('should reject object input', () => {
        expect(validateEmail({} as unknown as string)).toBe(false);
      });

      it('should reject email with only spaces', () => {
        expect(validateEmail('   ')).toBe(false);
      });
    });
  });

  describe('parseMultipleEmails', () => {
    describe('comma separation', () => {
      it('should split emails by comma', () => {
        const result = parseMultipleEmails(
          'user1@example.com,user2@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
        ]);
        expect(result.invalid).toEqual([]);
      });

      it('should handle spaces around commas', () => {
        const result = parseMultipleEmails(
          'user1@example.com , user2@example.com , user3@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
          'user3@example.com',
        ]);
      });
    });

    describe('newline separation', () => {
      it('should split emails by newline', () => {
        const result = parseMultipleEmails(
          'user1@example.com\nuser2@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
        ]);
      });

      it('should handle carriage return and newline', () => {
        const result = parseMultipleEmails(
          'user1@example.com\r\nuser2@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
        ]);
      });

      it('should handle multiple newlines', () => {
        const result = parseMultipleEmails(
          'user1@example.com\n\n\nuser2@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
        ]);
      });
    });

    describe('mixed separation', () => {
      it('should handle comma and newline together', () => {
        const result = parseMultipleEmails(
          'user1@example.com,user2@example.com\nuser3@example.com'
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
          'user3@example.com',
        ]);
      });
    });

    describe('categorization', () => {
      it('should categorize valid and invalid emails', () => {
        const result = parseMultipleEmails(
          'valid@example.com,invalid-email,another@valid.org,@bad'
        );

        expect(result.valid).toEqual([
          'valid@example.com',
          'another@valid.org',
        ]);
        expect(result.invalid).toEqual(['invalid-email', '@bad']);
      });
    });

    describe('edge cases', () => {
      it('should return empty arrays for empty input', () => {
        const result = parseMultipleEmails('');

        expect(result.valid).toEqual([]);
        expect(result.invalid).toEqual([]);
      });

      it('should trim whitespace from emails', () => {
        const result = parseMultipleEmails(
          '  user1@example.com  ,  user2@example.com  '
        );

        expect(result.valid).toEqual([
          'user1@example.com',
          'user2@example.com',
        ]);
      });

      it('should filter out empty entries', () => {
        const result = parseMultipleEmails('user@example.com,,,');

        expect(result.valid).toEqual(['user@example.com']);
        expect(result.invalid).toEqual([]);
      });

      it('should handle single valid email', () => {
        const result = parseMultipleEmails('user@example.com');

        expect(result.valid).toEqual(['user@example.com']);
        expect(result.invalid).toEqual([]);
      });

      it('should handle single invalid email', () => {
        const result = parseMultipleEmails('invalid-email');

        expect(result.valid).toEqual([]);
        expect(result.invalid).toEqual(['invalid-email']);
      });

      it('should handle only whitespace and separators', () => {
        const result = parseMultipleEmails('   ,   \n   ');

        expect(result.valid).toEqual([]);
        expect(result.invalid).toEqual([]);
      });
    });
  });
});
