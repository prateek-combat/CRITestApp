/**
 * API route testing utilities
 */

import { NextRequest } from 'next/server';

export interface MockNextRequestOptions {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
  cookies?: Record<string, string>;
}

/**
 * Create a mock NextRequest for API route testing
 */
export function createMockNextRequest(
  options: MockNextRequestOptions = {}
): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost:3000/api/test',
    headers = {},
    body,
    cookies = {},
  } = options;

  const headerEntries: [string, string][] = Object.entries(headers);

  // Add cookie header if cookies are provided
  if (Object.keys(cookies).length > 0) {
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    headerEntries.push(['cookie', cookieString]);
  }

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headerEntries),
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

/**
 * Create a mock request with authentication headers
 */
export function createAuthenticatedRequest(
  options: MockNextRequestOptions & {
    userId?: string;
    userRole?: string;
    userEmail?: string;
  } = {}
): NextRequest {
  const {
    userId = 'user-123',
    userRole = 'ADMIN',
    userEmail = 'test@example.com',
    headers = {},
    ...rest
  } = options;

  return createMockNextRequest({
    ...rest,
    headers: {
      ...headers,
      'x-user-id': userId,
      'x-user-role': userRole,
      'x-user-email': userEmail,
    },
  });
}

/**
 * Create a mock request with CSRF token
 */
export function createCSRFProtectedRequest(
  options: MockNextRequestOptions & {
    csrfToken?: string;
  } = {}
): NextRequest {
  const {
    csrfToken = 'test-csrf-token',
    headers = {},
    cookies = {},
    ...rest
  } = options;

  return createMockNextRequest({
    ...rest,
    headers: {
      ...headers,
      'x-csrf-token': csrfToken,
    },
    cookies: {
      ...cookies,
      'csrf-token': csrfToken,
    },
  });
}

/**
 * Create a mock request with rate limiting identifiers
 */
export function createRateLimitedRequest(
  options: MockNextRequestOptions & {
    ip?: string;
    userId?: string;
  } = {}
): NextRequest {
  const { ip, userId, headers = {}, ...rest } = options;

  const newHeaders: Record<string, string> = { ...headers };

  if (ip) {
    newHeaders['x-forwarded-for'] = ip;
  }

  if (userId) {
    newHeaders['x-user-id'] = userId;
  }

  return createMockNextRequest({
    ...rest,
    headers: newHeaders,
  });
}

/**
 * Parse JSON response body from NextResponse
 */
export async function parseResponseBody<T = unknown>(
  response: Response
): Promise<T> {
  return response.json() as Promise<T>;
}

/**
 * Assert response status and return body
 */
export async function expectStatus<T = unknown>(
  response: Response,
  expectedStatus: number
): Promise<T> {
  expect(response.status).toBe(expectedStatus);
  return parseResponseBody<T>(response);
}

/**
 * Create a mock for the requireAdmin helper
 */
export function mockRequireAdmin(
  session: { user: { id: string; email: string; role: string } } | null
) {
  if (!session) {
    return {
      response: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        }
      ),
    };
  }

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return {
      response: new Response(
        JSON.stringify({ error: 'Admin access required' }),
        {
          status: 403,
          headers: { 'content-type': 'application/json' },
        }
      ),
    };
  }

  return { session };
}

/**
 * Create a mock worker auth request
 */
export function createWorkerRequest(
  options: MockNextRequestOptions & {
    workerToken?: string;
  } = {}
): NextRequest {
  const { workerToken, headers = {}, ...rest } = options;

  const newHeaders: Record<string, string> = { ...headers };

  if (workerToken) {
    newHeaders['x-worker-token'] = workerToken;
  }

  return createMockNextRequest({
    ...rest,
    headers: newHeaders,
  });
}
