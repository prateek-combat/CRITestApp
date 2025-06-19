import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { TestAttemptStatus } from '@prisma/client';
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
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const invitationId = searchParams.get('invitationId');

    const cacheKey = apiCache.generateKey('analytics:test-attempts', {
      invitationId: invitationId || '',
    });
    const cachedResult = apiCache.get<any[]>(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        status: {
          not: TestAttemptStatus.ARCHIVED,
        },
      },
      include: {
        test: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const publicTestAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        status: {
          not: TestAttemptStatus.ARCHIVED,
        },
      },
      include: {
        publicTest: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const combinedData = [
      ...testAttempts.map((attempt) => ({
        id: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        testName: attempt.test.title,
        status: attempt.status,
        score: attempt.rawScore,
        riskLevel: attempt.riskLevel,
        completedAt: attempt.completedAt,
        type: 'Standard',
        testId: attempt.testId,
        proctoring: attempt.proctoringEnabled,
      })),
      ...publicTestAttempts.map((attempt) => ({
        id: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        testName: attempt.publicTest.title,
        status: attempt.status,
        score: attempt.rawScore,
        riskLevel: attempt.riskLevel,
        completedAt: attempt.completedAt,
        type: 'Public Link',
        testId: attempt.publicTestId,
        proctoring: attempt.proctoringEnabled,
      })),
    ];

    apiCache.set(cacheKey, combinedData, 180);

    return NextResponse.json(combinedData);
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
