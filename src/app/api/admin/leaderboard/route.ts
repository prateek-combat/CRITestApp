import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(10, Number(searchParams.get('pageSize') || '25'))
    );
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invitationId = searchParams.get('invitationId');
    const search = searchParams.get('search')?.trim();
    const sortBy = searchParams.get('sortBy') || 'rank';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where conditions for filtering
    let whereConditions = ['1=1'];

    if (dateFrom) {
      whereConditions.push(`"completedAt" >= '${dateFrom}'::timestamp`);
    }
    if (dateTo) {
      whereConditions.push(`"completedAt" <= '${dateTo}'::timestamp`);
    }
    if (invitationId) {
      whereConditions.push(`"invitationId" = '${invitationId}'`);
    }
    if (search) {
      whereConditions.push(
        `("candidateName" ILIKE '%${search}%' OR "candidateEmail" ILIKE '%${search}%')`
      );
    }

    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case 'composite':
        orderByClause = `"composite" ${sortOrder.toUpperCase()}`;
        break;
      case 'candidateName':
        orderByClause = `"candidateName" ${sortOrder.toUpperCase()}`;
        break;
      case 'completedAt':
        orderByClause = `"completedAt" ${sortOrder.toUpperCase()}`;
        break;
      case 'durationSeconds':
        orderByClause = `"durationSeconds" ${sortOrder.toUpperCase()}`;
        break;
      default:
        orderByClause = '"rank" ASC';
    }

    try {
      // First, try to use the view
      const [rows, totalResult] = await Promise.all([
        prisma.$queryRawUnsafe(`
          SELECT 
            "attemptId",
            "invitationId", 
            "candidateName",
            "candidateEmail",
            "completedAt",
            "durationSeconds",
            "scoreLogical",
            "scoreVerbal", 
            "scoreNumerical",
            "scoreAttention",
            "composite",
            "percentile",
            "rank"
          FROM vw_candidate_scores 
          WHERE ${whereClause}
          ORDER BY ${orderByClause}
          LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
        `),
        prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM vw_candidate_scores 
          WHERE ${whereClause}
        `),
      ]);

      const total = Number((totalResult as any)[0]?.count || 0);

      // Convert BigInt values to numbers for JSON serialization
      const serializedRows = (rows as any[]).map((row: any) => ({
        ...row,
        durationSeconds: Number(row.durationSeconds),
        scoreLogical: Number(row.scoreLogical),
        scoreVerbal: Number(row.scoreVerbal),
        scoreNumerical: Number(row.scoreNumerical),
        scoreAttention: Number(row.scoreAttention),
        composite: Number(row.composite),
        percentile: Number(row.percentile),
        rank: Number(row.rank),
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pageSize);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return NextResponse.json({
        rows: serializedRows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasNext,
          hasPrevious,
        },
        filters: {
          dateFrom,
          dateTo,
          invitationId,
          search,
          sortBy,
          sortOrder,
        },
      });
    } catch (viewError) {
      console.warn(
        '[API /admin/leaderboard] View query failed, falling back to direct table query:',
        viewError
      );

      // Fallback: Query TestAttempt table directly if view fails
      const whereCondition: any = {
        status: 'COMPLETED',
        completedAt: { not: null },
      };

      // Add categorySubScores filter only if not null
      if (search) {
        whereCondition.OR = [
          { candidateName: { contains: search, mode: 'insensitive' } },
          { candidateEmail: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (dateFrom) {
        whereCondition.completedAt = {
          ...whereCondition.completedAt,
          gte: new Date(dateFrom),
        };
      }

      if (dateTo) {
        whereCondition.completedAt = {
          ...whereCondition.completedAt,
          lte: new Date(dateTo),
        };
      }

      if (invitationId) {
        whereCondition.invitationId = invitationId;
      }

      const testAttempts = await prisma.testAttempt.findMany({
        where: whereCondition,
        include: {
          invitation: true,
        },
        orderBy:
          sortBy === 'completedAt'
            ? { completedAt: sortOrder }
            : { createdAt: 'desc' },
        take: pageSize,
        skip: (page - 1) * pageSize,
      });

      // Calculate scores manually
      const processedRows = testAttempts.map((attempt, index) => {
        const scores = attempt.categorySubScores as any;

        // Calculate percentage scores
        const scoreLogical = scores?.LOGICAL
          ? (scores.LOGICAL.correct / scores.LOGICAL.total) * 100
          : 0;
        const scoreVerbal = scores?.VERBAL
          ? (scores.VERBAL.correct / scores.VERBAL.total) * 100
          : 0;
        const scoreNumerical = scores?.NUMERICAL
          ? (scores.NUMERICAL.correct / scores.NUMERICAL.total) * 100
          : 0;
        const scoreAttention = scores?.ATTENTION_TO_DETAIL
          ? (scores.ATTENTION_TO_DETAIL.correct /
              scores.ATTENTION_TO_DETAIL.total) *
            100
          : 0;

        const composite =
          (scoreLogical + scoreVerbal + scoreNumerical + scoreAttention) / 4;
        const durationSeconds =
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : 0;

        return {
          attemptId: attempt.id,
          invitationId: attempt.invitationId,
          candidateName:
            attempt.candidateName ||
            attempt.invitation?.candidateName ||
            'Anonymous',
          candidateEmail:
            attempt.candidateEmail || attempt.invitation?.candidateEmail || '',
          completedAt: attempt.completedAt,
          durationSeconds,
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          composite,
          percentile: 50, // Default percentile for fallback
          rank: index + 1 + (page - 1) * pageSize, // Simple ranking for fallback
        };
      });

      // Sort if needed
      if (sortBy === 'composite') {
        processedRows.sort((a, b) =>
          sortOrder === 'desc'
            ? b.composite - a.composite
            : a.composite - b.composite
        );
      }

      const total = await prisma.testAttempt.count({
        where: {
          status: 'COMPLETED',
          completedAt: { not: null },
        },
      });

      return NextResponse.json({
        rows: processedRows,
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
          search,
          sortBy,
          sortOrder,
        },
      });
    }
  } catch (error) {
    console.error('[API /admin/leaderboard] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch leaderboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
