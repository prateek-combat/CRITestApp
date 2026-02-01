/**
 * Tests for admin job profiles API route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/admin/job-profiles/route';

// Mock auth
jest.mock('@/lib/auth', () => ({
  requireAdmin: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    jobProfile: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
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
const mockFindMany = prisma.jobProfile.findMany as jest.MockedFunction<
  typeof prisma.jobProfile.findMany
>;
const mockFindFirst = prisma.jobProfile.findFirst as jest.MockedFunction<
  typeof prisma.jobProfile.findFirst
>;
const mockCreate = prisma.jobProfile.create as jest.MockedFunction<
  typeof prisma.jobProfile.create
>;

describe('Admin Job Profiles API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/admin/job-profiles', () => {
    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401 }
          ),
        } as any);

        const response = await GET();

        expect(response.status).toBe(401);
      });

      it('should return 403 when not admin', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Admin access required' }),
            { status: 403 }
          ),
        } as any);

        const response = await GET();

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

      it('should return list of job profiles', async () => {
        const mockProfiles = [
          {
            id: 'profile-1',
            name: 'Software Engineer',
            description: 'SE Position',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdById: 'admin-123',
            testWeights: [],
            invitations: [],
            _count: { invitations: 0 },
          },
        ];
        mockFindMany.mockResolvedValue(mockProfiles);

        const response = await GET();
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toHaveLength(1);
        expect(body[0].name).toBe('Software Engineer');
      });

      it('should enrich profiles with lastActivityAt', async () => {
        const mockProfiles = [
          {
            id: 'profile-1',
            name: 'Software Engineer',
            description: 'SE Position',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdById: 'admin-123',
            testWeights: [],
            invitations: [
              {
                createdAt: new Date('2024-02-01'),
                testAttempts: [
                  {
                    createdAt: new Date('2024-02-02'),
                    startedAt: new Date('2024-02-02'),
                    completedAt: new Date('2024-02-03'),
                  },
                ],
              },
            ],
            _count: { invitations: 1 },
          },
        ];
        mockFindMany.mockResolvedValue(mockProfiles);

        const response = await GET();
        const body = await response.json();

        expect(body[0].lastActivityAt).toBe(
          new Date('2024-02-03').toISOString()
        );
      });

      it('should use invitation createdAt when no test attempts', async () => {
        const invitationDate = new Date('2024-02-15');
        const mockProfiles = [
          {
            id: 'profile-1',
            name: 'Software Engineer',
            description: 'SE Position',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdById: 'admin-123',
            testWeights: [],
            invitations: [
              {
                createdAt: invitationDate,
                testAttempts: [],
              },
            ],
            _count: { invitations: 1 },
          },
        ];
        mockFindMany.mockResolvedValue(mockProfiles);

        const response = await GET();
        const body = await response.json();

        expect(body[0].lastActivityAt).toBe(invitationDate.toISOString());
      });

      it('should return null lastActivityAt when no invitations', async () => {
        const mockProfiles = [
          {
            id: 'profile-1',
            name: 'Software Engineer',
            description: 'SE Position',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdById: 'admin-123',
            testWeights: [],
            invitations: [],
            _count: { invitations: 0 },
          },
        ];
        mockFindMany.mockResolvedValue(mockProfiles);

        const response = await GET();
        const body = await response.json();

        expect(body[0].lastActivityAt).toBeNull();
      });

      it('should not include raw invitations in response', async () => {
        const mockProfiles = [
          {
            id: 'profile-1',
            name: 'Software Engineer',
            description: 'SE Position',
            isActive: true,
            createdAt: new Date('2024-01-01'),
            createdById: 'admin-123',
            testWeights: [],
            invitations: [
              {
                createdAt: new Date('2024-02-01'),
                testAttempts: [],
              },
            ],
            _count: { invitations: 1 },
          },
        ];
        mockFindMany.mockResolvedValue(mockProfiles);

        const response = await GET();
        const body = await response.json();

        expect(body[0].invitations).toBeUndefined();
      });

      it('should order by createdAt descending', async () => {
        mockFindMany.mockResolvedValue([]);

        await GET();

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

        const response = await GET();

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe('Failed to fetch job profiles');
      });
    });
  });

  describe('POST /api/admin/job-profiles', () => {
    describe('authentication', () => {
      it('should return 401 when not authenticated', async () => {
        mockRequireAdmin.mockResolvedValue({
          response: new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401 }
          ),
        } as any);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Test Profile',
              testIds: ['test-1'],
            }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(401);
      });
    });

    describe('validation', () => {
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

      it('should return 400 when name is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({ testIds: ['test-1'] }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Name and tests are required');
      });

      it('should return 400 when testIds is missing', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({ name: 'Test Profile' }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Name and tests are required');
      });

      it('should return 400 when testIds is empty', async () => {
        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({ name: 'Test Profile', testIds: [] }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Name and tests are required');
      });

      it('should return 400 when name already exists', async () => {
        mockFindFirst.mockResolvedValue({
          id: 'existing-profile',
          name: 'Existing Profile',
        } as any);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'Existing Profile',
              testIds: ['test-1'],
            }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('A job profile with this name already exists');
      });
    });

    describe('creating job profile', () => {
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
        mockFindFirst.mockResolvedValue(null);
      });

      it('should create job profile with test weights', async () => {
        const createdProfile = {
          id: 'new-profile-123',
          name: 'New Profile',
          description: 'A new job profile',
          isActive: true,
          createdById: 'admin-123',
          testWeights: [
            {
              testId: 'test-1',
              weight: 1.0,
              test: { id: 'test-1', title: 'Test 1' },
            },
            {
              testId: 'test-2',
              weight: 1.0,
              test: { id: 'test-2', title: 'Test 2' },
            },
          ],
          _count: { invitations: 0 },
        };
        mockCreate.mockResolvedValue(createdProfile);

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'New Profile',
              description: 'A new job profile',
              isActive: true,
              testIds: ['test-1', 'test-2'],
            }),
          }
        );
        const response = await POST(request);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.name).toBe('New Profile');
        expect(body.testWeights).toHaveLength(2);
      });

      it('should create test weights with default weight of 1.0', async () => {
        mockCreate.mockResolvedValue({
          id: 'new-profile-123',
          name: 'New Profile',
          testWeights: [],
          _count: { invitations: 0 },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'New Profile',
              testIds: ['test-1', 'test-2'],
            }),
          }
        );
        await POST(request);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              testWeights: {
                create: [
                  { testId: 'test-1', weight: 1.0 },
                  { testId: 'test-2', weight: 1.0 },
                ],
              },
            }),
          })
        );
      });

      it('should use admin id as createdById', async () => {
        mockCreate.mockResolvedValue({
          id: 'new-profile-123',
          name: 'New Profile',
          testWeights: [],
          _count: { invitations: 0 },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'New Profile',
              testIds: ['test-1'],
            }),
          }
        );
        await POST(request);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              createdById: 'admin-123',
            }),
          })
        );
      });

      it('should handle optional description', async () => {
        mockCreate.mockResolvedValue({
          id: 'new-profile-123',
          name: 'New Profile',
          description: null,
          testWeights: [],
          _count: { invitations: 0 },
        });

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'New Profile',
              testIds: ['test-1'],
            }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(200);
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
        mockFindFirst.mockResolvedValue(null);
      });

      it('should return 500 on database error', async () => {
        mockCreate.mockRejectedValue(new Error('Database error'));

        const request = new NextRequest(
          'http://localhost:3000/api/admin/job-profiles',
          {
            method: 'POST',
            body: JSON.stringify({
              name: 'New Profile',
              testIds: ['test-1'],
            }),
          }
        );
        const response = await POST(request);

        expect(response.status).toBe(500);
        const body = await response.json();
        expect(body.error).toBe('Failed to create job profile');
      });
    });
  });
});
