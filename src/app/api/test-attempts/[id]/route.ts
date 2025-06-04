import { NextResponse } from 'next/server';
import { PrismaClient, TestAttemptStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/test-attempts/{id}:
 *   get:
 *     summary: Get a test attempt by ID
 *     description: Retrieves a test attempt and its details by ID.
 *     tags:
 *       - Test Attempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     responses:
 *       200:
 *         description: Test attempt found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAttempt'
 *       404:
 *         description: Test attempt not found.
 *       500:
 *         description: Failed to fetch test attempt.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            questions: {
              select: {
                id: true,
                promptText: true,
                promptImageUrl: true,
                timerSeconds: true,
                answerOptions: true,
                correctAnswerIndex: true,
                sectionTag: true,
              },
            },
          },
        },
        submittedAnswers: {
          select: {
            id: true,
            questionId: true,
            selectedAnswerIndex: true,
            isCorrect: true,
          },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(testAttempt);
  } catch (error) {
    console.error(
      '[API /api/test-attempts/[id] GET] Failed to fetch test attempt:',
      error
    );
    return NextResponse.json(
      { message: 'Failed to fetch test attempt', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/test-attempts/{id}:
 *   patch:
 *     summary: Update a test attempt
 *     description: Updates a test attempt's details.
 *     tags:
 *       - Test Attempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test attempt ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTestAttemptInput'
 *     responses:
 *       200:
 *         description: Test attempt updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestAttempt'
 *       404:
 *         description: Test attempt not found.
 *       500:
 *         description: Failed to update test attempt.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { answers, questionStartTime, status } = body;

    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            questions: {
              select: {
                id: true,
                correctAnswerIndex: true,
                timerSeconds: true,
              },
            },
          },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    if (status === 'COMPLETED') {
      // Calculate score
      let correctAnswers = 0;
      const submittedAnswersData: Prisma.SubmittedAnswerCreateManyTestAttemptInput[] =
        [];

      for (const [questionId, selectedAnswerIndex] of Object.entries(answers)) {
        const question = testAttempt.test.questions.find(
          (q) => q.id === questionId
        );
        if (!question) continue;

        const isCorrect =
          (selectedAnswerIndex as number) === question.correctAnswerIndex;
        if (isCorrect) correctAnswers++;

        submittedAnswersData.push({
          questionId,
          selectedAnswerIndex: selectedAnswerIndex as number,
          isCorrect,
          timeTakenSeconds: 0,
        });
      }

      const totalQuestions = testAttempt.test.questions.length;
      const rawScore = correctAnswers;
      const percentile = (correctAnswers / totalQuestions) * 100;

      // Update test attempt with results
      const updatedAttempt = await prisma.testAttempt.update({
        where: { id },
        data: {
          completedAt: new Date(),
          status: 'COMPLETED',
          rawScore,
          percentile,
          submittedAnswers: {
            createMany: {
              data: submittedAnswersData,
            },
          },
        },
      });

      return NextResponse.json(updatedAttempt);
    }

    return NextResponse.json(testAttempt);
  } catch (error) {
    console.error(
      '[API /api/test-attempts/[id] PATCH] Failed to update test attempt:',
      error
    );
    return NextResponse.json(
      { message: 'Failed to update test attempt', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/test-attempts/{id}:
 *   delete:
 *     summary: Cancel a test attempt
 *     description: Marks a test attempt as cancelled. Only allowed for in-progress attempts.
 *     tags:
 *       - TestAttempts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Test attempt cancelled successfully.
 *       404:
 *         description: Test attempt not found.
 *       409:
 *         description: Cannot cancel completed test attempt.
 *       500:
 *         description: Failed to cancel test attempt.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    if (testAttempt.status === 'COMPLETED') {
      return NextResponse.json(
        { message: 'Cannot cancel a completed test attempt' },
        { status: 409 }
      );
    }

    // Update test attempt to mark as cancelled
    const updatedTestAttempt = await prisma.testAttempt.update({
      where: { id },
      data: {
        status: TestAttemptStatus.ABANDONED,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Test attempt cancelled successfully',
      testAttempt: updatedTestAttempt,
    });
  } catch (error) {
    console.error(
      `[API /api/test-attempts/${id} DELETE] Failed to cancel test attempt:`,
      error
    );
    return NextResponse.json(
      { message: 'Failed to cancel test attempt', error: String(error) },
      { status: 500 }
    );
  }
}
