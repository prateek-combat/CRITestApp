import { fetchWithCSRF } from '@/lib/csrf';
import { signOut } from 'next-auth/react';
import { clearAllClientStorage } from './secure-storage';

/**
 * Perform a complete logout, clearing all session data and client storage
 */
export async function performSecureLogout() {
  try {
    // Clear all client-side storage
    clearAllClientStorage();

    // Call custom logout endpoint to clear server-side cookies
    await fetchWithCSRF('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    // Sign out from NextAuth
    await signOut({
      redirect: false,
      callbackUrl: '/login',
    });

    // Force reload to clear any in-memory data
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, try to redirect to login
    window.location.href = '/login';
  }
}

/**
 * Check if the user's session is still valid
 */
export function isSessionExpired(session: any): boolean {
  if (!session || !session.expires) {
    return true;
  }

  const expiresAt = new Date(session.expires).getTime();
  const now = Date.now();

  return now > expiresAt;
}

/**
 * Monitor session activity and auto-logout on inactivity
 */
export function setupSessionMonitor(
  onSessionExpired?: () => void,
  inactivityTimeout = 2 * 60 * 60 * 1000 // 2 hours
) {
  let lastActivity = Date.now();
  let warningTimer: NodeJS.Timeout | null = null;
  let logoutTimer: NodeJS.Timeout | null = null;

  const resetTimers = () => {
    lastActivity = Date.now();

    if (warningTimer) clearTimeout(warningTimer);
    if (logoutTimer) clearTimeout(logoutTimer);

    // Warn 5 minutes before logout
    warningTimer = setTimeout(
      () => {
        if (typeof window !== 'undefined') {
          const shouldContinue = window.confirm(
            'Your session will expire in 5 minutes due to inactivity. Do you want to continue?'
          );

          if (shouldContinue) {
            resetTimers();
          }
        }
      },
      inactivityTimeout - 5 * 60 * 1000
    );

    // Auto logout on timeout
    logoutTimer = setTimeout(() => {
      if (onSessionExpired) {
        onSessionExpired();
      } else {
        performSecureLogout();
      }
    }, inactivityTimeout);
  };

  // Monitor user activity - debounced for performance
  const events = ['mousedown', 'keypress', 'touchstart']; // Removed 'scroll' for performance

  let activityTimeout: NodeJS.Timeout | null = null;

  const handleActivity = () => {
    // Clear any pending activity handler
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }

    // Debounce activity handling
    activityTimeout = setTimeout(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;

      // Only reset if more than 5 minutes have passed (increased from 1 minute)
      if (timeSinceLastActivity > 300000) {
        resetTimers();
      }
    }, 1000); // Wait 1 second before processing
  };

  // Start monitoring
  resetTimers();

  events.forEach((event) => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  // Cleanup function
  return () => {
    if (warningTimer) clearTimeout(warningTimer);
    if (logoutTimer) clearTimeout(logoutTimer);
    if (activityTimeout) clearTimeout(activityTimeout);

    events.forEach((event) => {
      document.removeEventListener(event, handleActivity);
    });
  };
}
