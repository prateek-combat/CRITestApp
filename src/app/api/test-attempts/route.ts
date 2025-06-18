import { NextResponse } from 'next/server';
import { PrismaClient, Prisma, QuestionCategory } from '@prisma/client';
import { enhancedEmailService as emailService } from '@/lib/enhancedEmailService';
import { sendTestCompletionCandidateEmail } from '@/lib/email';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

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
    console.error(
      '[API /api/test-attempts GET] Failed to fetch test attempts:',
      error
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
      answers,
      questionStartTime,
      status,
      proctoringEnabled,
      proctoringEvents,
      tabSwitches,
      violations,
    } = body;

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
          proctoringEnabled: proctoringEnabled ?? true,
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
          console.warn(
            `Encountered unexpected category: ${category} for question ${q.id}`
          );
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

      // Send admin email notification (async, don't wait for completion)
      emailService
        .sendTestCompletionNotification({
          testId: invitation.test.id,
          testAttemptId: existingAttempt.id,
          candidateId: existingAttempt.id,
          candidateEmail: invitation.candidateEmail || 'unknown@example.com',
          candidateName: invitation.candidateName || 'Unknown Candidate',
          score: correctAnswers,
          maxScore: totalQuestions,
          completedAt: new Date(submissionTimeEpoch),
          timeTaken: Math.floor(
            (submissionTimeEpoch - existingAttempt.startedAt.getTime()) / 1000
          ),
          answers: submittedAnswersData,
        })
        .catch((error: any) => {
          console.error(
            'Failed to send test completion email notification to admins:',
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
        console.error(
          'Failed to send test completion confirmation email to candidate:',
          error
        );
        // Don't fail the test submission if email fails
      });

      return NextResponse.json(updatedAttempt);
    }

    return NextResponse.json(existingAttempt);
  } catch (error) {
    console.error(
      '[API /api/test-attempts POST] Failed to handle test attempt:',
      error
    );
    return NextResponse.json(
      { message: 'Failed to handle test attempt', error: String(error) },
      { status: 500 }
    );
  }
}
