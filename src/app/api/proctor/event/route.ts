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

    // Verify that the test attempt exists
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Create proctor events
    const proctorEvents = events.map((event) => ({
      attemptId,
      type: event.type,
      ts: new Date(event.timestamp),
      extra: event.extra || null,
    }));

    await prisma.proctorEvent.createMany({
      data: proctorEvents,
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      eventsCreated: proctorEvents.length,
    });
  } catch (error) {
    console.error('Error creating proctor events:', error);
    return NextResponse.json(
      { error: 'Failed to create proctor events' },
      { status: 500 }
    );
  }
}
