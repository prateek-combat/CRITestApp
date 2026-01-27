import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { calculatePersonalityScores } from '@/lib/scoring/personalityScoring';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // First, check if this is a job profile invitation test attempt (public access)
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
      select: {
        id: true,
        jobProfileInvitationId: true,
      },
    });

    // If test attempt doesn't exist, return 404
    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // If this is NOT a job profile invitation, require admin authentication
    if (!testAttempt.jobProfileInvitationId) {
      const admin = await requireAdmin();
      if ('response' in admin) {
        return admin.response;
      }
    }

    // Now fetch the full test attempt data
    let fullTestAttempt = (await prisma.testAttempt.findUnique({
      where: { id },
      include: {
        test: {
          include: {
            questions: {
              orderBy: {
                createdAt: 'asc',
              },
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

    let isPublicAttempt = false;

    // If not found in regular attempts, try public attempts
    if (!fullTestAttempt) {
      fullTestAttempt = (await prisma.publicTestAttempt.findUnique({
        where: { id },
        include: {
          publicLink: {
            include: {
              test: {
                include: {
                  questions: {
                    orderBy: {
                      createdAt: 'asc',
                    },
                    include: {
                      personalityDimension: true,
                    },
                  },
                },
              },
            },
          },
          submittedAnswers: {
            include: {
              question: true,
            },
          },
        },
      })) as any;

      if (fullTestAttempt) {
        isPublicAttempt = true;
        // Restructure public attempt to match regular attempt format
        fullTestAttempt.test = fullTestAttempt.publicLink.test;
        fullTestAttempt.invitation = {
          candidateName: fullTestAttempt.candidateName,
          candidateEmail: fullTestAttempt.candidateEmail,
        };
      }
    }

    if (!fullTestAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Transform submitted answers into the expected format
    const answers: Record<string, { answerIndex: number; timeTaken: number }> =
      {};
    fullTestAttempt.submittedAnswers.forEach((submittedAnswer: any) => {
      answers[submittedAnswer.questionId] = {
        answerIndex: submittedAnswer.selectedAnswerIndex,
        timeTaken: submittedAnswer.timeTakenSeconds,
      };
    });

    // Calculate personality scores if there are personality questions
    const personalityQuestions = fullTestAttempt.test.questions.filter(
      (q: any) => q.questionType === 'PERSONALITY'
    );

    let personalityScores = {};
    if (personalityQuestions.length > 0 && Object.keys(answers).length > 0) {
      try {
        personalityScores = calculatePersonalityScores(
          fullTestAttempt.test.questions,
          answers as any,
          fullTestAttempt.test.id
        );
      } catch (error) {
        console.error('Error calculating personality scores:', error);
      }
    }

    // Calculate objective score
    const objectiveQuestions = fullTestAttempt.test.questions.filter(
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
      id: fullTestAttempt.id,
      candidateName: fullTestAttempt.invitation?.candidateName || 'Unknown',
      candidateEmail: fullTestAttempt.invitation?.candidateEmail || 'Unknown',
      answers: answers,
      objectiveScore,
      totalQuestions: fullTestAttempt.test.questions.length,
      personalityScores:
        Object.keys(personalityScores).length > 0 ? personalityScores : null,
      personalityProfile: fullTestAttempt.personalityProfile,
      status: fullTestAttempt.status,
      createdAt: fullTestAttempt.createdAt,
      updatedAt: fullTestAttempt.updatedAt,
      isPublicAttempt, // Add flag to indicate type
      test: {
        id: fullTestAttempt.test.id,
        title: fullTestAttempt.test.title,
        description: fullTestAttempt.test.description,
        questions: fullTestAttempt.test.questions.map((q: any) => ({
          id: q.id,
          promptText: q.promptText,
          answerOptions: q.answerOptions,
          questionType: q.questionType,
          correctAnswerIndex: q.correctAnswerIndex,
          personalityDimension: q.personalityDimension,
          answerWeights: q.answerWeights,
          timerSeconds: q.timerSeconds,
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
