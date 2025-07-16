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
      select: {
        id: true,
        copyEventCount: true,
        maxCopyEventsAllowed: true,
        status: true,
      },
    });

    const isPublicAttempt = !testAttempt;

    // Count copy events in the current batch
    const copyEvents = events.filter(
      (event: any) => event.type === 'COPY_DETECTED'
    );
    const copyCount = copyEvents.length;

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

      const newCopyCount = publicAttempt.copyEventCount + copyCount;
      const maxAllowed = publicAttempt.maxCopyEventsAllowed;
      const shouldTerminate = newCopyCount >= maxAllowed;

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

        // Update copy count and check for termination
        if (copyCount > 0) {
          const updatedAttempt = await tx.publicTestAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
              ...(shouldTerminate && {
                status: 'TERMINATED',
                terminationReason: `Test terminated due to ${newCopyCount} copy violations (limit: ${maxAllowed})`,
                completedAt: new Date(),
              }),
            },
          });

          return {
            success: true,
            eventsStored: events.length,
            terminated: shouldTerminate,
            reason: shouldTerminate
              ? `Test terminated due to ${newCopyCount} copy violations`
              : null,
            copyCount: newCopyCount,
            maxAllowed,
            updatedAttempt,
          };
        }

        return {
          success: true,
          eventsStored: events.length,
          terminated: false,
          copyCount: newCopyCount,
          maxAllowed,
        };
      });

      if (result.terminated) {
        return NextResponse.json(result);
      }

      return NextResponse.json({
        success: true,
        eventsStored: events.length,
        copyCount: result.copyCount,
        maxAllowed: result.maxAllowed,
        strikeWarning: result.copyCount > 0,
      });
    } else {
      // Check if test is already terminated
      if (testAttempt.status === 'TERMINATED') {
        return NextResponse.json(
          { error: 'Test attempt is already terminated' },
          { status: 400 }
        );
      }

      const newCopyCount = testAttempt.copyEventCount + copyCount;
      const maxAllowed = testAttempt.maxCopyEventsAllowed;
      const shouldTerminate = newCopyCount >= maxAllowed;

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

        // Update copy count and check for termination
        if (copyCount > 0) {
          const updatedAttempt = await tx.testAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
              ...(shouldTerminate && {
                status: 'TERMINATED',
                terminationReason: `Test terminated due to ${newCopyCount} copy violations (limit: ${maxAllowed})`,
                completedAt: new Date(),
              }),
            },
          });

          return {
            success: true,
            eventsStored: events.length,
            terminated: shouldTerminate,
            reason: shouldTerminate
              ? `Test terminated due to ${newCopyCount} copy violations`
              : null,
            copyCount: newCopyCount,
            maxAllowed,
            updatedAttempt,
          };
        }

        return {
          success: true,
          eventsStored: events.length,
          terminated: false,
          copyCount: newCopyCount,
          maxAllowed,
        };
      });

      if (result.terminated) {
        return NextResponse.json(result);
      }

      return NextResponse.json({
        success: true,
        eventsStored: events.length,
        copyCount: result.copyCount,
        maxAllowed: result.maxAllowed,
        strikeWarning: result.copyCount > 0,
      });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to store proctor events' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
