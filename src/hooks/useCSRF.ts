'use client';

import { useEffect, useState } from 'react';

interface CSRFHook {
  token: string | null;
  headers: Record<string, string>;
  fetchWithCSRF: (url: string, options?: RequestInit) => Promise<Response>;
}

/**
 * React hook for CSRF token management in client components
 */
export function useCSRF(): CSRFHook {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract CSRF token from cookies
    const getCookieValue = (name: string): string | null => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
      return null;
    };

    const csrfToken = getCookieValue('__Host-csrf-token');
    setToken(csrfToken);

    // Listen for cookie changes
    const interval = setInterval(() => {
      const newToken = getCookieValue('__Host-csrf-token');
      if (newToken !== token) {
        setToken(newToken);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [token]);

  const headers = token ? { 'x-csrf-token': token } : {};

  const fetchWithCSRF = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const method = options.method?.toUpperCase() || 'GET';

    // Only add CSRF token for state-changing requests
    if (!['GET', 'HEAD'].includes(method)) {
      const requestHeaders = new Headers(options.headers);
      if (token) {
        requestHeaders.set('x-csrf-token', token);
      }

      return fetch(url, {
        ...options,
        headers: requestHeaders,
      });
    }

    return fetch(url, options);
  };

  return {
    token,
    headers,
    fetchWithCSRF,
  };
}
