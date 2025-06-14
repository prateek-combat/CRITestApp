import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enhancedEmailService as emailService } from '@/lib/enhancedEmailService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;

    const publicAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
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

    if (!publicAttempt) {
      return NextResponse.json(
        { error: 'Public test attempt not found' },
        { status: 404 }
      );
    }

    // Transform the data to match the expected interface
    const response = {
      id: publicAttempt.id,
      status: publicAttempt.status,
      candidateName: publicAttempt.candidateName,
      candidateEmail: publicAttempt.candidateEmail,
      test: {
        id: publicAttempt.publicLink.test.id,
        title: publicAttempt.publicLink.test.title,
        description: publicAttempt.publicLink.test.description,
        questions: publicAttempt.publicLink.test.questions,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching public test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test attempt' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;
    const body = await request.json();
    const { status, answers, questionStartTime, proctoringEnabled } = body;

    // Verify the public test attempt exists
    const existingAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!existingAttempt) {
      return NextResponse.json(
        { error: 'Public test attempt not found' },
        { status: 404 }
      );
    }

    // Update the attempt
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    if (proctoringEnabled !== undefined) {
      updateData.proctoringEnabled = proctoringEnabled;
    }

    const updatedAttempt = await prisma.publicTestAttempt.update({
      where: { id: attemptId },
      data: updateData,
    });

    // Handle answers if provided (for completion)
    if (answers && Object.keys(answers).length > 0) {
      // Get test questions to validate and calculate score
      const publicLink = await prisma.publicTestLink.findUnique({
        where: { id: existingAttempt.publicLinkId },
        include: {
          test: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (publicLink) {
        // Save answers
        const answerRecords = Object.entries(answers).map(
          ([questionId, answer]: [string, any]) => ({
            attemptId,
            questionId,
            selectedAnswerIndex: answer.answerIndex,
            timeTakenSeconds: answer.timeTaken || 0,
            submittedAt: new Date(),
          })
        );

        // Delete existing answers for this attempt
        await prisma.publicSubmittedAnswer.deleteMany({
          where: { attemptId },
        });

        // Create new answers
        await prisma.publicSubmittedAnswer.createMany({
          data: answerRecords,
        });

        // Calculate detailed score with category breakdown (matching regular test attempts)
        let correctAnswers = 0;
        const submissionTimeEpoch = new Date().getTime();

        // Initialize category scores
        const finalCategorySubScores: Record<
          string,
          { correct: number; total: number }
        > = {
          LOGICAL: { correct: 0, total: 0 },
          VERBAL: { correct: 0, total: 0 },
          NUMERICAL: { correct: 0, total: 0 },
          ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
          OTHER: { correct: 0, total: 0 },
        };

        // First, populate total questions for each category
        publicLink.test.questions.forEach((q: any) => {
          const category = q.category;
          if (finalCategorySubScores[category]) {
            finalCategorySubScores[category].total++;
          }
        });

        // Calculate correct answers and category scores
        for (const question of publicLink.test.questions) {
          const questionId = question.id;
          const clientAnswerData = answers[questionId];
          const category = question.category;

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
          }
        }

        const totalQuestions = publicLink.test.questions.length;
        const rawScore = correctAnswers;
        const percentile =
          totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

        // Update attempt with detailed score
        await prisma.publicTestAttempt.update({
          where: { id: attemptId },
          data: {
            rawScore,
            percentile,
            categorySubScores: finalCategorySubScores,
          },
        });

        // Send email notification for public test completion (async, don't wait for completion)
        if (status === 'COMPLETED') {
          emailService
            .sendTestCompletionNotification({
              testId: publicLink.test.id,
              testAttemptId: attemptId,
              candidateId: attemptId,
              candidateEmail:
                existingAttempt.candidateEmail || 'unknown@example.com',
              candidateName:
                existingAttempt.candidateName || 'Unknown Candidate',
              score: correctAnswers,
              maxScore: totalQuestions,
              completedAt: new Date(submissionTimeEpoch),
              timeTaken: Math.floor(
                (submissionTimeEpoch - existingAttempt.startedAt.getTime()) /
                  1000
              ),
              answers: answerRecords.map((record) => ({
                questionId: record.questionId,
                selectedAnswerIndex: record.selectedAnswerIndex,
                isCorrect:
                  publicLink.test.questions.find(
                    (q) => q.id === record.questionId
                  )?.correctAnswerIndex === record.selectedAnswerIndex,
                timeTakenSeconds: record.timeTakenSeconds,
              })),
            })
            .catch((error) => {
              console.error(
                'Failed to send public test completion email notification:',
                error
              );
              // Don't fail the test submission if email fails
            });
        }
      }
    }

    return NextResponse.json({
      id: updatedAttempt.id,
      status: updatedAttempt.status,
      message: 'Public test attempt updated successfully',
    });
  } catch (error) {
    console.error('Error updating public test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to update test attempt' },
      { status: 500 }
    );
  }
}
