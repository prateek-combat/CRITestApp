import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const STRIKE_EVENT_TYPES = new Set([
  'COPY_DETECTED',
  'TAB_HIDDEN',
  'WINDOW_BLUR',
  'MOUSE_LEFT_WINDOW',
  'DEVTOOLS_DETECTED',
  'DEVTOOLS_SHORTCUT',
  'F12_PRESSED',
]);

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
      select: {
        id: true,
        copyEventCount: true,
        maxCopyEventsAllowed: true,
        status: true,
      },
    });

    const isPublicAttempt = !testAttempt;

    // Count strike-worthy events in the current batch
    const violationEvents = events.filter((event: any) =>
      STRIKE_EVENT_TYPES.has(event.type)
    );
    const violationCount = violationEvents.length;

    if (isPublicAttempt) {
      // Check if public test attempt exists and get current copy count
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          copyEventCount: true,
          maxCopyEventsAllowed: true,
          status: true,
        },
      });

      if (!publicAttempt) {
        return NextResponse.json(
          { error: 'Test attempt not found' },
          { status: 404 }
        );
      }

      // Check if test is already terminated
      if (publicAttempt.status === 'TERMINATED') {
        return NextResponse.json(
          { error: 'Test attempt is already terminated' },
          { status: 400 }
        );
      }

      const newCopyCount = publicAttempt.copyEventCount + violationCount;
      const maxAllowed = publicAttempt.maxCopyEventsAllowed;

      // Use transaction for atomic operations
      const result = await prisma.$transaction(async (tx) => {
        // Store events for public test attempt
        const proctorEvents = events.map((event: any) => ({
          attemptId,
          type: event.type,
          ts: new Date(event.timestamp),
          extra: event.extra || {},
        }));

        await tx.publicProctorEvent.createMany({
          data: proctorEvents,
          skipDuplicates: true,
        });

        let updatedCopyCount = publicAttempt.copyEventCount;

        if (violationCount > 0) {
          const updatedAttempt = await tx.publicTestAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
            },
          });
          updatedCopyCount = updatedAttempt.copyEventCount;
        }

        return {
          success: true,
          eventsStored: events.length,
          copyCount: updatedCopyCount,
          maxAllowed,
        };
      });

      return NextResponse.json({
        success: true,
        eventsStored: events.length,
        copyCount: result.copyCount,
        maxAllowed: result.maxAllowed,
        strikeWarning: violationCount > 0,
      });
    } else {
      // Check if test is already terminated
      if (testAttempt.status === 'TERMINATED') {
        return NextResponse.json(
          { error: 'Test attempt is already terminated' },
          { status: 400 }
        );
      }

      const newCopyCount = testAttempt.copyEventCount + violationCount;
      const maxAllowed = testAttempt.maxCopyEventsAllowed;

      // Use transaction for atomic operations
      const result = await prisma.$transaction(async (tx) => {
        // Store events for regular test attempt
        const proctorEvents = events.map((event: any) => ({
          attemptId,
          type: event.type,
          ts: new Date(event.timestamp),
          extra: event.extra || {},
        }));

        await tx.proctorEvent.createMany({
          data: proctorEvents,
          skipDuplicates: true,
        });

        let updatedCopyCount = testAttempt.copyEventCount;

        if (violationCount > 0) {
          const updatedAttempt = await tx.testAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
            },
          });
          updatedCopyCount = updatedAttempt.copyEventCount;
        }

        return {
          success: true,
          eventsStored: events.length,
          copyCount: updatedCopyCount,
          maxAllowed,
        };
      });

      return NextResponse.json({
        success: true,
        eventsStored: events.length,
        copyCount: result.copyCount,
        maxAllowed: result.maxAllowed,
        strikeWarning: violationCount > 0,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store proctor events' },
      { status: 500 }
    );
  }
}
