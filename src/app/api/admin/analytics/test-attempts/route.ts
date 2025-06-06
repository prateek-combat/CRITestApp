import { NextRequest, NextResponse } from 'next/server';
import {
  PrismaClient,
  QuestionCategory,
  TestAttemptStatus,
  Prisma,
} from '@prisma/client';

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
});

// Placeholder for admin role check - replace with actual auth logic
async function isAdminUser(request: Request): Promise<boolean> {
  // In a real app, you'd validate a JWT, session, or other auth mechanism
  // For now, let's assume a header `x-user-role: ADMIN` for simplicity
  // return request.headers.get('x-user-role') === 'ADMIN';
  return true; // TEMPORARILY ALLOW ALL FOR DEVELOPMENT
}

/**
 * @swagger
 * /api/admin/analytics/test-attempts:
 *   get:
 *     summary: Retrieve aggregated test attempt analytics for admins
 *     description: Fetches all completed test attempts with detailed analytics, including category-wise scores.
 *     tags:
 *       - Admin Analytics
 *     security:
 *       - bearerAuth: [] # Assuming you'll add JWT auth later
 *     responses:
 *       200:
 *         description: A list of test attempts with analytics.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestAttemptAnalytics'
 *       401:
 *         description: Unauthorized (user is not an admin).
 *       500:
 *         description: Failed to fetch test attempt analytics.
 */
export async function GET(request: NextRequest) {
  // TODO: Implement proper admin authentication/authorization check
  // const authorized = await isAdminUser(request);
  // if (!authorized) {
  //   return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const invitationId = searchParams.get('invitationId');

    const whereClause: Prisma.TestAttemptWhereInput = {
      status: TestAttemptStatus.COMPLETED,
    };

    if (invitationId) {
      whereClause.invitationId = invitationId;
    }

    const completedAttempts = await prisma.testAttempt.findMany({
      where: whereClause,
      include: {
        test: {
          select: {
            id: true,
            title: true,
            questions: {
              select: {
                id: true,
                category: true,
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
        submittedAnswers: {
          select: {
            id: true,
            questionId: true,
            isCorrect: true,
            timeTakenSeconds: true,
            question: {
              select: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const analyticsData = completedAttempts.map((attempt) => {
      const testQuestions = attempt.test?.questions || [];
      const submittedAns = attempt.submittedAnswers || [];

      const totalQuestions = testQuestions.length;
      const correctAnswers = submittedAns.filter((sa) => sa.isCorrect).length;

      const categoryScores: Record<
        QuestionCategory,
        { correct: number; total: number; score: number }
      > = {
        LOGICAL: { correct: 0, total: 0, score: 0 },
        VERBAL: { correct: 0, total: 0, score: 0 },
        NUMERICAL: { correct: 0, total: 0, score: 0 },
        ATTENTION_TO_DETAIL: { correct: 0, total: 0, score: 0 },
      };

      testQuestions.forEach((q) => {
        if (q.category && categoryScores[q.category]) {
          categoryScores[q.category].total++;
        }
      });

      submittedAns.forEach((sa) => {
        if (
          sa.isCorrect &&
          sa.question?.category &&
          categoryScores[sa.question.category]
        ) {
          categoryScores[sa.question.category].correct++;
        }
      });

      (Object.keys(categoryScores) as QuestionCategory[]).forEach((cat) => {
        if (categoryScores[cat].total > 0) {
          categoryScores[cat].score = parseFloat(
            (
              (categoryScores[cat].correct / categoryScores[cat].total) *
              100
            ).toFixed(2)
          );
        }
      });

      return {
        id: attempt.id,
        testId: attempt.testId,
        testTitle: attempt.test?.title,
        invitationId: attempt.invitationId,
        candidateName:
          attempt.candidateName || attempt.invitation?.candidateName,
        candidateEmail:
          attempt.candidateEmail || attempt.invitation?.candidateEmail,
        completedAt: attempt.completedAt,
        status: attempt.status,
        rawScore: attempt.rawScore,
        percentile: attempt.percentile,
        durationSeconds:
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (new Date(attempt.completedAt).getTime() -
                  new Date(attempt.startedAt).getTime()) /
                  1000
              )
            : null,
        categoryScores,
        ipAddress: attempt.ipAddress,
        tabSwitches: attempt.tabSwitches,
        totalQuestions,
        correctAnswers,
        creatorEmail: attempt.invitation?.createdBy?.email,
      };
    });

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error(
      '[API /admin/analytics/test-attempts GET] Error fetching analytics:',
      error
    );
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        message: 'Failed to fetch test attempt analytics',
        error: errorMessage,
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
