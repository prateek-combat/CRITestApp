/**
 * Tests for email utility functions
 * @jest-environment node
 *
 * Note: Email sending tests require nodemailer mocking which is complex
 * due to the transporter being created at module load time. We focus on
 * testing the validation and parsing functions that are pure and don't
 * depend on the transporter.
 */

import {
  validateEmail,
  validateEmailAddresses,
  parseMultipleEmails,
} from '@/lib/email';

describe('Email', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.org')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });

    it('should trim whitespace', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });

    it('should handle edge cases', () => {
      expect(validateEmail('a@b.co')).toBe(true);
      expect(validateEmail('user.name+tag@sub.domain.com')).toBe(true);
      expect(validateEmail('test@123.45.67.89')).toBe(true);
    });
  });

  describe('validateEmailAddresses', () => {
    it('should categorize valid and invalid emails', () => {
      const result = validateEmailAddresses([
        'valid@example.com',
        'invalid',
        'another@valid.org',
      ]);

      expect(result.valid).toEqual(['valid@example.com', 'another@valid.org']);
      expect(result.invalid).toEqual(['invalid']);
    });

    it('should trim valid emails', () => {
      const result = validateEmailAddresses(['  user@example.com  ']);

      expect(result.valid).toEqual(['user@example.com']);
    });

    it('should handle empty array', () => {
      const result = validateEmailAddresses([]);

      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual([]);
    });

    it('should handle all invalid emails', () => {
      const result = validateEmailAddresses(['bad', 'worse', 'terrible']);

      expect(result.valid).toEqual([]);
      expect(result.invalid).toEqual(['bad', 'worse', 'terrible']);
    });

    it('should handle all valid emails', () => {
      const result = validateEmailAddresses(['a@b.com', 'c@d.org', 'e@f.net']);

      expect(result.valid).toEqual(['a@b.com', 'c@d.org', 'e@f.net']);
      expect(result.invalid).toEqual([]);
    });
  });

  describe('parseMultipleEmails', () => {
    it('should split by comma', () => {
      const result = parseMultipleEmails('a@b.com,c@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should split by semicolon', () => {
      const result = parseMultipleEmails('a@b.com;c@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should split by newline', () => {
      const result = parseMultipleEmails('a@b.com\nc@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should split by tab', () => {
      const result = parseMultipleEmails('a@b.com\tc@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should split by carriage return', () => {
      const result = parseMultipleEmails('a@b.com\rc@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should split by CRLF', () => {
      const result = parseMultipleEmails('a@b.com\r\nc@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should trim whitespace', () => {
      const result = parseMultipleEmails('  a@b.com  ,  c@d.com  ');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should filter empty entries', () => {
      const result = parseMultipleEmails('a@b.com,,,c@d.com');

      expect(result).toEqual(['a@b.com', 'c@d.com']);
    });

    it('should return empty array for empty input', () => {
      expect(parseMultipleEmails('')).toEqual([]);
    });

    it('should return empty array for null-like input', () => {
      expect(parseMultipleEmails(null as unknown as string)).toEqual([]);
      expect(parseMultipleEmails(undefined as unknown as string)).toEqual([]);
    });

    it('should handle mixed delimiters', () => {
      const result = parseMultipleEmails('a@b.com,c@d.com;e@f.com\ng@h.com');

      expect(result).toEqual(['a@b.com', 'c@d.com', 'e@f.com', 'g@h.com']);
    });

    it('should handle single email', () => {
      const result = parseMultipleEmails('single@email.com');

      expect(result).toEqual(['single@email.com']);
    });

    it('should handle whitespace only', () => {
      const result = parseMultipleEmails('   \n\t   ');

      expect(result).toEqual([]);
    });
  });
});
