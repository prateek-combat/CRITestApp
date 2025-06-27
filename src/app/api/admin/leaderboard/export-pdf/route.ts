import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { PDFReportGenerator } from '@/utils/pdfReportGenerator';
import { calculatePersonalityScores } from '@/lib/scoring/personalityScoring';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId } = await request.json();

    if (!attemptId) {
      return NextResponse.json(
        { error: 'Attempt ID is required' },
        { status: 400 }
      );
    }

    // Try to fetch from regular test attempts first
    let testAttempt = (await prisma.testAttempt.findUnique({
      where: { id: attemptId },
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
    if (!testAttempt) {
      testAttempt = (await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
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

      if (testAttempt) {
        isPublicAttempt = true;
        // Restructure public attempt to match regular attempt format
        testAttempt.test = testAttempt.publicLink.test;
        testAttempt.invitation = {
          candidateName: testAttempt.candidateName,
          candidateEmail: testAttempt.candidateEmail,
        };
      }
    }

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
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

    // Format the test attempt data for PDF generation
    const testAttemptData = {
      id: testAttempt.id,
      candidateName: testAttempt.invitation?.candidateName || 'Unknown',
      candidateEmail: testAttempt.invitation?.candidateEmail || 'Unknown',
      answers: answers,
      objectiveScore,
      totalQuestions: objectiveQuestions.length,
      personalityScores:
        Object.keys(personalityScores).length > 0
          ? personalityScores
          : undefined,
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

    // Generate PDF
    const generator = new PDFReportGenerator();
    const pdfBytes = await generator.generateQAReport(testAttemptData);

    // Return PDF as downloadable file
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${testAttemptData.candidateName}_test_results.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
