/**
 * Application Constants
 * Centralized configuration for commonly used values
 */

// URL Configuration
export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
export const DEFAULT_PORT = 3000;

// Test Database Configuration (for testing only)
export const TEST_DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';

// Email Configuration
export const EMAIL_FROM = process.env.SMTP_FROM || 'noreply@combatrobotics.in';
export const EMAIL_COMPANY_NAME = 'Combat Robotics India';

// Proctoring Configuration
export const PROCTORING_RISK_THRESHOLDS = {
  LOW: 10.0,
  MEDIUM: 25.0,
  HIGH: 50.0,
} as const;

// Risk Weights for Proctoring Events
export const PROCTORING_RISK_WEIGHTS = {
  // Browser behavior events
  TAB_HIDDEN: 2.0,
  WINDOW_BLUR: 1.5,
  DEVTOOLS_DETECTED: 5.0,
  DEVTOOLS_SHORTCUT: 3.0,
  F12_PRESSED: 2.0,
  COPY_DETECTED: 3.0,
  PASTE_DETECTED: 4.0,
  CONTEXT_MENU_DETECTED: 1.0,
  KEYBOARD_SHORTCUT: 2.0,
  MOUSE_LEFT_WINDOW: 1.0,
  INACTIVITY_DETECTED: 2.0,

  // Video analysis events
  LOOK_AWAY: 2.5,
  PHONE_DETECTED: 8.0,
  MULTIPLE_PEOPLE: 10.0,

  // Audio analysis events
  SUSPICIOUS_SILENCE: 1.5,
  MULTIPLE_SPEAKERS_DETECTED: 8.0,
  POSSIBLE_SPEAKER_CHANGE: 1.0,
  BACKGROUND_NOISE: 0.5,
} as const;

// Test Configuration
export const DEFAULT_QUESTION_TIMER = 60; // seconds
export const MAX_FILE_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Session Configuration
export const SESSION_TIMEOUT = 24 * 60 * 60; // 24 hours in seconds

// API Rate Limiting
export const API_RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
} as const;
