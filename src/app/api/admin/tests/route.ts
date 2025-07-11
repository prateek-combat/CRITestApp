import { NextRequest, NextResponse } from 'next/server';
import { withCache, apiCache } from '@/lib/cache';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';



/**
 * Admin endpoint to retrieve tests with additional admin-specific information
 */
export async function GET() {
  try {
    const cacheKey = 'admin:tests:all';

    const tests = await withCache(
      cacheKey,
      async () => {
        return await prisma.test.findMany({
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
            isArchived: true,
            _count: {
              select: {
                questions: true,
                invitations: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      },
      300 // Cache for 5 minutes
    );

    const formattedTests = tests.map((test: any) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      createdAt: test.createdAt.toISOString(),
      questionsCount: test._count.questions,
      invitationsCount: test._count.invitations,
      isArchived: test.isArchived || false,
    }));

    return NextResponse.json(formattedTests);
  } catch (error) {
    apiLogger.error(
      'Failed to fetch tests for admin',
      {
        endpoint: 'GET /api/admin/tests',
        operation: 'fetch_admin_tests',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}
