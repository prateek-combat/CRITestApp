import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Retry helper function for database operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Check if it's a database connectivity error
      if (
        error.code === 'P1001' ||
        error.message?.includes("Can't reach database")
      ) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
      } else {
        // For non-connectivity errors, don't retry
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: positionId } = await params;

    // Get the position with retry logic
    const position = await retryOperation(async () => {
      return await prisma.position.findUnique({
        where: { id: positionId },
        include: {
          tests: {
            where: { isArchived: false },
            select: { id: true },
          },
        },
      });
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    const testIds = position.tests.map((t) => t.id);

    if (testIds.length === 0) {
      // Return empty analytics for position with no tests
      return NextResponse.json({
        position,
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        topScore: 0,
        averageTimeMinutes: 0,
        recentAttempts: 0,
        scoreDistribution: [
          { range: '0-20%', count: 0, percentage: 0 },
          { range: '21-40%', count: 0, percentage: 0 },
          { range: '41-60%', count: 0, percentage: 0 },
          { range: '61-80%', count: 0, percentage: 0 },
          { range: '81-100%', count: 0, percentage: 0 },
        ],
        categoryAverages: {
          logical: 0,
          verbal: 0,
          numerical: 0,
          attention: 0,
          other: 0,
        },
        monthlyTrends: [],
        topPerformers: [],
      });
    }

    // Get last 30 days for recent attempts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get total questions per test for percentage calculations with retry
    const testQuestionCounts = await retryOperation(async () => {
      return await Promise.all(
        testIds.map(async (testId) => {
          const count = await prisma.question.count({ where: { testId } });
          return { testId, totalQuestions: count };
        })
      );
    });

    const testQuestionMap = Object.fromEntries(
      testQuestionCounts.map(({ testId, totalQuestions }) => [
        testId,
        totalQuestions,
      ])
    );

    // Parallel queries for performance with retry logic
    const [
      completedRegularAttemptsCount,
      completedPublicAttemptsCount,
      recentRegularAttempts,
      recentPublicAttempts,
      completedRegularAttempts,
      completedPublicAttempts,
    ] = await retryOperation(async () => {
      return await Promise.all([
        // Completed regular attempts for these tests (for total count)
        prisma.testAttempt.count({
          where: {
            testId: { in: testIds },
            status: 'COMPLETED',
          },
        }),

        // Completed public attempts for these tests (for total count)
        prisma.publicTestAttempt.count({
          where: {
            publicLink: {
              testId: { in: testIds },
            },
            status: 'COMPLETED',
          },
        }),

        // Recent completed regular attempts (last 30 days)
        prisma.testAttempt.count({
          where: {
            testId: { in: testIds },
            status: 'COMPLETED',
            completedAt: { gte: thirtyDaysAgo },
          },
        }),

        // Recent completed public attempts (last 30 days)
        prisma.publicTestAttempt.count({
          where: {
            publicLink: {
              testId: { in: testIds },
            },
            status: 'COMPLETED',
            completedAt: { gte: thirtyDaysAgo },
          },
        }),

        // Completed regular attempts with duration calculation
        prisma.testAttempt.findMany({
          where: {
            testId: { in: testIds },
            status: 'COMPLETED',
          },
          include: {
            invitation: {
              select: { candidateEmail: true, candidateName: true },
            },
          },
          orderBy: { rawScore: 'desc' },
        }),

        // Completed public attempts with duration calculation
        prisma.publicTestAttempt.findMany({
          where: {
            publicLink: {
              testId: { in: testIds },
            },
            status: 'COMPLETED',
          },
          include: {
            publicLink: {
              select: { testId: true },
            },
          },
          orderBy: { rawScore: 'desc' },
        }),
      ]);
    });

    const totalAttempts =
      completedRegularAttemptsCount + completedPublicAttemptsCount;
    const completedAttempts =
      completedRegularAttempts.length + completedPublicAttempts.length;
    const recentAttempts = recentRegularAttempts + recentPublicAttempts;

    // Helper function to calculate percentage score
    const calculatePercentageScore = (
      rawScore: number | null,
      testId: string
    ): number => {
      if (!rawScore) return 0;
      const totalQuestions = testQuestionMap[testId];
      if (!totalQuestions || totalQuestions === 0) return 0;
      return Math.round((rawScore / totalQuestions) * 100);
    };

    // Helper function to calculate duration in minutes
    const calculateDurationMinutes = (
      startedAt: Date | null,
      completedAt: Date | null
    ): number => {
      if (!startedAt || !completedAt) return 0;
      const durationMs = completedAt.getTime() - startedAt.getTime();
      return Math.round(durationMs / (1000 * 60)); // Convert to minutes
    };

    // Combine all completed attempts for analysis
    const allCompletedAttempts = [
      ...completedRegularAttempts.map((attempt) => {
        const percentageScore = calculatePercentageScore(
          attempt.rawScore,
          attempt.testId
        );
        const durationMinutes = calculateDurationMinutes(
          attempt.startedAt,
          attempt.completedAt
        );
        return {
          id: attempt.id,
          candidateName:
            attempt.invitation?.candidateName ||
            attempt.candidateName ||
            'Anonymous',
          candidateEmail:
            attempt.invitation?.candidateEmail || attempt.candidateEmail || '',
          rawScore: attempt.rawScore || 0,
          percentageScore,
          durationMinutes,
          completedAt: attempt.completedAt,
          categoryScores: attempt.categorySubScores as any,
          isPublic: false,
        };
      }),
      ...completedPublicAttempts.map((attempt) => {
        const testId = attempt.publicLink?.testId || '';
        const percentageScore = calculatePercentageScore(
          attempt.rawScore,
          testId
        );
        const durationMinutes = calculateDurationMinutes(
          attempt.startedAt,
          attempt.completedAt
        );
        return {
          id: attempt.id,
          candidateName: attempt.candidateName || 'Anonymous',
          candidateEmail: attempt.candidateEmail || '',
          rawScore: attempt.rawScore || 0,
          percentageScore,
          durationMinutes,
          completedAt: attempt.completedAt,
          categoryScores: attempt.categorySubScores as any,
          isPublic: true,
        };
      }),
    ];

    // Calculate metrics using percentage scores
    const averageScore =
      completedAttempts > 0
        ? Math.round(
            allCompletedAttempts.reduce(
              (sum, attempt) => sum + attempt.percentageScore,
              0
            ) / completedAttempts
          )
        : 0;

    const topScore =
      completedAttempts > 0
        ? Math.max(
            ...allCompletedAttempts.map((attempt) => attempt.percentageScore)
          )
        : 0;

    // Calculate average time from actual durations
    const attemptsWithDuration = allCompletedAttempts.filter(
      (attempt) => attempt.durationMinutes > 0
    );
    const averageTimeMinutes =
      attemptsWithDuration.length > 0
        ? Math.round(
            attemptsWithDuration.reduce(
              (sum, attempt) => sum + attempt.durationMinutes,
              0
            ) / attemptsWithDuration.length
          )
        : 0;

    // Score distribution
    const scoreRanges = [
      { range: '0-20%', min: 0, max: 20 },
      { range: '21-40%', min: 21, max: 40 },
      { range: '41-60%', min: 41, max: 60 },
      { range: '61-80%', min: 61, max: 80 },
      { range: '81-100%', min: 81, max: 100 },
    ];

    const scoreDistribution = scoreRanges.map((range) => {
      const count = allCompletedAttempts.filter(
        (attempt) =>
          attempt.percentageScore >= range.min &&
          attempt.percentageScore <= range.max
      ).length;
      const percentage =
        completedAttempts > 0
          ? Math.round((count / completedAttempts) * 100)
          : 0;
      return { range: range.range, count, percentage };
    });

    // Calculate category averages by analyzing submitted answers
    const categoryAverages = {
      logical: 0,
      verbal: 0,
      numerical: 0,
      attention: 0,
      other: 0,
    };

    if (allCompletedAttempts.length > 0) {
      // Get all submitted answers for completed attempts with retry logic
      const regularAttemptIds = completedRegularAttempts.map(
        (attempt) => attempt.id
      );
      const publicAttemptIds = completedPublicAttempts.map(
        (attempt) => attempt.id
      );

      const [regularSubmittedAnswers, publicSubmittedAnswers] =
        await retryOperation(async () => {
          return await Promise.all([
            regularAttemptIds.length > 0
              ? prisma.submittedAnswer.findMany({
                  where: { testAttemptId: { in: regularAttemptIds } },
                  include: {
                    question: {
                      select: { category: true },
                    },
                  },
                })
              : [],
            publicAttemptIds.length > 0
              ? prisma.publicSubmittedAnswer.findMany({
                  where: { attemptId: { in: publicAttemptIds } },
                  include: {
                    question: {
                      select: { category: true },
                    },
                  },
                })
              : [],
          ]);
        });

      // Combine all submitted answers
      const allSubmittedAnswers = [
        ...regularSubmittedAnswers.map((answer) => ({
          isCorrect: answer.isCorrect,
          category: answer.question.category,
        })),
        ...publicSubmittedAnswers.map((answer) => ({
          isCorrect: answer.isCorrect,
          category: answer.question.category,
        })),
      ];

      // Calculate category averages
      const categoryStats = {
        LOGICAL: { correct: 0, total: 0 },
        VERBAL: { correct: 0, total: 0 },
        NUMERICAL: { correct: 0, total: 0 },
        ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
        OTHER: { correct: 0, total: 0 },
      };

      allSubmittedAnswers.forEach((answer) => {
        if (answer.category && categoryStats[answer.category]) {
          categoryStats[answer.category].total++;
          if (answer.isCorrect) {
            categoryStats[answer.category].correct++;
          }
        }
      });

      // Convert to percentages
      categoryAverages.logical =
        categoryStats.LOGICAL.total > 0
          ? Math.round(
              (categoryStats.LOGICAL.correct / categoryStats.LOGICAL.total) *
                100
            )
          : 0;
      categoryAverages.verbal =
        categoryStats.VERBAL.total > 0
          ? Math.round(
              (categoryStats.VERBAL.correct / categoryStats.VERBAL.total) * 100
            )
          : 0;
      categoryAverages.numerical =
        categoryStats.NUMERICAL.total > 0
          ? Math.round(
              (categoryStats.NUMERICAL.correct /
                categoryStats.NUMERICAL.total) *
                100
            )
          : 0;
      categoryAverages.attention =
        categoryStats.ATTENTION_TO_DETAIL.total > 0
          ? Math.round(
              (categoryStats.ATTENTION_TO_DETAIL.correct /
                categoryStats.ATTENTION_TO_DETAIL.total) *
                100
            )
          : 0;
      categoryAverages.other =
        categoryStats.OTHER.total > 0
          ? Math.round(
              (categoryStats.OTHER.correct / categoryStats.OTHER.total) * 100
            )
          : 0;
    }

    // Top performers (top 5)
    const topPerformers = allCompletedAttempts
      .sort((a, b) => b.percentageScore - a.percentageScore)
      .slice(0, 5)
      .map((attempt) => ({
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        score: attempt.percentageScore,
        completedAt: attempt.completedAt?.toISOString() || '',
        attemptId: attempt.id,
      }));

    // Monthly trends (simplified - last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );

      const monthAttempts = allCompletedAttempts.filter(
        (attempt) =>
          attempt.completedAt &&
          attempt.completedAt >= monthStart &&
          attempt.completedAt <= monthEnd
      );

      const monthAverage =
        monthAttempts.length > 0
          ? Math.round(
              monthAttempts.reduce(
                (sum, attempt) => sum + attempt.percentageScore,
                0
              ) / monthAttempts.length
            )
          : 0;

      monthlyTrends.push({
        month: date.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        attempts: monthAttempts.length,
        averageScore: monthAverage,
      });
    }

    const analytics = {
      position,
      totalAttempts,
      completedAttempts,
      averageScore,
      topScore,
      averageTimeMinutes,
      recentAttempts,
      scoreDistribution,
      categoryAverages,
      monthlyTrends,
      topPerformers,
    };

    return NextResponse.json(analytics);
  } catch (error: any) {
    console.error('Error fetching position analytics:', error);

    // Check if it's a database connectivity error
    if (
      error.code === 'P1001' ||
      error.message?.includes("Can't reach database")
    ) {
      console.error('Database connectivity issue detected');
      return NextResponse.json(
        {
          error: 'Database connection error. Please try again in a moment.',
          details:
            'The database server is temporarily unavailable. This is usually resolved quickly.',
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Check if it's a timeout error
    if (error.message?.includes('timeout') || error.code === 'P1008') {
      return NextResponse.json(
        {
          error: 'Request timeout. Please try again.',
          details: 'The database query took too long to complete.',
        },
        { status: 504 } // Gateway Timeout
      );
    }

    // For other errors, return generic error
    return NextResponse.json(
      {
        error: 'Failed to fetch position analytics',
        details: 'An unexpected error occurred while processing your request.',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
