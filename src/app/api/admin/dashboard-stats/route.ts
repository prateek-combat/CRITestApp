import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

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
    logger.error(
      'Failed to fetch dashboard stats',
      {
        operation: 'get_dashboard_stats',
        service: 'admin_dashboard',
        method: 'GET',
        path: '/api/admin/dashboard-stats',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
