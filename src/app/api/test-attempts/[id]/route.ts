import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { calculatePersonalityScores } from '@/lib/scoring/personalityScoring';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session?.user ||
      (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch test attempt with all related data
    const testAttempt = (await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            questions: {
              include: {
                personalityDimension: true,
              },
            },
          },
        },
        invitation: {
          select: {
            candidateName: true,
            candidateEmail: true,
          },
        },
        submittedAnswers: {
          include: {
            question: true,
          },
        },
      },
    })) as any;

    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Transform submitted answers into the expected format
    const answers: Record<string, { answerIndex: number; timeTaken: number }> =
      {};
    testAttempt.submittedAnswers.forEach((submittedAnswer: any) => {
      answers[submittedAnswer.questionId] = {
        answerIndex: submittedAnswer.selectedAnswerIndex,
        timeTaken: submittedAnswer.timeTakenSeconds,
      };
    });

    // Calculate personality scores if there are personality questions
    const personalityQuestions = testAttempt.test.questions.filter(
      (q: any) => q.questionType === 'PERSONALITY'
    );

    let personalityScores = {};
    if (personalityQuestions.length > 0 && Object.keys(answers).length > 0) {
      try {
        personalityScores = calculatePersonalityScores(
          testAttempt.test.questions,
          answers as any,
          testAttempt.test.id
        );
      } catch (error) {
        console.error('Error calculating personality scores:', error);
      }
    }

    // Calculate objective score
    const objectiveQuestions = testAttempt.test.questions.filter(
      (q: any) => q.questionType !== 'PERSONALITY'
    );

    let objectiveScore = 0;
    if (objectiveQuestions.length > 0 && Object.keys(answers).length > 0) {
      objectiveScore = objectiveQuestions.reduce(
        (score: number, question: any) => {
          const answer = answers[question.id];
          if (answer && answer.answerIndex === question.correctAnswerIndex) {
            return score + 1;
          }
          return score;
        },
        0
      );
    }

    // Format the response
    const response = {
      id: testAttempt.id,
      candidateName: testAttempt.invitation?.candidateName || 'Unknown',
      candidateEmail: testAttempt.invitation?.candidateEmail || 'Unknown',
      answers: answers,
      objectiveScore,
      totalQuestions: testAttempt.test.questions.length,
      personalityScores:
        Object.keys(personalityScores).length > 0 ? personalityScores : null,
      personalityProfile: testAttempt.personalityProfile,
      status: testAttempt.status,
      createdAt: testAttempt.createdAt,
      updatedAt: testAttempt.updatedAt,
      test: {
        id: testAttempt.test.id,
        title: testAttempt.test.title,
        description: testAttempt.test.description,
        questions: testAttempt.test.questions.map((q: any) => ({
          id: q.id,
          promptText: q.promptText,
          answerOptions: q.answerOptions,
          questionType: q.questionType,
          correctAnswerIndex: q.correctAnswerIndex,
          personalityDimension: q.personalityDimension,
          answerWeights: q.answerWeights,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching test attempt:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
