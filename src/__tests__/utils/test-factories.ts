/**
 * Mock data generators for testing
 */

export interface MockUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  firstName?: string;
  lastName?: string;
  createdAt?: Date;
}

export interface MockSession {
  user: MockUser;
  expires: string;
}

export interface MockTest {
  id: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface MockJobProfile {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  createdById: string;
  testWeights?: Array<{
    testId: string;
    weight: number;
    test?: MockTest;
  }>;
}

/**
 * Create a mock user with optional overrides
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    id: 'user-123',
    email: 'test@example.com',
    role: 'USER',
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  };
}

/**
 * Create a mock NextAuth session with optional overrides
 */
export function createMockSession(
  overrides: Partial<MockSession> = {}
): MockSession {
  const defaultUser = createMockUser();
  return {
    user: overrides.user ?? defaultUser,
    expires:
      overrides.expires ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Create a mock test entity with optional overrides
 */
export function createMockTest(overrides: Partial<MockTest> = {}): MockTest {
  return {
    id: 'test-123',
    title: 'Sample Test',
    description: 'A sample test for testing',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdById: 'user-123',
    ...overrides,
  };
}

/**
 * Create a mock job profile with optional overrides
 */
export function createMockJobProfile(
  overrides: Partial<MockJobProfile> = {}
): MockJobProfile {
  return {
    id: 'job-profile-123',
    name: 'Software Engineer',
    description: 'Software engineering position',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    createdById: 'user-123',
    testWeights: [],
    ...overrides,
  };
}

/**
 * Create multiple mock users
 */
export function createMockUsers(
  count: number,
  baseOverrides: Partial<MockUser> = {}
): MockUser[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      ...baseOverrides,
    })
  );
}

/**
 * Create a mock admin user
 */
export function createMockAdminUser(
  overrides: Partial<MockUser> = {}
): MockUser {
  return createMockUser({
    role: 'ADMIN',
    email: 'admin@example.com',
    ...overrides,
  });
}

/**
 * Create a mock super admin user
 */
export function createMockSuperAdminUser(
  overrides: Partial<MockUser> = {}
): MockUser {
  return createMockUser({
    role: 'SUPER_ADMIN',
    email: 'superadmin@example.com',
    ...overrides,
  });
}
