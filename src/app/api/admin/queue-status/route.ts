import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getQueueStatus } from '@/lib/queue';

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get queue status
    const status = await getQueueStatus();

    return NextResponse.json({
      success: true,
      status,
      message: 'Queue status retrieved successfully',
    });
  } catch (error) {
    console.error('Failed to get queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status' },
      { status: 500 }
    );
  }
}
