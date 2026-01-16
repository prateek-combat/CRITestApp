import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyTestResultsWebhook } from '@/lib/test-webhook';

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

        // Update violation count and check for termination
        if (violationCount > 0) {
          const updatedAttempt = await tx.publicTestAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
              ...(shouldTerminate && {
                status: 'TERMINATED',
                terminationReason: `Test terminated due to ${newCopyCount} policy violations (limit: ${maxAllowed})`,
                completedAt: new Date(),
              }),
            },
          });

          return {
            success: true,
            eventsStored: events.length,
            terminated: shouldTerminate,
            reason: shouldTerminate
              ? `Test terminated due to ${newCopyCount} policy violations`
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
        await sendTerminationWebhook({ attemptId, isPublic: true });
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

      const newCopyCount = testAttempt.copyEventCount + violationCount;
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

        // Update violation count and check for termination
        if (violationCount > 0) {
          const updatedAttempt = await tx.testAttempt.update({
            where: { id: attemptId },
            data: {
              copyEventCount: newCopyCount,
              ...(shouldTerminate && {
                status: 'TERMINATED',
                terminationReason: `Test terminated due to ${newCopyCount} policy violations (limit: ${maxAllowed})`,
                completedAt: new Date(),
              }),
            },
          });

          return {
            success: true,
            eventsStored: events.length,
            terminated: shouldTerminate,
            reason: shouldTerminate
              ? `Test terminated due to ${newCopyCount} policy violations`
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
        await sendTerminationWebhook({ attemptId, isPublic: false });
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

async function sendTerminationWebhook({
  attemptId,
  isPublic,
}: {
  attemptId: string;
  isPublic: boolean;
}) {
  try {
    if (isPublic) {
      const attempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          candidateEmail: true,
          candidateName: true,
          rawScore: true,
          percentile: true,
          categorySubScores: true,
          startedAt: true,
          completedAt: true,
          publicLinkId: true,
          publicLink: {
            select: {
              test: {
                select: {
                  id: true,
                  title: true,
                  questions: { select: { id: true } },
                },
              },
            },
          },
        },
      });

      if (!attempt?.publicLink?.test) {
        return;
      }

      await notifyTestResultsWebhook({
        testAttemptId: attempt.id,
        testId: attempt.publicLink.test.id,
        testTitle: attempt.publicLink.test.title,
        candidateEmail: attempt.candidateEmail,
        candidateName: attempt.candidateName,
        status: 'TERMINATED',
        rawScore: attempt.rawScore,
        maxScore: attempt.publicLink.test.questions?.length ?? null,
        percentile: attempt.percentile,
        categorySubScores:
          (attempt.categorySubScores as Record<string, unknown> | null) ?? null,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        meta: {
          type: 'public',
          publicLinkId: attempt.publicLinkId,
          terminatedBy: 'proctor',
        },
      });
      return;
    }

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        testId: true,
        test: {
          select: {
            title: true,
            questions: { select: { id: true } },
          },
        },
        invitationId: true,
        jobProfileInvitationId: true,
        candidateEmail: true,
        candidateName: true,
        rawScore: true,
        percentile: true,
        categorySubScores: true,
        startedAt: true,
        completedAt: true,
        proctoringEnabled: true,
      },
    });

    if (!attempt?.test) {
      return;
    }

    const metaType = attempt.jobProfileInvitationId
      ? 'job_profile'
      : 'invitation';

    await notifyTestResultsWebhook({
      testAttemptId: attempt.id,
      testId: attempt.test.id,
      testTitle: attempt.test.title,
      invitationId: attempt.invitationId,
      jobProfileInvitationId: attempt.jobProfileInvitationId,
      candidateEmail: attempt.candidateEmail,
      candidateName: attempt.candidateName,
      status: 'TERMINATED',
      rawScore: attempt.rawScore,
      maxScore: attempt.test.questions?.length ?? null,
      percentile: attempt.percentile,
      categorySubScores:
        (attempt.categorySubScores as Record<string, unknown> | null) ?? null,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      meta: {
        type: metaType,
        terminatedBy: 'proctor',
        proctoringEnabled: attempt.proctoringEnabled,
      },
    });
  } catch (error) {
    console.error('Failed to send termination webhook payload', error);
  }
}
