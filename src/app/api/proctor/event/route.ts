import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ProctorEventPayload {
  attemptId: string;
  events: Array<{
    type: string;
    timestamp: number;
    extra?: Record<string, any>;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProctorEventPayload = await request.json();
    const { attemptId, events } = body;

    if (!attemptId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid request payload' },
        { status: 400 }
      );
    }

    // Verify that the test attempt exists (check both regular and public attempts)
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    const publicTestAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!testAttempt && !publicTestAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Create proctor events in the appropriate table
    if (testAttempt) {
      // Regular test attempt - use ProctorEvent table
      const proctorEvents = events.map((event) => ({
        attemptId,
        type: event.type,
        ts: new Date(event.timestamp),
        extra: event.extra || undefined,
      }));

      await prisma.proctorEvent.createMany({
        data: proctorEvents,
        skipDuplicates: true,
      });
    } else if (publicTestAttempt) {
      // Public test attempt - use PublicProctorEvent table
      const publicProctorEvents = events.map((event) => ({
        attemptId,
        type: event.type,
        ts: new Date(event.timestamp),
        extra: event.extra || undefined,
      }));

      await prisma.publicProctorEvent.createMany({
        data: publicProctorEvents,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      eventsCreated: events.length,
    });
  } catch (error) {
    console.error('Error creating proctor events:', error);
    return NextResponse.json(
      { error: 'Failed to create proctor events' },
      { status: 500 }
    );
  }
}
