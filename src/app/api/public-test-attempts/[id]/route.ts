import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { enhancedEmailService as emailService } from '@/lib/enhancedEmailService';
import { sendTestCompletionCandidateEmail } from '@/lib/email';
import {
  calculateTestScore,
  prepareSubmittedAnswers,
} from '@/lib/scoring/scoringEngine';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: attemptId } = await params;

    const publicAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        status: true,
        candidateName: true,
        candidateEmail: true,
        publicLink: {
          select: {
            test: {
              select: {
                id: true,
                title: true,
                description: true,
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
      select: {
        id: true,
        publicLinkId: true,
        candidateEmail: true,
        candidateName: true,
        startedAt: true,
      },
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
      select: {
        id: true,
        status: true,
      },
    });

    // Handle answers if provided (for completion)
    if (answers && Object.keys(answers).length > 0) {
      // Get test questions to validate and calculate score
      const publicLink = await prisma.publicTestLink.findUnique({
        where: { id: existingAttempt.publicLinkId },
        select: {
          test: {
            select: {
              id: true,
              title: true,
              questions: true,
            },
          },
        },
      });

      if (publicLink) {
        // Calculate score
        const scoringResult = await calculateTestScore(
          'OBJECTIVE',
          answers,
          publicLink.test.questions as any[]
        );

        // Prepare submitted answers for storage
        const answerRecords = prepareSubmittedAnswers(
          answers,
          publicLink.test.questions as any[],
          'OBJECTIVE'
        ).map((answer) => ({
          ...answer,
          attemptId,
          submittedAt: new Date(),
        }));

        // Use a transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
          // Delete existing answers for this attempt
          await tx.publicSubmittedAnswer.deleteMany({
            where: { attemptId },
          });
          
          // Create new answers
          await tx.publicSubmittedAnswer.createMany({
            data: answerRecords,
          });
          
          // Update attempt with detailed score
          await tx.publicTestAttempt.update({
            where: { id: attemptId },
            data: {
              rawScore: scoringResult.rawScore,
              percentile: scoringResult.percentile,
              categorySubScores: scoringResult.categorySubScores,
            },
          });
        }, {
          maxWait: 10000, // 10 seconds
          timeout: 15000, // 15 seconds
        });

        // Send admin email notification for public test completion (async, don't wait for completion)
        if (status === 'COMPLETED') {
          const totalQuestions = publicLink.test.questions.length;
          const submissionTimeEpoch = new Date().getTime();

          emailService
            .sendTestCompletionNotification({
              testId: publicLink.test.id,
              testAttemptId: attemptId,
              candidateId: attemptId,
              candidateEmail:
                existingAttempt.candidateEmail || 'unknown@example.com',
              candidateName:
                existingAttempt.candidateName || 'Unknown Candidate',
              score: scoringResult.rawScore,
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
                'Failed to send public test completion email notification to admins:',
                error
              );
              // Don't fail the test submission if email fails
            });

          // Send candidate confirmation email (async, don't wait for completion)
          sendTestCompletionCandidateEmail({
            candidateEmail:
              existingAttempt.candidateEmail || 'unknown@example.com',
            candidateName: existingAttempt.candidateName || 'Unknown Candidate',
            testTitle: publicLink.test.title || 'Assessment',
            completedAt: new Date(submissionTimeEpoch),
            companyName: 'Combat Robotics India',
          }).catch((error) => {
            console.error(
              'Failed to send test completion confirmation email to candidate:',
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
