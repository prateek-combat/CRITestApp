/**
 * Tests for auth helper functions
 * @jest-environment node
 */

import { requireAdmin, auth } from '@/lib/auth';

// Mock next-auth/next
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock auth-simple
jest.mock('@/lib/auth-simple', () => ({
  authOptionsSimple: {},
}));

import { getServerSession } from 'next-auth/next';

const mockGetServerSession = getServerSession as jest.MockedFunction<
  typeof getServerSession
>;

describe('Auth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('auth', () => {
    it('should call getServerSession with auth options', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', email: 'test@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      });

      await auth();

      expect(mockGetServerSession).toHaveBeenCalled();
    });

    it('should return session when authenticated', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };
      mockGetServerSession.mockResolvedValue(mockSession);

      const result = await auth();

      expect(result).toEqual(mockSession);
    });

    it('should return null when not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const result = await auth();

      expect(result).toBeNull();
    });
  });

  describe('requireAdmin', () => {
    describe('when session is null', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue(null);
      });

      it('should return 401 response', async () => {
        const result = await requireAdmin();

        expect('response' in result).toBe(true);
        if ('response' in result) {
          expect(result.response.status).toBe(401);
        }
      });

      it('should return "Authentication required" error message', async () => {
        const result = await requireAdmin();

        if ('response' in result) {
          const body = await result.response.json();
          expect(body.error).toBe('Authentication required');
        }
      });
    });

    describe('when session has no user', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          expires: new Date(Date.now() + 3600000).toISOString(),
        } as any);
      });

      it('should return 401 response', async () => {
        const result = await requireAdmin();

        expect('response' in result).toBe(true);
        if ('response' in result) {
          expect(result.response.status).toBe(401);
        }
      });
    });

    describe('when user is not admin', () => {
      beforeEach(() => {
        mockGetServerSession.mockResolvedValue({
          user: { id: 'user-123', email: 'user@example.com', role: 'USER' },
          expires: new Date(Date.now() + 3600000).toISOString(),
        });
      });

      it('should return 403 response', async () => {
        const result = await requireAdmin();

        expect('response' in result).toBe(true);
        if ('response' in result) {
          expect(result.response.status).toBe(403);
        }
      });

      it('should return "Admin access required" error message', async () => {
        const result = await requireAdmin();

        if ('response' in result) {
          const body = await result.response.json();
          expect(body.error).toBe('Admin access required');
        }
      });
    });

    describe('when user is ADMIN', () => {
      const adminSession = {
        user: { id: 'admin-123', email: 'admin@example.com', role: 'ADMIN' },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      beforeEach(() => {
        mockGetServerSession.mockResolvedValue(adminSession);
      });

      it('should return session object', async () => {
        const result = await requireAdmin();

        expect('session' in result).toBe(true);
        if ('session' in result) {
          expect(result.session).toEqual(adminSession);
        }
      });

      it('should not return response', async () => {
        const result = await requireAdmin();

        expect('response' in result).toBe(false);
      });
    });

    describe('when user is SUPER_ADMIN', () => {
      const superAdminSession = {
        user: {
          id: 'super-admin-123',
          email: 'super@example.com',
          role: 'SUPER_ADMIN',
        },
        expires: new Date(Date.now() + 3600000).toISOString(),
      };

      beforeEach(() => {
        mockGetServerSession.mockResolvedValue(superAdminSession);
      });

      it('should return session object', async () => {
        const result = await requireAdmin();

        expect('session' in result).toBe(true);
        if ('session' in result) {
          expect(result.session).toEqual(superAdminSession);
        }
      });

      it('should not return response', async () => {
        const result = await requireAdmin();

        expect('response' in result).toBe(false);
      });
    });

    describe('role case sensitivity', () => {
      it('should reject lowercase admin', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: 'user-123', email: 'admin@example.com', role: 'admin' },
          expires: new Date(Date.now() + 3600000).toISOString(),
        });

        const result = await requireAdmin();

        expect('response' in result).toBe(true);
        if ('response' in result) {
          expect(result.response.status).toBe(403);
        }
      });

      it('should reject mixed case Admin', async () => {
        mockGetServerSession.mockResolvedValue({
          user: { id: 'user-123', email: 'admin@example.com', role: 'Admin' },
          expires: new Date(Date.now() + 3600000).toISOString(),
        });

        const result = await requireAdmin();

        expect('response' in result).toBe(true);
        if ('response' in result) {
          expect(result.response.status).toBe(403);
        }
      });
    });
  });
});
