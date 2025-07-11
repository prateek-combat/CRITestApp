import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and previous month for growth calculation
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // Parallel queries for better performance
    const [
      totalPositions,
      totalTests,
      totalAttempts,
      completedAttempts,
      thisMonthAttempts,
      lastMonthAttempts,
      averageScoreData,
    ] = await Promise.all([
      // Total active positions with tests
      prisma.position.count({
        where: {
          isActive: true,
          tests: {
            some: {
              isArchived: false,
            },
          },
        },
      }),

      // Total active tests
      prisma.test.count({
        where: {
          isArchived: false,
        },
      }),

      // Total test attempts (both regular and public)
      Promise.all([
        prisma.testAttempt.count(),
        prisma.publicTestAttempt.count(),
      ]).then(([regular, public_]) => regular + public_),

      // Completed attempts
      Promise.all([
        prisma.testAttempt.count({
          where: { status: 'COMPLETED' },
        }),
        prisma.publicTestAttempt.count({
          where: { status: 'COMPLETED' },
        }),
      ]).then(([regular, public_]) => regular + public_),

      // This month attempts
      Promise.all([
        prisma.testAttempt.count({
          where: {
            completedAt: {
              gte: thisMonthStart,
            },
          },
        }),
        prisma.publicTestAttempt.count({
          where: {
            completedAt: {
              gte: thisMonthStart,
            },
          },
        }),
      ]).then(([regular, public_]) => regular + public_),

      // Last month attempts
      Promise.all([
        prisma.testAttempt.count({
          where: {
            completedAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd,
            },
          },
        }),
        prisma.publicTestAttempt.count({
          where: {
            completedAt: {
              gte: lastMonthStart,
              lte: lastMonthEnd,
            },
          },
        }),
      ]).then(([regular, public_]) => regular + public_),

      // Average score calculation
      Promise.all([
        prisma.testAttempt.aggregate({
          where: { status: 'COMPLETED' },
          _avg: { rawScore: true },
          _count: { id: true },
        }),
        prisma.publicTestAttempt.aggregate({
          where: { status: 'COMPLETED' },
          _avg: { rawScore: true },
          _count: { id: true },
        }),
      ]),
    ]);

    // Simplified candidate count (approximation)
    const [invitationCount, publicAttemptCount] = await Promise.all([
      prisma.invitation.count(),
      prisma.publicTestAttempt.count(),
    ]);

    const totalCandidates = invitationCount + publicAttemptCount;

    // Calculate weighted average score
    const [regularAvg, publicAvg] = averageScoreData;
    const totalCompletedAttempts =
      (regularAvg._count.id || 0) + (publicAvg._count.id || 0);
    const averageScore =
      totalCompletedAttempts > 0
        ? ((regularAvg._avg.rawScore || 0) * (regularAvg._count.id || 0) +
            (publicAvg._avg.rawScore || 0) * (publicAvg._count.id || 0)) /
          totalCompletedAttempts
        : 0;

    // Calculate completion rate
    const completionRate =
      totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;

    // Calculate growth rate
    const growthRate =
      lastMonthAttempts > 0
        ? ((thisMonthAttempts - lastMonthAttempts) / lastMonthAttempts) * 100
        : thisMonthAttempts > 0
          ? 100
          : 0;

    const stats = {
      totalPositions,
      totalCandidates,
      totalAttempts,
      averageScore,
      completionRate,
      thisMonthAttempts,
      lastMonthAttempts,
      growthRate,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch overview analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
