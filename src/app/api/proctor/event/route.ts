import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/proctor/event - Store proctoring events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, events } = body;

    if (!attemptId || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'attemptId and events array are required' },
        { status: 400 }
      );
    }

    // Check if this is a regular test attempt or public test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true },
    });

    const isPublicAttempt = !testAttempt;

    if (isPublicAttempt) {
      // Check if public test attempt exists
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: { id: true },
      });

      if (!publicAttempt) {
        return NextResponse.json(
          { error: 'Test attempt not found' },
          { status: 404 }
        );
      }

      // Store events for public test attempt
      const proctorEvents = events.map((event: any) => ({
        attemptId,
        type: event.type,
        ts: new Date(event.timestamp),
        extra: event.extra || {},
      }));

      await prisma.publicProctorEvent.createMany({
        data: proctorEvents,
        skipDuplicates: true,
      });
    } else {
      // Store events for regular test attempt
      const proctorEvents = events.map((event: any) => ({
        attemptId,
        type: event.type,
        ts: new Date(event.timestamp),
        extra: event.extra || {},
      }));

      await prisma.proctorEvent.createMany({
        data: proctorEvents,
        skipDuplicates: true,
      });
    }

    return NextResponse.json({
      success: true,
      eventsStored: events.length,
    });
  } catch (error) {
    console.error('Error storing proctor events:', error);
    return NextResponse.json(
      { error: 'Failed to store proctor events' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
