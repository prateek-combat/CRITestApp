import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/proctor/strikes/[attemptId] - Get strike status for a test attempt
export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    const { attemptId } = params;

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    // Check if this is a regular test attempt or public test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        copyEventCount: true,
        maxCopyEventsAllowed: true,
        status: true,
        terminationReason: true,
      },
    });

    if (testAttempt) {
      // Regular test attempt
      const strikeLevel = testAttempt.copyEventCount;
      const maxAllowed = testAttempt.maxCopyEventsAllowed;
      const isTerminated = testAttempt.status === 'TERMINATED';

      return NextResponse.json({
        success: true,
        attemptId,
        strikeCount: strikeLevel,
        maxAllowed,
        isTerminated,
        terminationReason: testAttempt.terminationReason,
        strikeLevel:
          strikeLevel === 0
            ? 'none'
            : strikeLevel === 1
              ? 'first'
              : strikeLevel === 2
                ? 'second'
                : 'terminated',
      });
    }

    // Check if it's a public test attempt
    const publicAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        copyEventCount: true,
        maxCopyEventsAllowed: true,
        status: true,
        terminationReason: true,
      },
    });

    if (publicAttempt) {
      // Public test attempt
      const strikeLevel = publicAttempt.copyEventCount;
      const maxAllowed = publicAttempt.maxCopyEventsAllowed;
      const isTerminated = publicAttempt.status === 'TERMINATED';

      return NextResponse.json({
        success: true,
        attemptId,
        strikeCount: strikeLevel,
        maxAllowed,
        isTerminated,
        terminationReason: publicAttempt.terminationReason,
        strikeLevel:
          strikeLevel === 0
            ? 'none'
            : strikeLevel === 1
              ? 'first'
              : strikeLevel === 2
                ? 'second'
                : 'terminated',
      });
    }

    return NextResponse.json(
      { error: 'Test attempt not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error getting strike status:', error);
    return NextResponse.json(
      { error: 'Failed to get strike status' },
      { status: 500 }
    );
  }
}
