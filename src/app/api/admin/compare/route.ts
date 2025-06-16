import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const attemptIds = searchParams.get('attemptIds')?.split(',') || [];

    if (attemptIds.length === 0) {
      return NextResponse.json(
        { error: 'No attempt IDs provided' },
        { status: 400 }
      );
    }

    // Fetch test attempts with their answers
    const attempts = await prisma.testAttempt.findMany({
      where: {
        id: { in: attemptIds },
        status: 'COMPLETED',
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        submittedAnswers: {
          include: {
            question: {
              select: {
                id: true,
                text: true,
                category: true,
                correctAnswer: true,
              },
            },
          },
        },
      },
    });

    if (attempts.length === 0) {
      return NextResponse.json({ error: 'No attempts found' }, { status: 404 });
    }

    // Process the comparison data
    const comparisonData = {
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        compositeScore: attempt.compositeScore || 0,
        submittedAt: attempt.submittedAt,
        test: attempt.test,
        answers: attempt.submittedAnswers.map((answer) => ({
          questionId: answer.questionId,
          questionText: answer.question.text,
          category: answer.question.category,
          selectedAnswer: answer.selectedAnswer,
          isCorrect: answer.isCorrect,
          correctAnswer: answer.question.correctAnswer,
        })),
      })),
    };

    return NextResponse.json(comparisonData);
  } catch (error) {
    console.error('Compare API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison data' },
      { status: 500 }
    );
  }
}
