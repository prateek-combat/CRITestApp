import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getQueueStatus } from '@/lib/queue';
import { withLogging } from '@/lib/logging-middleware';
import { apiLogger, authLogger } from '@/lib/logger';

async function handleGet(request: NextRequest) {
  const timer = apiLogger.startTimer('queue_status_request');

  try {
    // Check authentication
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

    authLogger.info('Queue status accessed', {
      userId: session.user.email,
      userRole: session.user.role,
      action: 'queue_status_view',
    });

    // Get queue status
    const status = await getQueueStatus();

    timer.done('Queue status retrieved successfully', {
      endpoint: 'GET /api/admin/queue-status',
      userId: session.user.email,
      waiting: status.waiting,
      active: status.active,
      completed: status.completed,
      failed: status.failed,
    });

    return NextResponse.json({
      success: true,
      status,
      message: 'Queue status retrieved successfully',
    });
  } catch (error) {
    timer.done('Queue status request failed', {
      endpoint: 'GET /api/admin/queue-status',
      error: (error as Error).message,
    });

    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}

export const GET = withLogging(handleGet, '/api/admin/queue-status');
