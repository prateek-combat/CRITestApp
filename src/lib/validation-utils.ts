/**
 * Common validation utilities to reduce code duplication
 */

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a single email address
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
}

/**
 * Parse and validate multiple emails from text (comma or newline separated)
 */
export function parseMultipleEmails(emailText: string): {
  valid: string[];
  invalid: string[];
} {
  const emails = emailText
    .split(/[,\n\r]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}