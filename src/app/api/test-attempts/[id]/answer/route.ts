import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Save individual answer during test progression
 * This allows saving answers as the user progresses, not just at the end
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;
    const { questionId, selectedAnswerIndex, timeTakenSeconds } =
      await request.json();

    if (!questionId || selectedAnswerIndex === undefined) {
      return NextResponse.json(
        { error: 'questionId and selectedAnswerIndex are required' },
        { status: 400 }
      );
    }

    // Get the test attempt to verify it exists and get question details
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              where: { id: questionId },
            },
          },
        },
        submittedAnswers: {
          where: { questionId },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    const question = attempt.test.questions[0];
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Calculate if the answer is correct
    const isCorrect =
      question.correctAnswerIndex !== null
        ? selectedAnswerIndex === question.correctAnswerIndex
        : null;

    // Check if answer already exists (update) or create new one
    const existingAnswer = attempt.submittedAnswers[0];

    if (existingAnswer) {
      // Update existing answer
      const updatedAnswer = await prisma.submittedAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedAnswerIndex,
          isCorrect,
          timeTakenSeconds: timeTakenSeconds || 0,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        answerId: updatedAnswer.id,
        updated: true,
      });
    } else {
      // Create new answer
      const newAnswer = await prisma.submittedAnswer.create({
        data: {
          testAttemptId: attemptId,
          questionId,
          selectedAnswerIndex,
          isCorrect,
          timeTakenSeconds: timeTakenSeconds || 0,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        answerId: newAnswer.id,
        created: true,
      });
    }
  } catch (error) {
    console.error('Error saving individual answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
