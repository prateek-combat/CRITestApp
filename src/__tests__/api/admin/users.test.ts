/**
 * Tests for admin users API route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/users/route';

// Mock auth
jest.mock('@/lib/auth', () => ({
  requireAdmin: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const mockRequireAdmin = requireAdmin as jest.MockedFunction<
  typeof requireAdmin
>;
const mockFindMany = prisma.user.findMany as jest.MockedFunction<
  typeof prisma.user.findMany
>;
const mockFindUnique = prisma.user.findUnique as jest.MockedFunction<
  typeof prisma.user.findUnique
>;
const mockCreate = prisma.user.create as jest.MockedFunction<
  typeof prisma.user.create
>;
const mockUpdate = prisma.user.update as jest.MockedFunction<
  typeof prisma.user.update
>;

describe('Admin Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/users', () => {
    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401 }
          ),
        } as any);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        const response = await GET(request);

        expect(response.status).toBe(401);
      });

      it('should return 403 when not admin', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403 }
          ),
        } as any);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        const response = await GET(request);

        expect(response.status).toBe(403);
      });
    });

    describe('success cases', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          },
        });
      });

      it('should return list of admin users', async () => {
        const mockUsers = [
          {
            id: 'admin-1',
            email: 'admin1@example.com',
            firstName: 'Admin',
            lastName: 'One',
            role: 'ADMIN',
            createdAt: new Date('2024-01-01'),
          },
          {
            id: 'admin-2',
            email: 'admin2@example.com',
            firstName: 'Super',
            lastName: 'Admin',
            role: 'SUPER_ADMIN',
            createdAt: new Date('2024-01-02'),
          },
        ];
        mockFindMany.mockResolvedValue(mockUsers);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        const response = await GET(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveLength(2);
        expect(body[0].email).toBe('admin1@example.com');
      });

      it('should only return ADMIN and SUPER_ADMIN users', async () => {
        mockFindMany.mockResolvedValue([]);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        await GET(request);

        expect(mockFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              role: {
                in: ['ADMIN', 'SUPER_ADMIN'],
              },
            },
          })
        );
      });

      it('should order by createdAt descending', async () => {
        mockFindMany.mockResolvedValue([]);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        await GET(request);

        expect(mockFindMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: {
              createdAt: 'desc',
            },
          })
        );
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          },
        });
      });

      it('should return 500 on database error', async () => {
        mockFindMany.mockRejectedValue(new Error('Database connection failed'));

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users'
        );
        const response = await GET(request);

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.message).toBe('Internal server error');
      });
    });
  });

  describe('POST /api/admin/users', () => {
    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401 }
          ),
        } as any);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com', role: 'ADMIN' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(401);
      });
    });

    describe('authorization', () => {
      it('should return 403 when ADMIN tries to create users', async () => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'admin-123',
              email: 'admin@example.com',
              role: 'ADMIN',
            },
          },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com', role: 'ADMIN' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(403);
        const body = await response.json();
        expect(body.message).toBe('Unauthorized - Super Admin required');
      });
    });

    describe('validation', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'super-admin-123',
              email: 'super@example.com',
              role: 'SUPER_ADMIN',
            },
          },
        });
      });

      it('should return 400 when email is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({ role: 'ADMIN' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('Email and role are required');
      });

      it('should return 400 when role is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('Email and role are required');
      });

      it('should return 400 for invalid role', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({ email: 'new@example.com', role: 'USER' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.message).toBe('Invalid role');
      });
    });

    describe('creating new user', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'super-admin-123',
              email: 'super@example.com',
              role: 'SUPER_ADMIN',
            },
          },
        });
        mockFindUnique.mockResolvedValue(null);
      });

      it('should create new admin user', async () => {
        const newUser = {
          id: 'new-user-123',
          email: 'new@example.com',
          firstName: 'New',
          lastName: 'User',
          role: 'ADMIN',
          createdAt: new Date(),
        };
        mockCreate.mockResolvedValue(newUser);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({
              email: 'new@example.com',
              firstName: 'New',
              lastName: 'User',
              role: 'ADMIN',
            }),
          }
        );
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.message).toBe('Admin user created successfully');
        expect(body.user.email).toBe('new@example.com');
      });

      it('should create user with empty names if not provided', async () => {
        const newUser = {
          id: 'new-user-123',
          email: 'new@example.com',
          firstName: '',
          lastName: '',
          role: 'ADMIN',
          createdAt: new Date(),
        };
        mockCreate.mockResolvedValue(newUser);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({
              email: 'new@example.com',
              role: 'ADMIN',
            }),
          }
        );
        await POST(request);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              firstName: '',
              lastName: '',
            }),
          })
        );
      });
    });

    describe('updating existing user', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'super-admin-123',
              email: 'super@example.com',
              role: 'SUPER_ADMIN',
            },
          },
        });
      });

      it('should update existing user to admin role', async () => {
        mockFindUnique.mockResolvedValue({
          id: 'existing-123',
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          role: 'USER',
        });

        const updatedUser = {
          id: 'existing-123',
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          role: 'ADMIN',
          createdAt: new Date(),
        };
        mockUpdate.mockResolvedValue(updatedUser);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({
              email: 'existing@example.com',
              role: 'ADMIN',
            }),
          }
        );
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.message).toBe('User updated to admin role successfully');
      });

      it('should preserve existing names if not provided', async () => {
        mockFindUnique.mockResolvedValue({
          id: 'existing-123',
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          role: 'USER',
        });
        mockUpdate.mockResolvedValue({
          id: 'existing-123',
          email: 'existing@example.com',
          firstName: 'Existing',
          lastName: 'User',
          role: 'ADMIN',
          createdAt: new Date(),
        });

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({
              email: 'existing@example.com',
              role: 'ADMIN',
            }),
          }
        );
        await POST(request);

        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              firstName: 'Existing',
              lastName: 'User',
            }),
          })
        );
      });
    });

    describe('error handling', () => {
      beforeEach(() => {
        mockRequireAdmin.mockResolvedValue({
          session: {
            user: {
              id: 'super-admin-123',
              email: 'super@example.com',
              role: 'SUPER_ADMIN',
            },
          },
        });
        mockFindUnique.mockResolvedValue(null);
      });

      it('should return 500 on database error', async () => {
        mockCreate.mockRejectedValue(new Error('Database error'));

        const request = new NextRequest(
          'http://localhost:3000/api/admin/users',
          {
            method: 'POST',
            body: JSON.stringify({
              email: 'new@example.com',
              role: 'ADMIN',
            }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(500);
      });
    });
  });
});
