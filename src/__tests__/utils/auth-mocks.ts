/**
 * Auth session helpers for testing
 */

import {
  createMockSession,
  createMockUser,
  createMockAdminUser,
  createMockSuperAdminUser,
  MockSession,
} from './test-factories';

/**
 * Returns a mock session for an ADMIN user
 */
export function mockAdminSession(): MockSession {
  return createMockSession({
    user: createMockAdminUser(),
  });
}

/**
 * Returns a mock session for a SUPER_ADMIN user
 */
export function mockSuperAdminSession(): MockSession {
  return createMockSession({
    user: createMockSuperAdminUser(),
  });
}

/**
 * Returns null to simulate an unauthenticated session
 */
export function mockUnauthenticatedSession(): null {
  return null;
}

/**
 * Returns a mock session for a regular USER (not admin)
 */
export function mockUserSession(): MockSession {
  return createMockSession({
    user: createMockUser({ role: 'USER' }),
  });
}

/**
 * Returns an expired session
 */
export function mockExpiredSession(): MockSession {
  return createMockSession({
    user: createMockAdminUser(),
    expires: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
  });
}

/**
 * Mock the next-auth/next getServerSession function
 */
export function mockGetServerSession(session: MockSession | null) {
  return jest.fn().mockResolvedValue(session);
}

/**
 * Mock the next-auth/jwt getToken function
 */
export function mockGetToken(tokenData: Record<string, unknown> | null) {
  return jest.fn().mockResolvedValue(tokenData);
}

/**
 * Create a mock JWT token payload
 */
export function createMockJWTToken(overrides: Record<string, unknown> = {}) {
  return {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'ADMIN',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}
