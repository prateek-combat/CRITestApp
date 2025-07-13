import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/tests/archived:
 *   get:
 *     summary: Get all archived tests (SUPER_ADMIN only)
 *     description: Retrieves all archived tests with their metadata. Only SUPER_ADMIN can access archived tests.
 *     tags:
 *       - Tests
 *     responses:
 *       200:
 *         description: Successfully retrieved archived tests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   archivedAt:
 *                     type: string
 *                     format: date-time
 *                   archivedBy:
 *                     type: object
 *                     properties:
 *                       email:
 *                         type: string
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                   _count:
 *                     type: object
 *                     properties:
 *                       questions:
 *                         type: number
 *                       invitations:
 *                         type: number
 *                       testAttempts:
 *                         type: number
 *       403:
 *         description: Insufficient permissions - SUPER_ADMIN required.
 *       500:
 *         description: Failed to fetch archived tests.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and SUPER_ADMIN access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Only SUPER_ADMIN can view archived tests
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions - SUPER_ADMIN required' },
        { status: 403 }
      );
    }

    // Fetch archived tests with metadata
    const archivedTests = await prisma.test.findMany({
      where: {
        isArchived: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        archivedAt: true,
        archivedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
          },
        },
      },
      orderBy: [
        { archivedAt: 'desc' }, // Most recently archived first
      ],
    });

    return NextResponse.json(archivedTests);
  } catch (error) {
    logger.error(
      'Failed to fetch archived tests',
      {
        operation: 'get_archived_tests',
        service: 'tests',
        method: 'GET',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to fetch archived tests' },
      { status: 500 }
    );
  }
}
