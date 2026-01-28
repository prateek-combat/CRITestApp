import { NextResponse } from 'next/server';
import { Prisma, QuestionCategory } from '@prisma/client';
import {
  sendTestCompletionCandidateEmail,
  sendTestCompletionAdminNotification,
} from '@/lib/email';
import { logger } from '@/lib/logger';

import { prisma } from '@/lib/prisma';
import { notifyTestResultsWebhook } from '@/lib/test-webhook';
import { isMaintenanceMode, maintenanceErrorPayload } from '@/lib/maintenance';

/**
 * @swagger
 * /api/test-attempts:
 *   get:
 *     summary: Retrieve a list of test attempts
 *     description: Fetches all test attempts with related test and invitation data.
 *     tags:
 *       - TestAttempts
 *     responses:
 *       200:
 *         description: A list of test attempts.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TestAttempt'
 *       500:
 *         description: Failed to fetch test attempts.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url, 'http://localhost');
    const invitationId = url.searchParams.get('invitationId');

    let testAttempts;

    const includeOptions = {
      test: {
        select: {
          id: true,
          title: true,
        },
      },
      invitation: {
        select: {
          id: true,
          candidateEmail: true,
          candidateName: true,
        },
      },
      submittedAnswers: {
        select: {
          id: true,
          questionId: true,
          selectedAnswerIndex: true,
          isCorrect: true,
          timeTakenSeconds: true, // Include if you want to fetch it
        },
      },
    };

    if (invitationId) {
      testAttempts = await prisma.testAttempt.findMany({
        where: {
          invitationId,
        },
        orderBy: {
          startedAt: 'desc' as const,
        },
        take: 1,
        include: includeOptions,
      });
    } else {
      testAttempts = await prisma.testAttempt.findMany({
        orderBy: {
          startedAt: 'desc' as const,
        },
        include: includeOptions,
      });
    }

    return NextResponse.json(
      invitationId && testAttempts.length > 0 ? testAttempts[0] : testAttempts
    );
  } catch (error) {
    const url = new URL(request.url, 'http://localhost');
    const invitationId = url.searchParams.get('invitationId');

    logger.error(
      'Failed to fetch test attempts',
      {
        operation: 'get_test_attempts',
        invitationId: invitationId || undefined,
        method: 'GET',
        path: '/api/test-attempts',
      },
      error as Error
    );
    return NextResponse.json(
      { message: 'Failed to fetch test attempts', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/test-attempts:
 *   post:
 *     summary: Create or update a test attempt
 *     description: Creates a new test attempt or updates an existing one.
 *     tags:
 *       - Test Attempts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestAttemptInput'
 *     responses:
 *       201:
 *         description: Test attempt created or updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAttempt'
 *       400:
 *         description: Bad request (e.g., missing required fields).
 *       404:
 *         description: Invitation not found.
 *       500:
 *         description: Failed to create/update test attempt.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      invitationId,
      jobProfileInvitationId,
      type,
      answers,
      questionStartTime,
      status,
      proctoringEnabled,
      proctoringEvents,
      tabSwitches,
      violations,
    } = body;

    // Handle job profile invitations
    if (jobProfileInvitationId || type === 'job-profile') {
      const targetInvitationId = jobProfileInvitationId || invitationId;

      if (!targetInvitationId) {
        return NextResponse.json(
          { message: 'Missing required field: jobProfileInvitationId' },
          { status: 400 }
        );
      }

      // Get the job profile invitation and related tests
      const jobProfileInvitation = await prisma.jobProfileInvitation.findUnique(
        {
          where: { id: targetInvitationId },
          include: {
            jobProfile: {
              include: {
                testWeights: {
                  orderBy: { createdAt: 'asc' },
                  include: {
                    test: {
                      include: {
                        questions: {
                          select: {
                            id: true,
                            correctAnswerIndex: true,
                            timerSeconds: true,
                            category: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            testAttempts: {
              select: {
                id: true,
                status: true,
                testId: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        }
      );

      if (!jobProfileInvitation) {
        return NextResponse.json(
          { message: 'Job profile invitation not found' },
          { status: 404 }
        );
      }

      if (jobProfileInvitation.jobProfile.testWeights.length === 0) {
        return NextResponse.json(
          { message: 'No tests assigned to this job profile' },
          { status: 400 }
        );
      }

      if (
        jobProfileInvitation.status === 'COMPLETED' ||
        jobProfileInvitation.status === 'CANCELLED'
      ) {
        return NextResponse.json(
          { message: 'This invitation is no longer valid' },
          { status: 400 }
        );
      }

      const orderedTestWeights = jobProfileInvitation.jobProfile.testWeights;
      const attemptStatusByTestId = new Map(
        jobProfileInvitation.testAttempts.map((attempt) => [
          attempt.testId,
          attempt,
        ])
      );
      const inProgressAttemptMeta = jobProfileInvitation.testAttempts.find(
        (attempt) => attempt.status === 'IN_PROGRESS'
      );
      const completionRequested = status === 'COMPLETED';

      // If this is a new attempt or resume request
      if (!completionRequested) {
        if (inProgressAttemptMeta) {
          const activeAttempt = await prisma.testAttempt.findUnique({
            where: { id: inProgressAttemptMeta.id },
          });

          if (activeAttempt) {
            return NextResponse.json(activeAttempt);
          }
        }

        const nextTestWeight = orderedTestWeights.find((weight) => {
          const attempt = attemptStatusByTestId.get(weight.test.id);
          return !attempt || attempt.status !== 'COMPLETED';
        });

        if (!nextTestWeight) {
          return NextResponse.json(
            { message: 'All tests for this job profile are already completed' },
            { status: 400 }
          );
        }

        if (isMaintenanceMode()) {
          return NextResponse.json(maintenanceErrorPayload, { status: 503 });
        }

        const newAttempt = await createJobProfileAttempt({
          jobProfileInvitation,
          targetInvitationId,
          test: nextTestWeight.test,
          proctoringEnabled,
          proctoringEvents,
          tabSwitches,
        });

        if (jobProfileInvitation.status !== 'OPENED') {
          await prisma.jobProfileInvitation.update({
            where: { id: targetInvitationId },
            data: { status: 'OPENED' },
          });
        }

        return NextResponse.json(newAttempt, { status: 201 });
      }

      // Completion flow: finalize the currently active test
      const attemptToCompleteMeta =
        inProgressAttemptMeta ||
        [...jobProfileInvitation.testAttempts]
          .reverse()
          .find((attempt) => attempt.status !== 'COMPLETED');

      if (!attemptToCompleteMeta) {
        return NextResponse.json(
          { message: 'No active test attempt found for this invitation' },
          { status: 400 }
        );
      }

      const existingAttempt = await prisma.testAttempt.findUnique({
        where: { id: attemptToCompleteMeta.id },
      });

      if (!existingAttempt) {
        return NextResponse.json(
          { message: 'Test attempt could not be loaded' },
          { status: 404 }
        );
      }

      const currentTest = orderedTestWeights.find(
        (weight) => weight.test.id === existingAttempt.testId
      )?.test;

      if (!currentTest) {
        return NextResponse.json(
          { message: 'Test configuration missing for this attempt' },
          { status: 400 }
        );
      }

      let correctAnswers = 0;
      const submittedAnswersData = [];
      const submissionTimeEpoch = new Date().getTime();

      const finalCategorySubScores: Record<
        QuestionCategory,
        { correct: number; total: number }
      > = {
        LOGICAL: { correct: 0, total: 0 },
        VERBAL: { correct: 0, total: 0 },
        NUMERICAL: { correct: 0, total: 0 },
        ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
        OTHER: { correct: 0, total: 0 },
      };

      currentTest.questions.forEach((q) => {
        const category = q.category as QuestionCategory;
        if (finalCategorySubScores[category]) {
          finalCategorySubScores[category].total++;
        }
      });

      for (const question of currentTest.questions) {
        const questionId = question.id;
        const clientAnswerData = answers[questionId];
        const category = question.category as QuestionCategory;

        if (clientAnswerData && clientAnswerData.answerIndex !== undefined) {
          const selectedAnswerIndexValue = clientAnswerData.answerIndex;
          const isCorrect =
            selectedAnswerIndexValue === question.correctAnswerIndex;

          if (isCorrect) {
            correctAnswers++;
            if (finalCategorySubScores[category]) {
              finalCategorySubScores[category].correct++;
            }
          }

          let timeTakenSeconds = clientAnswerData.timeTaken ?? 0;

          if (
            questionStartTime &&
            questionStartTime[questionId] &&
            questionStartTime[questionId].epoch
          ) {
            const qStartTimeEpoch = questionStartTime[questionId].epoch;
            const serverCalculatedTimeTaken = Math.max(
              0,
              Math.floor((submissionTimeEpoch - qStartTimeEpoch) / 1000)
            );
            if (clientAnswerData.timeTaken === undefined) {
              timeTakenSeconds = serverCalculatedTimeTaken;
            }
          }

          submittedAnswersData.push({
            questionId,
            selectedAnswerIndex: selectedAnswerIndexValue,
            isCorrect,
            timeTakenSeconds,
            submittedAt: new Date(),
          });
        }
      }

      const totalQuestions = currentTest.questions.length;
      const rawScore = correctAnswers;
      const percentile =
        totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      const updatedAttempt = await prisma.testAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          completedAt: new Date(submissionTimeEpoch),
          status: 'COMPLETED',
          rawScore,
          percentile,
          categorySubScores: finalCategorySubScores as Prisma.JsonObject,
          proctoringEndedAt: new Date(),
          proctoringEvents: proctoringEvents
            ? JSON.stringify(proctoringEvents)
            : undefined,
          tabSwitches: tabSwitches ?? existingAttempt.tabSwitches,
          submittedAnswers: {
            createMany: {
              data: submittedAnswersData.map((sa) => ({ ...sa })),
            },
          },
        },
        include: { submittedAnswers: true },
      });

      attemptStatusByTestId.set(existingAttempt.testId, {
        id: existingAttempt.id,
        status: 'COMPLETED',
        testId: existingAttempt.testId,
      });

      const nextTestWeight = orderedTestWeights.find((weight) => {
        if (weight.test.id === existingAttempt.testId) {
          return false;
        }
        const attempt = attemptStatusByTestId.get(weight.test.id);
        return !attempt || attempt.status !== 'COMPLETED';
      });

      const invitationStatusUpdate = nextTestWeight ? 'OPENED' : 'COMPLETED';

      await prisma.jobProfileInvitation.update({
        where: { id: targetInvitationId },
        data: { status: invitationStatusUpdate },
      });

      await prisma.invitation.update({
        where: { id: existingAttempt.invitationId },
        data: { status: 'COMPLETED' },
      });

      sendTestCompletionAdminNotification({
        testId: currentTest.id,
        testAttemptId: existingAttempt.id,
        candidateEmail:
          jobProfileInvitation.candidateEmail || 'unknown@example.com',
        candidateName:
          jobProfileInvitation.candidateName || 'Unknown Candidate',
        score: correctAnswers,
        maxScore: totalQuestions,
        completedAt: new Date(submissionTimeEpoch),
        timeTaken: Math.floor(
          (submissionTimeEpoch - existingAttempt.startedAt.getTime()) / 1000
        ),
        testTitle: currentTest.title,
      }).catch((error: any) => {
        logger.error(
          'Failed to send admin notification email',
          {
            operation: 'send_admin_notification',
            testId: currentTest.id,
            candidateEmail: jobProfileInvitation.candidateEmail,
            method: 'POST',
            path: '/api/test-attempts',
          },
          error
        );
      });

      sendTestCompletionCandidateEmail({
        candidateEmail:
          jobProfileInvitation.candidateEmail || 'unknown@example.com',
        candidateName:
          jobProfileInvitation.candidateName || 'Unknown Candidate',
        testTitle: currentTest.title || 'Assessment',
        completedAt: new Date(submissionTimeEpoch),
        companyName: 'Combat Robotics India',
      }).catch((error: any) => {
        logger.error(
          'Failed to send candidate confirmation email',
          {
            operation: 'send_candidate_confirmation',
            testId: currentTest.id,
            candidateEmail: jobProfileInvitation.candidateEmail,
            method: 'POST',
            path: '/api/test-attempts',
          },
          error
        );
      });

      notifyTestResultsWebhook({
        testAttemptId: updatedAttempt.id,
        testId: currentTest.id,
        testTitle: currentTest.title,
        invitationId: existingAttempt.invitationId,
        jobProfileInvitationId: targetInvitationId,
        candidateEmail:
          updatedAttempt.candidateEmail || jobProfileInvitation.candidateEmail,
        candidateName:
          updatedAttempt.candidateName || jobProfileInvitation.candidateName,
        status: updatedAttempt.status,
        rawScore,
        maxScore: totalQuestions,
        percentile,
        categorySubScores:
          (updatedAttempt.categorySubScores as Record<
            string,
            unknown
          > | null) ?? null,
        startedAt: updatedAttempt.startedAt,
        completedAt: updatedAttempt.completedAt,
        meta: {
          type: 'job_profile',
          proctoringEnabled: updatedAttempt.proctoringEnabled,
        },
      }).catch(() => {});

      return NextResponse.json(
        nextTestWeight
          ? {
              ...updatedAttempt,
              nextTestReady: true,
              nextTestId: nextTestWeight.test.id,
              nextTestTitle: nextTestWeight.test.title,
            }
          : updatedAttempt
      );
    }

    // Handle regular invitations (existing code)
    if (!invitationId) {
      return NextResponse.json(
        { message: 'Missing required field: invitationId' },
        { status: 400 }
      );
    }

    // Get the invitation and test details
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            questions: {
              select: {
                id: true,
                correctAnswerIndex: true,
                timerSeconds: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if there's an existing attempt
    const existingAttempt = await prisma.testAttempt.findFirst({
      where: { invitationId },
      orderBy: { startedAt: 'desc' },
    });

    if (existingAttempt?.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'This test has already been completed' },
        { status: 400 }
      );
    }

    if (invitation.status === 'EXPIRED' || invitation.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'This test has already been completed or has expired' },
        { status: 400 }
      );
    }

    // If this is a new attempt
    if (!existingAttempt) {
      if (isMaintenanceMode()) {
        return NextResponse.json(maintenanceErrorPayload, { status: 503 });
      }

      // Update invitation status to OPENED
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'OPENED' },
      });

      // Create new test attempt
      const newAttempt = await prisma.testAttempt.create({
        data: {
          invitationId,
          testId: invitation.test.id,
          candidateEmail: invitation.candidateEmail,
          candidateName: invitation.candidateName,
          startedAt: new Date(),
          status: 'IN_PROGRESS',
          proctoringEnabled: proctoringEnabled ?? false,
          proctoringStartedAt: proctoringEnabled ? new Date() : null,
          proctoringEvents: proctoringEvents
            ? JSON.stringify(proctoringEvents)
            : undefined,
          tabSwitches: tabSwitches ?? 0,
        },
      });

      return NextResponse.json(newAttempt, { status: 201 });
    }

    // If this is updating an existing attempt
    if (status === 'COMPLETED') {
      // Calculate score
      let correctAnswers = 0;
      const submittedAnswersData = [];
      const submissionTimeEpoch = new Date().getTime();

      // Initialize category scores
      const finalCategorySubScores: Record<
        QuestionCategory,
        { correct: number; total: number }
      > = {
        LOGICAL: { correct: 0, total: 0 },
        VERBAL: { correct: 0, total: 0 },
        NUMERICAL: { correct: 0, total: 0 },
        ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
        OTHER: { correct: 0, total: 0 },
      };

      // First, populate total questions for each category
      invitation.test.questions.forEach((q) => {
        const category = q.category as QuestionCategory;
        // Ensure the category exists in our map, which it should if prisma schema is synced with enum
        if (finalCategorySubScores[category]) {
          finalCategorySubScores[category].total++;
        } else {
          // This case should ideally not happen if QuestionCategory enum and q.category are well-managed
          logger.warn('Unexpected question category encountered', {
            operation: 'calculate_scores',
            category,
            questionId: q.id,
            method: 'POST',
            path: '/api/test-attempts',
          });
        }
      });

      for (const question of invitation.test.questions) {
        const questionId = question.id;
        const clientAnswerData = answers[questionId]; // This is { answerIndex: number, timeTaken?: number }
        const category = question.category as QuestionCategory;

        if (clientAnswerData && clientAnswerData.answerIndex !== undefined) {
          const selectedAnswerIndexValue = clientAnswerData.answerIndex;
          const isCorrect =
            selectedAnswerIndexValue === question.correctAnswerIndex;

          if (isCorrect) {
            correctAnswers++;
            if (finalCategorySubScores[category]) {
              finalCategorySubScores[category].correct++;
            }
          }

          // Calculate timeTakenSeconds
          let timeTakenSeconds = clientAnswerData.timeTaken ?? 0; // Use timeTaken from client if available

          // Fallback or override with server-calculated time if questionStartTime is available
          // This prioritizes client-side calculated time, but ensures a value if not present.
          if (
            questionStartTime &&
            questionStartTime[questionId] &&
            questionStartTime[questionId].epoch
          ) {
            const qStartTimeEpoch = questionStartTime[questionId].epoch;
            const serverCalculatedTimeTaken = Math.max(
              0,
              Math.floor((submissionTimeEpoch - qStartTimeEpoch) / 1000)
            );
            // If client didn't provide timeTaken, or if you want to enforce server calculation:
            if (clientAnswerData.timeTaken === undefined) {
              timeTakenSeconds = serverCalculatedTimeTaken;
            }
            // Or, you might choose to always use serverCalculatedTime:
            // timeTakenSeconds = serverCalculatedTimeTaken;
          }

          submittedAnswersData.push({
            questionId,
            selectedAnswerIndex: selectedAnswerIndexValue,
            isCorrect,
            timeTakenSeconds,
            submittedAt: new Date(),
          });
        } else {
          // Handle unanswered question if necessary, e.g., if it should count towards total for a category
          // Current logic correctly handles totals in the first loop over invitation.test.questions
        }
      }

      const totalQuestions = invitation.test.questions.length;
      const rawScore = correctAnswers;
      const percentile =
        totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

      // Update test attempt with results
      const updatedAttempt = await prisma.testAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          completedAt: new Date(submissionTimeEpoch),
          status: 'COMPLETED',
          rawScore,
          percentile,
          categorySubScores: finalCategorySubScores as Prisma.JsonObject,
          proctoringEndedAt: new Date(),
          proctoringEvents: proctoringEvents
            ? JSON.stringify(proctoringEvents)
            : undefined,
          tabSwitches: tabSwitches ?? existingAttempt.tabSwitches,
          submittedAnswers: {
            createMany: {
              data: submittedAnswersData.map((sa) => ({ ...sa })),
            },
          },
        },
        include: { submittedAnswers: true },
      });

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { status: 'COMPLETED' },
      });

      // Send admin notification email (async, don't wait for completion)
      sendTestCompletionAdminNotification({
        testId: invitation.test.id,
        testAttemptId: existingAttempt.id,
        candidateEmail: invitation.candidateEmail || 'unknown@example.com',
        candidateName: invitation.candidateName || 'Unknown Candidate',
        score: correctAnswers,
        maxScore: totalQuestions,
        completedAt: new Date(submissionTimeEpoch),
        timeTaken: Math.floor(
          (submissionTimeEpoch - existingAttempt.startedAt.getTime()) / 1000
        ),
        testTitle: invitation.test.title,
      }).catch((error: any) => {
        logger.error(
          'Failed to send admin notification email',
          {
            operation: 'send_admin_notification',
            testId: invitation.test.id,
            candidateEmail: invitation.candidateEmail,
            method: 'POST',
            path: '/api/test-attempts',
          },
          error
        );
        // Don't fail the test submission if email fails
      });

      // Send candidate confirmation email (async, don't wait for completion)
      sendTestCompletionCandidateEmail({
        candidateEmail: invitation.candidateEmail || 'unknown@example.com',
        candidateName: invitation.candidateName || 'Unknown Candidate',
        testTitle: invitation.test.title || 'Assessment',
        completedAt: new Date(submissionTimeEpoch),
        companyName: 'Combat Robotics India',
      }).catch((error: any) => {
        logger.error(
          'Failed to send candidate confirmation email',
          {
            operation: 'send_candidate_confirmation',
            testId: invitation.test.id,
            candidateEmail: invitation.candidateEmail,
            method: 'POST',
            path: '/api/test-attempts',
          },
          error
        );
        // Don't fail the test submission if email fails
      });

      notifyTestResultsWebhook({
        testAttemptId: updatedAttempt.id,
        testId: invitation.test.id,
        testTitle: invitation.test.title,
        invitationId,
        candidateEmail:
          updatedAttempt.candidateEmail || invitation.candidateEmail,
        candidateName: updatedAttempt.candidateName || invitation.candidateName,
        status: updatedAttempt.status,
        rawScore,
        maxScore: totalQuestions,
        percentile,
        categorySubScores:
          (updatedAttempt.categorySubScores as Record<
            string,
            unknown
          > | null) ?? null,
        startedAt: updatedAttempt.startedAt,
        completedAt: updatedAttempt.completedAt,
        meta: {
          type: 'invitation',
          proctoringEnabled: updatedAttempt.proctoringEnabled,
        },
      }).catch(() => {});

      return NextResponse.json(updatedAttempt);
    }

    return NextResponse.json(existingAttempt);
  } catch (error) {
    logger.error(
      'Failed to handle test attempt',
      {
        operation: 'handle_test_attempt',
        method: 'POST',
        path: '/api/test-attempts',
      },
      error as Error
    );
    return NextResponse.json(
      { message: 'Failed to handle test attempt', error: String(error) },
      { status: 500 }
    );
  }
}

interface JobProfileAttemptOptions {
  jobProfileInvitation: any;
  targetInvitationId: string;
  test: { id: string };
  proctoringEnabled?: boolean;
  proctoringEvents?: unknown;
  tabSwitches?: number;
}

async function createJobProfileAttempt({
  jobProfileInvitation,
  targetInvitationId,
  test,
  proctoringEnabled,
  proctoringEvents,
  tabSwitches,
}: JobProfileAttemptOptions) {
  const proxyInvitation = await prisma.invitation.create({
    data: {
      candidateEmail: jobProfileInvitation.candidateEmail,
      candidateName: jobProfileInvitation.candidateName,
      testId: test.id,
      expiresAt: jobProfileInvitation.expiresAt,
      status: 'OPENED',
      createdById: jobProfileInvitation.createdById,
    },
  });

  return prisma.testAttempt.create({
    data: {
      invitationId: proxyInvitation.id,
      jobProfileInvitationId: targetInvitationId,
      testId: test.id,
      candidateEmail: jobProfileInvitation.candidateEmail,
      candidateName: jobProfileInvitation.candidateName,
      startedAt: new Date(),
      status: 'IN_PROGRESS',
      proctoringEnabled: proctoringEnabled ?? false,
      proctoringStartedAt: proctoringEnabled ? new Date() : null,
      proctoringEvents: proctoringEvents
        ? JSON.stringify(proctoringEvents)
        : undefined,
      tabSwitches: tabSwitches ?? 0,
    },
  });
}
