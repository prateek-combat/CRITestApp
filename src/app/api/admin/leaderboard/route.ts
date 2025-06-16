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
    const sortBy = searchParams.get('sortBy') || 'compositeScore';
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
      where.submittedAt = {};
      if (dateFrom) {
        where.submittedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.submittedAt.lte = new Date(dateTo);
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

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'compositeScore') {
      orderBy.compositeScore = sortOrder;
    } else if (sortBy === 'submittedAt') {
      orderBy.submittedAt = sortOrder;
    } else if (sortBy === 'candidateName') {
      orderBy.candidateName = sortOrder;
    } else if (sortBy === 'candidateEmail') {
      orderBy.candidateEmail = sortOrder;
    } else {
      orderBy.compositeScore = 'desc';
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
              email: true,
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
    const leaderboardData = attempts.map((attempt) => {
      const categoryScores: Record<
        string,
        { correct: number; total: number; percentage: number }
      > = {};

      // Group answers by category
      attempt.submittedAnswers.forEach((answer) => {
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

      return {
        id: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        compositeScore: attempt.compositeScore || 0,
        submittedAt: attempt.submittedAt,
        test: attempt.test,
        invitation: attempt.invitation,
        categoryScores,
        totalQuestions: attempt.submittedAnswers.length,
        correctAnswers: attempt.submittedAnswers.filter((a) => a.isCorrect)
          .length,
      };
    });

    return NextResponse.json({
      data: leaderboardData,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
