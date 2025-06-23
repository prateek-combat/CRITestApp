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

    // Build where clauses for both regular and public attempts
    const baseWhere: any = {
      status: 'COMPLETED',
    };

    if (search) {
      baseWhere.OR = [
        { candidateEmail: { contains: search, mode: 'insensitive' } },
        { candidateName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      baseWhere.completedAt = {};
      if (dateFrom) baseWhere.completedAt.gte = new Date(dateFrom);
      if (dateTo) baseWhere.completedAt.lte = new Date(dateTo);
    }

    // Regular test attempts where clause
    const regularWhere = {
      ...baseWhere,
      testId,
    };
    if (invitationId) {
      regularWhere.invitationId = invitationId;
    }

    // Public test attempts where clause (need to join through publicLink)
    const publicWhere = {
      ...baseWhere,
      publicLink: {
        testId,
      },
    };

    const orderBy: any = {
      [sortBy === 'composite' ? 'rawScore' : sortBy]: sortOrder,
    };

    // Fetch both regular and public attempts
    const [regularAttempts, publicAttempts] = await Promise.all([
      prisma.testAttempt.findMany({
        where: regularWhere,
        orderBy,
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
      prisma.publicTestAttempt.findMany({
        where: publicWhere,
        orderBy,
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          percentile: true,
          publicLink: {
            select: {
              title: true,
            },
          },
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: { select: { category: true } },
            },
          },
        },
      }),
    ]);

    // Combine and normalize the data
    const allAttempts = [
      ...regularAttempts.map((attempt) => ({
        ...attempt,
        type: 'regular' as const,
        submittedAnswers: attempt.submittedAnswers,
      })),
      ...publicAttempts.map((attempt) => ({
        ...attempt,
        type: 'public' as const,
        invitationId: null, // Public attempts don't have invitations
        submittedAnswers: attempt.submittedAnswers,
      })),
    ];

    // Sort combined results
    allAttempts.sort((a, b) => {
      const aValue =
        sortBy === 'composite' ? a.rawScore || 0 : a[sortBy as keyof typeof a];
      const bValue =
        sortBy === 'composite' ? b.rawScore || 0 : b[sortBy as keyof typeof b];

      if (sortOrder === 'desc') {
        return (bValue as number) - (aValue as number);
      } else {
        return (aValue as number) - (bValue as number);
      }
    });

    // Apply pagination
    const total = allAttempts.length;
    const paginatedAttempts = allAttempts.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    const leaderboardData = paginatedAttempts.map((attempt, index) => {
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
        type: attempt.type, // Add type to distinguish regular vs public
      };
    });

    // Get stats from both tables
    const [regularStats, publicStats] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { testId, status: 'COMPLETED' },
        select: { rawScore: true, completedAt: true },
      }),
      prisma.publicTestAttempt.findMany({
        where: {
          status: 'COMPLETED',
          publicLink: { testId },
        },
        select: { rawScore: true, completedAt: true },
      }),
    ]);

    const allStatsAttempts = [...regularStats, ...publicStats];
    const validScores = allStatsAttempts
      .map((a) => a.rawScore)
      .filter((s) => s !== null) as number[];

    const thisMonthCount = allStatsAttempts.filter(
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
            ? Math.round(
                (validScores.reduce((a, b) => a + b, 0) / validScores.length) *
                  10
              ) / 10
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
