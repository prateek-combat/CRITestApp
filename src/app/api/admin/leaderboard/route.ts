import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withCache, apiCache } from '@/lib/cache';

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

    // Generate cache key based on all parameters
    const cacheKey = apiCache.generateKey('leaderboard', {
      page,
      pageSize,
      dateFrom: dateFrom || '',
      dateTo: dateTo || '',
      invitationId: invitationId || '',
      testId: testId || '',
      search: search || '',
      sortBy,
      sortOrder,
    });

    // Try to get cached result
    const cachedResult = apiCache.get(cacheKey);
    if (cachedResult) {
      return NextResponse.json(cachedResult);
    }

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
      // Validate UUID format to prevent SQL injection
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(testId)) {
        whereConditions.push(`"testId" = '${testId}'`);
      } else {
        // If not a UUID, treat it as a test title and look up the actual testId
        const escapedTestId = testId.replace(/'/g, "''");
        whereConditions.push(
          `"testId" IN (SELECT id FROM "Test" WHERE title ILIKE '%${escapedTestId}%')`
        );
      }
    }
    if (search) {
      // Escape special characters to prevent SQL injection
      const escapedSearch = search.replace(/'/g, "''");
      whereConditions.push(
        `("candidateName" ILIKE '%${escapedSearch}%' OR "candidateEmail" ILIKE '%${escapedSearch}%')`
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
            "scoreOther",
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
        scoreOther: Number(row.scoreOther),
        composite: Number(row.composite),
        percentile: Number(row.percentile),
        rank: Number(row.rank),
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pageSize);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      const result = {
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
      };

      // Cache the result for 2 minutes
      apiCache.set(cacheKey, result, 120);

      return NextResponse.json(result);
    } catch (viewError: any) {
      console.warn(
        '[API /admin/leaderboard] View query failed, falling back to direct table query:',
        viewError
      );

      // Fallback: Query both TestAttempt and PublicTestAttempt tables directly if view fails
      const whereCondition: any = {
        status: 'COMPLETED',
        completedAt: { not: null },
        categorySubScores: { not: null },
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
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(testId)) {
          regularWhereCondition.testId = testId;
        } else {
          // If not a UUID, look up by test title
          const test = await prisma.test.findFirst({
            where: { title: { contains: testId, mode: 'insensitive' } },
            select: { id: true },
          });
          if (test) {
            regularWhereCondition.testId = test.id;
          }
        }
      }

      // For public attempts, we need to filter by testId through the publicLink
      const publicWhereCondition = { ...whereCondition };
      if (testId) {
        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(testId)) {
          publicWhereCondition.publicLink = {
            testId: testId,
          };
        } else {
          // If not a UUID, look up by test title
          const test = await prisma.test.findFirst({
            where: { title: { contains: testId, mode: 'insensitive' } },
            select: { id: true },
          });
          if (test) {
            publicWhereCondition.publicLink = {
              testId: test.id,
            };
          }
        }
      }

      // Optimized queries with minimal data selection
      const [testAttempts, publicTestAttempts] = await Promise.all([
        prisma.testAttempt.findMany({
          where: regularWhereCondition,
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            completedAt: true,
            startedAt: true,
            categorySubScores: true,
            invitationId: true,
            testId: true,
          },
          orderBy: { completedAt: 'desc' },
        }),
        prisma.publicTestAttempt.findMany({
          where: publicWhereCondition,
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            completedAt: true,
            startedAt: true,
            categorySubScores: true,
            publicLinkId: true,
            publicLink: {
              select: {
                testId: true,
              },
            },
          },
          orderBy: { completedAt: 'desc' },
        }),
      ]);

      // Process and combine attempts data
      const allAttempts = [
        ...testAttempts.map((attempt) => ({
          attemptId: attempt.id,
          invitationId: attempt.invitationId,
          candidateName: attempt.candidateName || 'Anonymous',
          candidateEmail: attempt.candidateEmail || '',
          completedAt: attempt.completedAt!.toISOString(),
          durationSeconds: Math.floor(
            (attempt.completedAt!.getTime() - attempt.startedAt.getTime()) /
              1000
          ),
          categorySubScores: attempt.categorySubScores as any,
          testId: attempt.testId,
        })),
        ...publicTestAttempts.map((attempt) => ({
          attemptId: attempt.id,
          invitationId: null,
          candidateName: attempt.candidateName || 'Anonymous',
          candidateEmail: attempt.candidateEmail || '',
          completedAt: attempt.completedAt!.toISOString(),
          durationSeconds: Math.floor(
            (attempt.completedAt!.getTime() - attempt.startedAt.getTime()) /
              1000
          ),
          categorySubScores: attempt.categorySubScores as any,
          testId: attempt.publicLink?.testId || '',
        })),
      ];

      // Calculate scores for all attempts
      const processedRows = allAttempts.map((attempt) => {
        const scores = attempt.categorySubScores as any;

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
        const scoreOther = scores?.OTHER
          ? (scores.OTHER.correct / scores.OTHER.total) * 100
          : 0;

        const composite =
          (scoreLogical +
            scoreVerbal +
            scoreNumerical +
            scoreAttention +
            scoreOther) /
          5;

        return {
          ...attempt,
          scoreLogical: Math.round(scoreLogical * 10) / 10,
          scoreVerbal: Math.round(scoreVerbal * 10) / 10,
          scoreNumerical: Math.round(scoreNumerical * 10) / 10,
          scoreAttention: Math.round(scoreAttention * 10) / 10,
          scoreOther: Math.round(scoreOther * 10) / 10,
          composite: Math.round(composite * 10) / 10,
        };
      });

      // Sort by composite score to calculate ranks
      processedRows.sort((a, b) => b.composite - a.composite);

      // Assign ranks and percentiles
      const rankedRows = processedRows.map((row, index) => ({
        ...row,
        rank: index + 1,
        percentile: Math.round(
          ((processedRows.length - index) / processedRows.length) * 100
        ),
      }));

      // Apply sorting
      if (sortBy === 'completedAt') {
        rankedRows.sort((a, b) => {
          const aTime = new Date(a.completedAt).getTime();
          const bTime = new Date(b.completedAt).getTime();
          return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
        });
      } else if (sortBy === 'candidateName') {
        rankedRows.sort((a, b) => {
          const comparison = a.candidateName.localeCompare(b.candidateName);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      } else if (sortBy === 'durationSeconds') {
        rankedRows.sort((a, b) => {
          return sortOrder === 'desc'
            ? b.durationSeconds - a.durationSeconds
            : a.durationSeconds - b.durationSeconds;
        });
      }

      const total = rankedRows.length;

      // Calculate stats
      const stats = {
        totalCandidates: total,
        avgScore:
          total > 0
            ? rankedRows.reduce((sum, a) => sum + a.composite, 0) / total
            : 0,
        topScore:
          total > 0 ? Math.max(...rankedRows.map((a) => a.composite)) : 0,
        thisMonth: rankedRows.filter((a) => {
          const completedAt = new Date(a.completedAt);
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          return completedAt >= startOfMonth;
        }).length,
      };

      // Apply pagination
      const paginatedRows = rankedRows.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

      const result = {
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
          totalCandidates: Math.round(stats.totalCandidates),
          avgScore: Math.round(stats.avgScore * 10) / 10,
          topScore: Math.round(stats.topScore * 10) / 10,
          thisMonth: stats.thisMonth,
        },
      };

      // Cache the fallback result for 1 minute
      apiCache.set(cacheKey, result, 60);

      return NextResponse.json(result);
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
