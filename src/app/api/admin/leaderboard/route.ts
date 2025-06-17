import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { withCache, apiCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '10'),
      100
    );
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invitationId = searchParams.get('invitationId');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'rawScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: any = {
      status: 'COMPLETED',
    };

    if (testId) {
      where.testId = testId;
    }

    if (invitationId) {
      where.invitationId = invitationId;
    }

    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) {
        where.completedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.completedAt.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        {
          candidateEmail: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          candidateName: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Build orderBy clause - use valid database fields
    const orderBy: any = {};
    if (sortBy === 'rawScore' || sortBy === 'compositeScore') {
      orderBy.rawScore = sortOrder;
    } else if (sortBy === 'completedAt' || sortBy === 'submittedAt') {
      orderBy.completedAt = sortOrder;
    } else if (sortBy === 'candidateName') {
      orderBy.candidateName = sortOrder;
    } else if (sortBy === 'candidateEmail') {
      orderBy.candidateEmail = sortOrder;
    } else if (sortBy === 'percentile') {
      orderBy.percentile = sortOrder;
    } else {
      // Default sort by rawScore descending
      orderBy.rawScore = 'desc';
    }

    const skip = (page - 1) * pageSize;

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          test: {
            select: {
              id: true,
              title: true,
            },
          },
          invitation: {
            select: {
              id: true,
              candidateEmail: true,
            },
          },
          submittedAnswers: {
            include: {
              question: {
                select: {
                  id: true,
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    // Calculate category scores for each attempt
    const leaderboardData = attempts.map((attempt, index) => {
      const categoryScores: Record<
        string,
        { correct: number; total: number; percentage: number }
      > = {};

      // Group answers by category
      attempt.submittedAnswers.forEach((answer: any) => {
        const category = answer.question.category;
        if (!categoryScores[category]) {
          categoryScores[category] = { correct: 0, total: 0, percentage: 0 };
        }
        categoryScores[category].total++;
        if (answer.isCorrect) {
          categoryScores[category].correct++;
        }
      });

      // Calculate percentages
      Object.keys(categoryScores).forEach((category) => {
        const score = categoryScores[category];
        score.percentage =
          score.total > 0 ? (score.correct / score.total) * 100 : 0;
      });

      // Calculate composite score from raw data if not available
      const totalQuestions = attempt.submittedAnswers.length;
      const correctAnswers = attempt.submittedAnswers.filter(
        (a: any) => a.isCorrect
      ).length;
      const calculatedScore =
        totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      return {
        attemptId: attempt.id,
        invitationId: attempt.invitationId,
        candidateName: attempt.candidateName || 'Unknown',
        candidateEmail: attempt.candidateEmail || 'unknown@example.com',
        completedAt: attempt.completedAt || attempt.updatedAt,
        durationSeconds:
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : 0,
        scoreLogical: categoryScores['LOGICAL']?.percentage || 0,
        scoreVerbal: categoryScores['VERBAL']?.percentage || 0,
        scoreNumerical: categoryScores['NUMERICAL']?.percentage || 0,
        scoreAttention: categoryScores['ATTENTION_TO_DETAIL']?.percentage || 0,
        scoreOther: categoryScores['OTHER']?.percentage || 0,
        composite: attempt.rawScore || calculatedScore,
        percentile: attempt.percentile || 0,
        rank: index + 1 + skip, // Calculate rank based on position in sorted list
      };
    });

    // Calculate stats
    const stats = {
      totalCandidates: total,
      avgScore:
        leaderboardData.length > 0
          ? leaderboardData.reduce((sum, item) => sum + item.composite, 0) /
            leaderboardData.length
          : 0,
      topScore:
        leaderboardData.length > 0
          ? Math.max(...leaderboardData.map((item) => item.composite))
          : 0,
      thisMonth: attempts.filter(
        (attempt) =>
          attempt.completedAt &&
          attempt.completedAt.getMonth() === new Date().getMonth()
      ).length,
    };

    return NextResponse.json({
      rows: leaderboardData,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page < Math.ceil(total / pageSize),
        hasPrevious: page > 1,
      },
      filters: {
        dateFrom,
        dateTo,
        invitationId,
        testId,
        search,
        sortBy,
        sortOrder,
      },
      stats,
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
