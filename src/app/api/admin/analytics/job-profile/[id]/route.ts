import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobProfileId = params.id;

    // Get job profile with test information
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        testWeights: {
          include: {
            test: true,
          },
        },
        positions: true,
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Get test IDs associated with this job profile
    const testIds = jobProfile.testWeights.map((tw) => tw.testId);

    if (testIds.length === 0) {
      return NextResponse.json({
        jobProfile,
        totalAttempts: 0,
        completedAttempts: 0,
        averageScore: 0,
        topScore: 0,
        averageTimeMinutes: 0,
        recentAttempts: 0,
        scoreDistribution: [],
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

    // Get all attempts for tests in this job profile
    const [regularAttempts, publicAttempts] = await Promise.all([
      prisma.testAttempt.findMany({
        where: {
          testId: { in: testIds },
        },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          rawScore: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          testId: true,
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.publicTestAttempt.findMany({
        where: {
          publicLink: {
            testId: { in: testIds },
          },
        },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          rawScore: true,
          startedAt: true,
          completedAt: true,
          createdAt: true,
          publicLink: {
            select: {
              testId: true,
            },
          },
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: {
                select: {
                  category: true,
                },
              },
            },
          },
        },
      }),
    ]);

    // Combine attempts
    const allAttempts = [
      ...regularAttempts.map((a) => ({
        ...a,
        testId: a.testId,
        type: 'regular' as const,
      })),
      ...publicAttempts.map((a) => ({
        ...a,
        testId: a.publicLink.testId,
        type: 'public' as const,
      })),
    ];

    const totalAttempts = allAttempts.length;
    const completedAttempts = allAttempts.filter(
      (a) => a.status === 'COMPLETED'
    );

    // Get total questions for percentage calculation
    const totalQuestions = await prisma.question.count({
      where: { testId: { in: testIds } },
    });

    // Calculate metrics for completed attempts
    let totalScore = 0;
    let topScore = 0;
    let totalTimeMinutes = 0;
    const categoryScores: Record<string, { correct: number; total: number }> = {
      LOGICAL: { correct: 0, total: 0 },
      VERBAL: { correct: 0, total: 0 },
      NUMERICAL: { correct: 0, total: 0 },
      ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
      OTHER: { correct: 0, total: 0 },
    };

    // Get category question counts
    const categoryQuestionCounts = await prisma.question.groupBy({
      by: ['category'],
      where: { testId: { in: testIds } },
      _count: { id: true },
    });

    // Initialize category totals
    categoryQuestionCounts.forEach((cat) => {
      if (cat.category && categoryScores[cat.category]) {
        categoryScores[cat.category].total = cat._count.id;
      }
    });

    const scoreRanges = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0,
    };

    const performerScores: Array<{
      candidateName: string;
      candidateEmail: string;
      score: number;
      completedAt: Date;
      attemptId: string;
    }> = [];

    completedAttempts.forEach((attempt) => {
      const scorePercentage =
        totalQuestions > 0
          ? ((attempt.rawScore || 0) / totalQuestions) * 100
          : 0;
      totalScore += scorePercentage;

      if (scorePercentage > topScore) {
        topScore = scorePercentage;
      }

      // Calculate time taken
      if (attempt.startedAt && attempt.completedAt) {
        const timeTaken =
          (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
          1000 /
          60; // in minutes
        totalTimeMinutes += timeTaken;
      }

      // Score distribution
      if (scorePercentage <= 20) scoreRanges['0-20']++;
      else if (scorePercentage <= 40) scoreRanges['21-40']++;
      else if (scorePercentage <= 60) scoreRanges['41-60']++;
      else if (scorePercentage <= 80) scoreRanges['61-80']++;
      else scoreRanges['81-100']++;

      // Category scores
      attempt.submittedAnswers.forEach((answer) => {
        const category = answer.question.category;
        if (category && categoryScores[category]) {
          if (answer.isCorrect) {
            categoryScores[category].correct++;
          }
        }
      });

      // Track for top performers
      performerScores.push({
        candidateName: attempt.candidateName || 'Unknown',
        candidateEmail: attempt.candidateEmail || 'unknown@example.com',
        score: scorePercentage,
        completedAt: attempt.completedAt!,
        attemptId: attempt.id,
      });
    });

    const averageScore =
      completedAttempts.length > 0 ? totalScore / completedAttempts.length : 0;
    const averageTimeMinutes =
      completedAttempts.length > 0
        ? totalTimeMinutes / completedAttempts.length
        : 0;

    // Category averages
    const categoryAverages = {
      logical:
        categoryScores.LOGICAL.total > 0
          ? (categoryScores.LOGICAL.correct / categoryScores.LOGICAL.total) *
            100
          : 0,
      verbal:
        categoryScores.VERBAL.total > 0
          ? (categoryScores.VERBAL.correct / categoryScores.VERBAL.total) * 100
          : 0,
      numerical:
        categoryScores.NUMERICAL.total > 0
          ? (categoryScores.NUMERICAL.correct /
              categoryScores.NUMERICAL.total) *
            100
          : 0,
      attention:
        categoryScores.ATTENTION_TO_DETAIL.total > 0
          ? (categoryScores.ATTENTION_TO_DETAIL.correct /
              categoryScores.ATTENTION_TO_DETAIL.total) *
            100
          : 0,
      other:
        categoryScores.OTHER.total > 0
          ? (categoryScores.OTHER.correct / categoryScores.OTHER.total) * 100
          : 0,
    };

    // Recent attempts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAttempts = allAttempts.filter(
      (a) => a.createdAt >= thirtyDaysAgo
    ).length;

    // Score distribution
    const totalCompleted = completedAttempts.length || 1; // Avoid division by zero
    const scoreDistribution = Object.entries(scoreRanges).map(
      ([range, count]) => ({
        range,
        count,
        percentage: (count / totalCompleted) * 100,
      })
    );

    // Top performers (top 5)
    const topPerformers = performerScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthAttempts = completedAttempts.filter(
        (a) => a.completedAt! >= monthStart && a.completedAt! <= monthEnd
      );

      const monthScore =
        monthAttempts.length > 0
          ? monthAttempts.reduce(
              (sum, a) =>
                sum +
                (totalQuestions > 0
                  ? ((a.rawScore || 0) / totalQuestions) * 100
                  : 0),
              0
            ) / monthAttempts.length
          : 0;

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
        attempts: monthAttempts.length,
        averageScore: monthScore,
      });
    }

    return NextResponse.json({
      jobProfile,
      totalAttempts,
      completedAttempts: completedAttempts.length,
      averageScore,
      topScore,
      averageTimeMinutes,
      recentAttempts,
      scoreDistribution,
      categoryAverages,
      monthlyTrends,
      topPerformers,
    });
  } catch (error) {
    console.error('Job profile analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profile analytics' },
      { status: 500 }
    );
  }
}
