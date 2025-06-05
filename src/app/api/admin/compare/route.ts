import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { ids: string[] };
    const MAX_IDS = 5;

    if (
      !body?.ids ||
      !Array.isArray(body.ids) ||
      body.ids.length === 0 ||
      body.ids.length > MAX_IDS
    ) {
      return NextResponse.json(
        {
          message: `ids parameter required: array of 1-${MAX_IDS} attempt IDs`,
        },
        { status: 400 }
      );
    }

    // Use raw query for now until Prisma generates the view types
    const rows = await prisma.$queryRaw`
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
      WHERE "attemptId" = ANY(${body.ids})
      ORDER BY "rank" ASC
    `;

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

    return NextResponse.json(serializedRows);
  } catch (error) {
    console.error('[API /admin/compare] Error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
