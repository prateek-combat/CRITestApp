import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get totals
    const [totalTests, totalInvitations, totalAttempts, completedAttempts] =
      await Promise.all([
        prisma.test.count({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        }),
        prisma.invitation.count({
          where: {
            createdAt: {
              gte: startDate,
            },
          },
        }),
        prisma.testAttempt.count({
          where: {
            startedAt: {
              gte: startDate,
            },
          },
        }),
        prisma.testAttempt.count({
          where: {
            startedAt: {
              gte: startDate,
            },
            status: 'COMPLETED',
          },
        }),
      ]);

    const completionRate =
      totalAttempts > 0 ? (completedAttempts / totalAttempts) * 100 : 0;

    // Get tests by month (simplified)
    const testsByMonth = await prisma.test.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _count: true,
    });

    // Format monthly data
    const monthlyData = testsByMonth.reduce((acc: any, test: any) => {
      const month = new Date(test.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += test._count;
      return acc;
    }, {});

    const formattedMonthlyData = Object.entries(monthlyData).map(
      ([month, count]) => ({
        month,
        count,
      })
    );

    // Mock score distribution data
    const scoreDistribution = [
      { range: '0-20%', count: 5 },
      { range: '21-40%', count: 12 },
      { range: '41-60%', count: 25 },
      { range: '61-80%', count: 18 },
      { range: '81-100%', count: 8 },
    ];

    // Get recent activity (simplified)
    const recentTests = await prisma.test.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true },
    });

    const recentInvitations = await prisma.invitation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, candidateEmail: true, createdAt: true },
    });

    const recentActivity = [
      ...recentTests.map((test: any) => ({
        id: test.id,
        type: 'test_created' as const,
        description: `Test "${test.title}" was created`,
        timestamp: test.createdAt.toISOString(),
      })),
      ...recentInvitations.map((invitation: any) => ({
        id: invitation.id,
        type: 'invitation_sent' as const,
        description: `Invitation sent to ${invitation.candidateEmail}`,
        timestamp: invitation.createdAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({
      totalTests,
      totalInvitations,
      totalAttempts,
      completionRate,
      testsByMonth: formattedMonthlyData,
      scoreDistribution,
      recentActivity,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
