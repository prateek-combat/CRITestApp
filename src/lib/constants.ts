/**
 * Application Constants
 * Centralized configuration for commonly used values
 */

// URL Configuration
export const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Proctoring Configuration
export const PROCTORING_RISK_THRESHOLDS = {
  LOW: 10.0,
  MEDIUM: 25.0,
  HIGH: 50.0,
} as const;

// Proctoring is mandatory for all tests
export const DISABLE_PROCTORING_REQUIREMENTS = false;

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
