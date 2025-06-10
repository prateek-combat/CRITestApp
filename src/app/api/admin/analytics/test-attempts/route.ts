import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, TestAttemptStatus } from '@prisma/client';
import { withCache, apiCache } from '@/lib/cache';

interface TestAttemptAnalytics {
  id: string;
  candidateName: string | null;
  candidateEmail: string | null;
  status: TestAttemptStatus;
  completedAt: Date | null;
  startedAt: Date;
  durationSeconds: number | null;
  rawScore: number | null;
  totalQuestions: number;
  categoryScores: Record<string, { correct: number; total: number }>;
  testId: string;
  testTitle: string;
  isPublicAttempt: boolean;
  invitation?: {
    id: string;
    candidateEmail: string | null;
    candidateName: string | null;
    status: string;
    expiresAt: Date;
    createdBy: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
    };
  };
}

/**
 * @swagger
 * /api/admin/analytics/test-attempts:
 *   get:
 *     summary: Get analytics data for test attempts
 *     description: Retrieve comprehensive analytics data for both regular and public test attempts.
 *     tags:
 *       - Analytics
 *     parameters:
 *       - in: query
 *         name: invitationId
 *         schema:
 *           type: string
 *         description: Filter by specific invitation ID
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully.
 *       401:
 *         description: Unauthorized - Admin access required.
 *       500:
 *         description: Failed to fetch analytics data.
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const invitationId = searchParams.get('invitationId');

    // Generate cache key
    const cacheKey = apiCache.generateKey('analytics:test-attempts', {
      invitationId: invitationId || '',
    });

    // Try to get cached result
    const cachedResult = apiCache.get<TestAttemptAnalytics[]>(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const whereClause: Prisma.TestAttemptWhereInput = {
      status: TestAttemptStatus.COMPLETED,
    };

    if (invitationId) {
      whereClause.invitationId = invitationId;
    }

    // Query both regular and public test attempts with optimized selects
    const [completedAttempts, completedPublicAttempts] = await Promise.all([
      // Regular test attempts
      prisma.testAttempt.findMany({
        where: whereClause,
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          categorySubScores: true,
          testId: true,
          invitationId: true,
          test: {
            select: {
              id: true,
              title: true,
              _count: {
                select: {
                  questions: true,
                },
              },
            },
          },
          invitation: {
            select: {
              id: true,
              candidateEmail: true,
              candidateName: true,
              status: true,
              expiresAt: true,
              createdBy: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      }),
      // Public test attempts (exclude invitationId filter since they don't have invitations)
      prisma.publicTestAttempt.findMany({
        where: {
          status: TestAttemptStatus.COMPLETED,
        },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          categorySubScores: true,
          publicLink: {
            select: {
              test: {
                select: {
                  id: true,
                  title: true,
                  _count: {
                    select: {
                      questions: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      }),
    ]);

    // Process and combine attempts data efficiently
    const analyticsData: TestAttemptAnalytics[] = [
      // Process regular attempts
      ...completedAttempts.map((attempt) => {
        const durationSeconds = attempt.completedAt
          ? Math.floor(
              (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                1000
            )
          : null;

        // Process category scores
        const categoryScores: Record<
          string,
          { correct: number; total: number }
        > = {};
        if (
          attempt.categorySubScores &&
          typeof attempt.categorySubScores === 'object'
        ) {
          const scores = attempt.categorySubScores as any;
          Object.keys(scores).forEach((category) => {
            if (scores[category] && typeof scores[category] === 'object') {
              categoryScores[category] = {
                correct: scores[category].correct || 0,
                total: scores[category].total || 0,
              };
            }
          });
        }

        return {
          id: attempt.id,
          candidateName: attempt.candidateName,
          candidateEmail: attempt.candidateEmail,
          status: attempt.status,
          completedAt: attempt.completedAt,
          startedAt: attempt.startedAt,
          durationSeconds,
          rawScore: attempt.rawScore,
          totalQuestions: attempt.test._count.questions,
          categoryScores,
          testId: attempt.test.id,
          testTitle: attempt.test.title,
          isPublicAttempt: false,
          invitation: attempt.invitation,
        } as TestAttemptAnalytics;
      }),
      // Process public attempts
      ...completedPublicAttempts.map((attempt) => {
        const durationSeconds = attempt.completedAt
          ? Math.floor(
              (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                1000
            )
          : null;

        // Process category scores
        const categoryScores: Record<
          string,
          { correct: number; total: number }
        > = {};
        if (
          attempt.categorySubScores &&
          typeof attempt.categorySubScores === 'object'
        ) {
          const scores = attempt.categorySubScores as any;
          Object.keys(scores).forEach((category) => {
            if (scores[category] && typeof scores[category] === 'object') {
              categoryScores[category] = {
                correct: scores[category].correct || 0,
                total: scores[category].total || 0,
              };
            }
          });
        }

        return {
          id: attempt.id,
          candidateName: attempt.candidateName,
          candidateEmail: attempt.candidateEmail,
          status: attempt.status,
          completedAt: attempt.completedAt,
          startedAt: attempt.startedAt,
          durationSeconds,
          rawScore: attempt.rawScore,
          totalQuestions: attempt.publicLink?.test._count.questions || 0,
          categoryScores,
          testId: attempt.publicLink?.test.id || '',
          testTitle: attempt.publicLink?.test.title || 'Unknown Test',
          isPublicAttempt: true,
        } as TestAttemptAnalytics;
      }),
    ];

    // Sort by completion date (most recent first)
    analyticsData.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return b.completedAt.getTime() - a.completedAt.getTime();
    });

    // Cache the result for 3 minutes
    apiCache.set(cacheKey, analyticsData, 180);

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('[API /admin/analytics/test-attempts] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch analytics data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// TODO: Define #/components/schemas/TestAttemptAnalytics for Swagger if not already defined elsewhere
// It would look something like:
// TestAttemptAnalytics:
//   type: object
//   properties:
//     attemptId: { type: string, format: uuid }
//     candidateName: { type: string, nullable: true }
//     candidateEmail: { type: string, nullable: true }
//     testTitle: { type: string }
//     completedAt: { type: string, format: date-time, nullable: true }
//     status: { type: string } // Should be enum from TestAttemptStatus
//     rawScore: { type: integer, nullable: true }
//     calculatedTotalQuestions: { type: integer }
//     actualTotalTestQuestions: { type: integer }
//     percentile: { type: number, format: float, nullable: true }
//     categoryScores: {
//       type: object,
//       properties: { /* LOGICAL, VERBAL etc. with correct/total numbers */ }
//     }
//     tabSwitches: { type: integer }
//     ipAddress: { type: string, nullable: true }
//     testTakenDurationSeconds: { type: integer, nullable: true }
