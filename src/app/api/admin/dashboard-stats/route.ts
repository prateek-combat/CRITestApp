import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const totalTests = await prisma.test.count();
    const activeTests = await prisma.test.count({
      where: { isArchived: false },
    });
    const totalAttempts = await prisma.testAttempt.count();
    const totalInvitations = await prisma.jobProfileInvitation.count();

    return NextResponse.json({
      totalTests,
      activeTests,
      totalAttempts,
      totalInvitations,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
