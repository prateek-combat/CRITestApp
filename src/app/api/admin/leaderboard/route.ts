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
    const testId = searchParams.get('testId');
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
    if (testId) {
      whereConditions.push(`"testId" = '${testId}'`);
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
      const [rows, totalResult, statsResult] = await Promise.all([
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
        // Stats query
        prisma.$queryRawUnsafe(`
          SELECT 
            COUNT(*) as totalCandidates,
            ROUND(AVG("composite")::numeric, 1) as avgScore,
            MAX("composite") as topScore,
            COUNT(CASE WHEN "completedAt" >= date_trunc('month', CURRENT_DATE) THEN 1 END) as thisMonth
          FROM vw_candidate_scores 
          WHERE ${whereClause}
        `),
      ]);

      const total = Number((totalResult as any)[0]?.count || 0);
      const stats = (statsResult as any)[0] || {};

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
          testId,
          search,
          sortBy,
          sortOrder,
        },
        stats: {
          totalCandidates: Number(stats.totalCandidates || 0),
          avgScore: Number(stats.avgScore || 0),
          topScore: Number(stats.topScore || 0),
          thisMonth: Number(stats.thisMonth || 0),
        },
      });
    } catch (viewError) {
      console.warn(
        '[API /admin/leaderboard] View query failed, falling back to direct table query:',
        viewError
      );

      // Fallback: Query both TestAttempt and PublicTestAttempt tables directly if view fails
      const whereCondition: any = {
        status: 'COMPLETED',
        completedAt: { not: null },
      };

      // Add search filter for both regular and public attempts
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

      // For regular invitations, filter by invitationId if specified
      const regularWhereCondition = { ...whereCondition };
      if (invitationId) {
        regularWhereCondition.invitationId = invitationId;
      }

      // Add testId filter for regular attempts
      if (testId) {
        regularWhereCondition.testId = testId;
      }

      // For public attempts, we need to filter by testId through the publicLink
      const publicWhereCondition = { ...whereCondition };
      if (testId) {
        publicWhereCondition.publicLink = {
          testId: testId,
        };
      }

      // Query both regular and public test attempts
      const [testAttempts, publicTestAttempts] = await Promise.all([
        prisma.testAttempt.findMany({
          where: regularWhereCondition,
          include: {
            invitation: true,
          },
          orderBy:
            sortBy === 'completedAt'
              ? { completedAt: sortOrder }
              : { createdAt: 'desc' },
        }),
        prisma.publicTestAttempt.findMany({
          where: publicWhereCondition,
          include: {
            publicLink: {
              include: {
                test: true,
              },
            },
          },
          orderBy:
            sortBy === 'completedAt'
              ? { completedAt: sortOrder }
              : { createdAt: 'desc' },
        }),
      ]);

      // Process regular test attempts
      const processRegularAttempt = (attempt: any, index: number) => {
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
          rank: 0, // Will be calculated after combining and sorting
          isPublicAttempt: false,
        };
      };

      // Process public test attempts
      const processPublicAttempt = (attempt: any, index: number) => {
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
          invitationId: null, // Public attempts don't have invitations
          candidateName: attempt.candidateName || 'Anonymous',
          candidateEmail: attempt.candidateEmail || '',
          completedAt: attempt.completedAt,
          durationSeconds,
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          composite,
          percentile: 50, // Default percentile for fallback
          rank: 0, // Will be calculated after combining and sorting
          isPublicAttempt: true,
        };
      };

      // Process both types of attempts
      const regularRows = testAttempts.map(processRegularAttempt);
      const publicRows = publicTestAttempts.map(processPublicAttempt);

      // Combine and sort all attempts by composite score
      const allAttempts = [...regularRows, ...publicRows];
      allAttempts.sort((a, b) => b.composite - a.composite);

      // Assign ranks after sorting
      const processedRows = allAttempts.map((attempt, index) => ({
        ...attempt,
        rank: index + 1,
      }));

      // Apply additional sorting if needed (already sorted by composite)
      if (sortBy === 'completedAt') {
        processedRows.sort((a, b) => {
          const aTime = new Date(a.completedAt).getTime();
          const bTime = new Date(b.completedAt).getTime();
          return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
        });
      } else if (sortBy === 'candidateName') {
        processedRows.sort((a, b) => {
          const comparison = a.candidateName.localeCompare(b.candidateName);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      } else if (sortBy === 'durationSeconds') {
        processedRows.sort((a, b) => {
          return sortOrder === 'desc'
            ? b.durationSeconds - a.durationSeconds
            : a.durationSeconds - b.durationSeconds;
        });
      }

      // Get total count for both tables with the same filters
      const [regularTotal, publicTotal] = await Promise.all([
        prisma.testAttempt.count({
          where: regularWhereCondition,
        }),
        prisma.publicTestAttempt.count({
          where: publicWhereCondition,
        }),
      ]);

      const total = regularTotal + publicTotal;

      // Calculate stats
      const allStats = {
        totalCandidates: total,
        avgScore:
          allAttempts.length > 0
            ? allAttempts.reduce((sum, a) => sum + a.composite, 0) /
              allAttempts.length
            : 0,
        topScore:
          allAttempts.length > 0
            ? Math.max(...allAttempts.map((a) => a.composite))
            : 0,
        thisMonth: allAttempts.filter((a) => {
          const completedAt = new Date(a.completedAt);
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          return completedAt >= startOfMonth;
        }).length,
      };

      // Apply pagination after sorting
      const paginatedRows = processedRows.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

      return NextResponse.json({
        rows: paginatedRows,
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
        stats: {
          totalCandidates: Math.round(allStats.totalCandidates),
          avgScore: Math.round(allStats.avgScore * 10) / 10,
          topScore: Math.round(allStats.topScore * 10) / 10,
          thisMonth: allStats.thisMonth,
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
