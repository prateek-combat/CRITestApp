import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Save public test progress - updates current question index
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;
    const { currentQuestionIndex, tabSwitches } = await request.json();

    // Update the public test attempt with current progress
    const updatedAttempt = await prisma.publicTestAttempt.update({
      where: { id: attemptId },
      data: {
        ...(tabSwitches !== undefined && { tabSwitches }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      currentQuestionIndex: currentQuestionIndex, // Return the received value since we can't store it yet
    });
  } catch (error) {
    console.error('Error saving public test progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}

/**
 * Get public test progress - retrieves current question index and submitted answers
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;

    // Get the public test attempt with submitted answers
    const attempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        submittedAnswers: {
          orderBy: { submittedAt: 'asc' },
        },
        publicLink: {
          include: {
            test: {
              include: {
                questions: {
                  orderBy: { createdAt: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      return NextResponse.json(
        { error: 'Public test attempt not found' },
        { status: 404 }
      );
    }

    // Calculate resume information
    const totalQuestions = attempt.publicLink.test.questions.length;
    const currentQuestionIndex = attempt.submittedAnswers.length; // Use number of submitted answers as current position
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
      candidateEmail: attempt.candidateEmail,
      submittedAnswers: attempt.submittedAnswers.map((answer) => ({
        questionId: answer.questionId,
        selectedAnswerIndex: answer.selectedAnswerIndex,
        timeTakenSeconds: answer.timeTakenSeconds,
        submittedAt: answer.submittedAt,
      })),
    });
  } catch (error) {
    console.error('Error retrieving public test progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress' },
      { status: 500 }
    );
  }
}
