/**
 * CSRF Protection Utility
 * Implements double-submit cookie pattern for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const CSRF_TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME =
  process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  // Generate random token using Web Crypto API for browser compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buffer = new Uint8Array(CSRF_TOKEN_LENGTH);
    crypto.getRandomValues(buffer);
    return Array.from(buffer)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback for older environments
  let token = '';
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < CSRF_TOKEN_LENGTH * 2; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Set CSRF token cookie with secure settings
 */
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // Convert to seconds
  });
}

/**
 * Get CSRF token from request cookies
 */
export function getCSRFTokenFromCookie(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME) || null;
}

/**
 * Validate CSRF token for state-changing requests
 */
export async function validateCSRFToken(
  request: NextRequest
): Promise<boolean> {
  // Skip CSRF validation for GET and HEAD requests
  if (['GET', 'HEAD'].includes(request.method)) {
    return true;
  }

  // Skip CSRF validation for public endpoints that don't require auth
  const pathname = request.nextUrl.pathname;
  const publicEndpoints = [
    '/api/auth',
    '/api/public-test-attempts',
    '/api/invitations/validate',
  ];

  if (publicEndpoints.some((endpoint) => pathname.startsWith(endpoint))) {
    return true;
  }

  // For authenticated requests, validate CSRF token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token) {
    // Not authenticated, no CSRF protection needed
    return true;
  }

  const cookieToken = getCSRFTokenFromCookie(request);
  const headerToken = getCSRFTokenFromHeader(request);

  // Both tokens must be present and match
  if (!cookieToken || !headerToken) {
    return false;
  }

  return cookieToken === headerToken;
}

/**
 * CSRF protection middleware for API routes
 */
export async function csrfProtection(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  const response = await handler(request);

  // Generate new CSRF token for authenticated users if not present
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (token && !getCSRFTokenFromCookie(request)) {
    const newToken = generateCSRFToken();
    setCSRFCookie(response, newToken);
  }

  return response;
}

/**
 * Hook for client-side CSRF token management
 * This should be used in a client component
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    return { token: null, headers: {} };
  }

  // Extract CSRF token from cookies (client-side)
  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const token = getCookieValue(CSRF_COOKIE_NAME);

  return {
    token,
    headers: token ? { [CSRF_HEADER_NAME]: token } : {},
  };
}

/**
 * Fetch wrapper that includes CSRF token
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }

  const getCookieValue = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    return null;
  };

  const csrfToken = getCookieValue(CSRF_COOKIE_NAME);

  const headers = new Headers(options.headers);
  if (
    csrfToken &&
    !['GET', 'HEAD'].includes(options.method?.toUpperCase() || 'GET')
  ) {
    headers.set(CSRF_HEADER_NAME, csrfToken);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
