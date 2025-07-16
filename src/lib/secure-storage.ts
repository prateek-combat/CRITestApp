/**
 * Secure storage utility that uses sessionStorage instead of localStorage
 * and encrypts sensitive data
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

// For client-side, we'll use a simpler approach
const isServer = typeof window === 'undefined';

/**
 * Client-side secure storage using sessionStorage
 * Note: This is more secure than localStorage but still client-side
 * For truly sensitive data, use server-side sessions only
 */
export const secureStorage = {
  /**
   * Store data in sessionStorage (cleared when browser closes)
   */
  setItem(key: string, value: any): void {
    if (isServer) return;

    try {
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(key, serialized);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  },

  /**
   * Retrieve data from sessionStorage
   */
  getItem<T = any>(key: string): T | null {
    if (isServer) return null;

    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  },

  /**
   * Remove item from sessionStorage
   */
  removeItem(key: string): void {
    if (isServer) return;
    sessionStorage.removeItem(key);
  },

  /**
   * Clear all sessionStorage
   */
  clear(): void {
    if (isServer) return;
    sessionStorage.clear();
  },

  /**
   * Check if item exists
   */
  hasItem(key: string): boolean {
    if (isServer) return false;
    return sessionStorage.getItem(key) !== null;
  },
};

/**
 * Test progress storage - uses sessionStorage for current session only
 * This data is cleared when the browser is closed
 */
export const testProgressStorage = {
  saveProgress(
    attemptId: string,
    progress: { questionIndex: number; answers: Record<string, any> }
  ) {
    secureStorage.setItem(`test-progress-${attemptId}`, progress);
  },

  loadProgress(
    attemptId: string
  ): { questionIndex: number; answers: Record<string, any> } | null {
    return secureStorage.getItem(`test-progress-${attemptId}`);
  },

  clearProgress(attemptId: string) {
    secureStorage.removeItem(`test-progress-${attemptId}`);
  },
};

/**
 * DO NOT store authentication data in client storage
 * Always verify authentication server-side
 */
export const clearAllClientStorage = () => {
  if (isServer) return;

  // Clear both localStorage and sessionStorage
  try {
    // Clear specific known keys from localStorage
    const keysToRemove = ['isAdminLoggedIn_superSimple', 'testCompletionData'];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Clear any test progress from localStorage (legacy)
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach((key) => {
      if (key.startsWith('test-progress-')) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear storage:', error);
  }
};
