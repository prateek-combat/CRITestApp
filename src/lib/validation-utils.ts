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

/**
 * Validate required fields in an object
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(String(field));
    }
  });

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Sanitize text input by trimming and limiting length
 */
export function sanitizeText(
  text: string | undefined | null,
  maxLength = 1000
): string {
  if (!text || typeof text !== 'string') return '';
  return text.trim().substring(0, maxLength);
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate safe percentage to avoid division by zero
 */
export function safePercentage(value: number, total: number): number {
  if (total === 0 || isNaN(value) || isNaN(total)) return 0;
  const percentage = (value / total) * 100;
  return isNaN(percentage) ? 0 : Math.round(percentage * 10) / 10;
}

/**
 * Format duration in seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Debounce function to limit rapid function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Generate a random string of specified length
 */
export function generateRandomString(length: number = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
