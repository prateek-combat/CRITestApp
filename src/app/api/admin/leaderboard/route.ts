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

    // Build dynamic SQL using Prisma.sql for safety
    let whereConditions = [];
    let queryParams = [];

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

    const whereClause =
      whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';

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

    // Execute queries in parallel using raw SQL
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
  } catch (error) {
    console.error('[API /admin/leaderboard] Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}
