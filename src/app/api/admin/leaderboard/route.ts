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

    // For calculated fields, we'll sort after fetching data
    const isCalculatedField = [
      'scoreLogical',
      'scoreVerbal',
      'scoreNumerical',
      'scoreAttention',
      'scoreOther',
      'rank',
    ].includes(sortBy);

    // Use default sorting for database fields, or no sorting for calculated fields
    const dbOrderBy = isCalculatedField ? { rawScore: 'desc' } : orderBy;

    // Fetch both regular and public attempts
    const [regularAttempts, publicAttempts] = await Promise.all([
      prisma.testAttempt.findMany({
        where: regularWhere,
        orderBy: dbOrderBy,
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
        orderBy: dbOrderBy,
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

    // Calculate scores for all attempts first
    const processedAttempts = allAttempts.map((attempt, index) => {
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
        ...attempt,
        scoreLogical: categoryScores['LOGICAL']?.percentage || 0,
        scoreVerbal: categoryScores['VERBAL']?.percentage || 0,
        scoreNumerical: categoryScores['NUMERICAL']?.percentage || 0,
        scoreAttention: categoryScores['ATTENTION_TO_DETAIL']?.percentage || 0,
        scoreOther: categoryScores['OTHER']?.percentage || 0,
        composite: attempt.rawScore || 0,
        percentile: attempt.percentile || 0,
      };
    });

    // Sort processed results by the requested field
    processedAttempts.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'rank':
          // For rank, sort by composite score (descending = rank 1 is highest score)
          aValue = a.composite;
          bValue = b.composite;
          // Reverse the sort order for rank (higher score = lower rank number)
          return sortOrder === 'asc' ? bValue - aValue : aValue - bValue;
        case 'composite':
          aValue = a.composite;
          bValue = b.composite;
          break;
        case 'scoreLogical':
          aValue = a.scoreLogical;
          bValue = b.scoreLogical;
          break;
        case 'scoreVerbal':
          aValue = a.scoreVerbal;
          bValue = b.scoreVerbal;
          break;
        case 'scoreNumerical':
          aValue = a.scoreNumerical;
          bValue = b.scoreNumerical;
          break;
        case 'scoreAttention':
          aValue = a.scoreAttention;
          bValue = b.scoreAttention;
          break;
        case 'scoreOther':
          aValue = a.scoreOther;
          bValue = b.scoreOther;
          break;
        case 'percentile':
          aValue = a.percentile;
          bValue = b.percentile;
          break;
        case 'candidateName':
          aValue = a.candidateName?.toLowerCase() || '';
          bValue = b.candidateName?.toLowerCase() || '';
          break;
        case 'completedAt':
          aValue = new Date(a.completedAt || 0).getTime();
          bValue = new Date(b.completedAt || 0).getTime();
          break;
        default:
          aValue = a[sortBy as keyof typeof a] || 0;
          bValue = b[sortBy as keyof typeof b] || 0;
      }

      // Handle string vs number comparison (skip for rank since it's handled above)
      if (sortBy === 'rank') {
        return 0; // Already handled above
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      } else {
        const numA = Number(aValue) || 0;
        const numB = Number(bValue) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      }
    });

    // Apply pagination
    const total = processedAttempts.length;
    const paginatedAttempts = processedAttempts.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    const leaderboardData = paginatedAttempts.map((attempt, index) => {
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
        scoreLogical: attempt.scoreLogical,
        scoreVerbal: attempt.scoreVerbal,
        scoreNumerical: attempt.scoreNumerical,
        scoreAttention: attempt.scoreAttention,
        scoreOther: attempt.scoreOther,
        composite: attempt.composite,
        percentile: attempt.percentile,
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
