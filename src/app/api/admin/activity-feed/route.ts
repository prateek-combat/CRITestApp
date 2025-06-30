import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        createdAt: true,
        createdBy: { select: { email: true } },
      },
    });

    const invitations = await prisma.jobProfileInvitation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        candidateEmail: true,
        createdAt: true,
        jobProfile: { select: { name: true } },
      },
    });

    const attempts = await prisma.testAttempt.findMany({
      orderBy: { completedAt: 'desc' },
      where: { completedAt: { not: null } },
      take: 10,
      select: {
        id: true,
        candidateEmail: true,
        completedAt: true,
        test: { select: { title: true } },
      },
    });

    const activities = [
      ...tests.map((t) => ({
        type: 'Test Created',
        timestamp: t.createdAt,
        description: `Test "${t.title}" was created.`,
        link: `/admin/tests/${t.id}`,
      })),
      ...invitations.map((i) => ({
        type: 'Invitation Sent',
        timestamp: i.createdAt,
        description: `Invitation sent to ${i.candidateEmail} for "${i.jobProfile.name}".`,
        link: `/admin/job-profiles`,
      })),
      ...attempts.map((a) => ({
        type: 'Test Completed',
        timestamp: a.completedAt as Date,
        description: `${a.candidateEmail} completed the test "${a.test.title}".`,
        link: `/admin/analytics/analysis/${a.id}`,
      })),
    ];

    const sortedActivities = activities.sort(
      (a, b) =>
        new Date(b.timestamp as Date).getTime() -
        new Date(a.timestamp as Date).getTime()
    );

    return NextResponse.json(sortedActivities.slice(0, 15));
  } catch (error) {
    console.error('Failed to fetch activity feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity feed' },
      { status: 500 }
    );
  }
}
