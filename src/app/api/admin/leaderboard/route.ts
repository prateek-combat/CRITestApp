import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Disable caching for this route

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
    if (!testId) {
      return NextResponse.json(
        { error: 'testId is required' },
        { status: 400 }
      );
    }

    // Vercel's edge runtime might not have this, provide a fallback.
    const timezone = searchParams.get('timezone') || 'UTC';

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '10'),
      100
    );
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'composite';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invitationId = searchParams.get('invitationId');

    const where: any = {
      testId,
      status: 'COMPLETED',
    };

    if (search) {
      where.OR = [
        { candidateEmail: { contains: search, mode: 'insensitive' } },
        { candidateName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (invitationId) {
      where.invitationId = invitationId;
    }
    if (dateFrom || dateTo) {
      where.completedAt = {};
      if (dateFrom) where.completedAt.gte = new Date(dateFrom);
      if (dateTo) where.completedAt.lte = new Date(dateTo);
    }

    const orderBy: any = {
      [sortBy === 'composite' ? 'rawScore' : sortBy]: sortOrder,
    };

    const [attemptsWithScores, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          invitationId: true,
          candidateName: true,
          candidateEmail: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          percentile: true,
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: { select: { category: true } },
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    const leaderboardData = attemptsWithScores.map((attempt, index) => {
      const categoryScores: Record<
        string,
        { correct: number; total: number; percentage: number }
      > = {};

      for (const answer of attempt.submittedAnswers) {
        const category = answer.question.category;
        if (!category) continue;
        if (!categoryScores[category]) {
          categoryScores[category] = { correct: 0, total: 0, percentage: 0 };
        }
        categoryScores[category].total++;
        if (answer.isCorrect) {
          categoryScores[category].correct++;
        }
      }

      Object.keys(categoryScores).forEach((category) => {
        const score = categoryScores[category];
        score.percentage =
          score.total > 0 ? (score.correct / score.total) * 100 : 0;
      });

      return {
        attemptId: attempt.id,
        invitationId: attempt.invitationId,
        candidateName: attempt.candidateName || 'Unknown',
        candidateEmail: attempt.candidateEmail || 'unknown@example.com',
        completedAt: attempt.completedAt,
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
        composite: attempt.rawScore || 0,
        percentile: attempt.percentile || 0,
        rank: index + 1 + (page - 1) * pageSize,
      };
    });

    const allScoresForStats = await prisma.testAttempt.findMany({
      where: { testId, status: 'COMPLETED' },
      select: { rawScore: true, completedAt: true },
    });

    const validScores = allScoresForStats
      .map((a) => a.rawScore)
      .filter((s) => s !== null) as number[];

    const thisMonthCount = allScoresForStats.filter(
      (a) => a.completedAt && a.completedAt.getMonth() === new Date().getMonth()
    ).length;

    return NextResponse.json({
      rows: leaderboardData,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
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
      stats: {
        totalCandidates: total,
        avgScore:
          validScores.length > 0
            ? validScores.reduce((a, b) => a + b, 0) / validScores.length
            : 0,
        topScore: validScores.length > 0 ? Math.max(...validScores) : 0,
        thisMonth: thisMonthCount,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    // Vercel logs are often the only way to see this in production
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
