import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Save test progress - updates current question index
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;
    const { currentQuestionIndex, tabSwitches } = await request.json();

    // Update the test attempt with current progress
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        currentQuestionIndex: currentQuestionIndex,
        ...(tabSwitches !== undefined && { tabSwitches }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      currentQuestionIndex: updatedAttempt.currentQuestionIndex,
    });
  } catch (error) {
    console.error('Error saving test progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

/**
 * Get test progress - retrieves current question index and submitted answers
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;

    // Get the test attempt with submitted answers
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        submittedAnswers: {
          orderBy: { submittedAt: 'asc' },
        },
        test: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Calculate resume information
    const totalQuestions = attempt.test.questions.length;
    const currentQuestionIndex = attempt.currentQuestionIndex || 0;
    const answeredQuestions = attempt.submittedAnswers.length;
    const canResume =
      attempt.status === 'IN_PROGRESS' && currentQuestionIndex < totalQuestions;

    return NextResponse.json({
      attemptId: attempt.id,
      currentQuestionIndex,
      totalQuestions,
      answeredQuestions,
      canResume,
      status: attempt.status,
      startedAt: attempt.startedAt,
      tabSwitches: attempt.tabSwitches,
      submittedAnswers: attempt.submittedAnswers.map((answer) => ({
        questionId: answer.questionId,
        selectedAnswerIndex: answer.selectedAnswerIndex,
        timeTakenSeconds: answer.timeTakenSeconds,
        submittedAt: answer.submittedAt,
      })),
    });
  } catch (error) {
    console.error('Error retrieving test progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress' },
      { status: 500 }
    );
  }
}
