import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Save individual answer during public test progression
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

    // Get the public test attempt to verify it exists and get question details
    const attempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        publicLink: {
          include: {
            test: {
              include: {
                questions: {
                  where: { id: questionId },
                },
              },
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
        { error: 'Public test attempt not found' },
        { status: 404 }
      );
    }

    const question = attempt.publicLink.test.questions[0];
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
      const updatedAnswer = await prisma.publicSubmittedAnswer.update({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
        data: {
          selectedAnswerIndex,
          isCorrect,
          timeTakenSeconds: timeTakenSeconds || 0,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        updated: true,
      });
    } else {
      // Create new answer
      const newAnswer = await prisma.publicSubmittedAnswer.create({
        data: {
          attemptId,
          questionId,
          selectedAnswerIndex,
          isCorrect,
          timeTakenSeconds: timeTakenSeconds || 0,
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        created: true,
      });
    }
  } catch (error) {
    console.error('Error saving individual public answer:', error);
    return NextResponse.json(
      { error: 'Failed to save answer' },
      { status: 500 }
    );
  }
}
