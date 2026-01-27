import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const attemptId = searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId parameter is required' },
        { status: 400 }
      );
    }

    // Check if this is a regular test attempt first
    let testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        riskScore: true,
        startedAt: true,
        completedAt: true,
        videoRecordingUrl: true,
      },
    });

    let events: any[] = [];

    if (testAttempt) {
      // Regular test attempt - get regular proctor events
      events = await prisma.proctorEvent.findMany({
        where: {
          attemptId,
        },
        orderBy: {
          ts: 'asc',
        },
      });
    } else {
      // Check if it's a public test attempt
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          riskScore: true,
          startedAt: true,
          completedAt: true,
          videoRecordingUrl: true,
        },
      });

      if (publicAttempt) {
        testAttempt = publicAttempt;
        // Get public proctor events
        events = await prisma.publicProctorEvent.findMany({
          where: {
            attemptId,
          },
          orderBy: {
            ts: 'asc',
          },
        });
      }
    }

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Group events by type for summary
    const eventSummary = events.reduce(
      (acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Calculate timeline data
    const timeline = events.map((event) => ({
      id: event.id,
      type: event.type,
      timestamp: event.ts,
      extra: event.extra,
      // Calculate time offset from test start
      offsetSeconds: testAttempt.startedAt
        ? Math.floor(
            (new Date(event.ts).getTime() -
              new Date(testAttempt.startedAt).getTime()) /
              1000
          )
        : 0,
    }));

    return NextResponse.json({
      testAttempt,
      events: timeline,
      summary: eventSummary,
      totalEvents: events.length,
    });
  } catch (error) {
    console.error('Error fetching proctor events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch proctor events' },
      { status: 500 }
    );
  }
}
