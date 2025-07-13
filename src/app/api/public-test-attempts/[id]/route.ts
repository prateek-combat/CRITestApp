import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    console.log('PUT /api/public-test-attempts/[id] - Request details:', {
      attemptId,
      status,
      hasAnswers: !!answers,
      answersCount: answers ? Object.keys(answers).length : 0,
      proctoringEnabled,
    });

    // Verify the public test attempt exists
    const existingAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        publicLinkId: true,
        candidateEmail: true,
        candidateName: true,
        startedAt: true,
        status: true,
      },
    });

    console.log('Existing attempt lookup result:', {
      attemptId,
      found: !!existingAttempt,
      status: existingAttempt?.status,
    });

    if (!existingAttempt) {
      console.error('Public test attempt not found:', { attemptId });
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

        // Use a transaction to ensure atomicity with optimized settings
        let transactionSuccess = false;
        try {
          await prisma.$transaction(
            async (tx) => {
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
                  status: 'COMPLETED',
                  completedAt: new Date(),
                },
              });
            },
            {
              maxWait: 15000, // Increased to 15 seconds
              timeout: 45000, // Increased to 45 seconds
            }
          );
          transactionSuccess = true;
        } catch (transactionError) {
          console.error(
            'Transaction failed, attempting fallback:',
            transactionError
          );

          // Fallback: At minimum, mark the attempt as completed
          try {
            await prisma.publicTestAttempt.update({
              where: { id: attemptId },
              data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                rawScore: scoringResult.rawScore,
                percentile: scoringResult.percentile,
                categorySubScores: scoringResult.categorySubScores,
              },
            });
            transactionSuccess = true;
            console.log('Fallback update successful');
          } catch (fallbackError) {
            console.error('Fallback update also failed:', fallbackError);
            throw fallbackError;
          }
        }

        if (!transactionSuccess) {
          throw new Error('Failed to save test submission');
        }

        // Send admin email notification for public test completion (async, don't wait for completion)
        if (status === 'COMPLETED') {
          const totalQuestions = publicLink.test.questions.length;
          const submissionTimeEpoch = new Date().getTime();

          // Email service disabled - admin notification skipped
          console.log(
            'Email service disabled - admin notification skipped for test completion',
            {
              testId: publicLink.test.id,
              attemptId,
              candidateEmail:
                existingAttempt.candidateEmail || 'unknown@example.com',
            }
          );

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
      message: 'Test submitted successfully',
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating public test attempt:', error);

    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('P2028')) {
        return NextResponse.json(
          { error: 'Database transaction timeout. Please try again.' },
          { status: 503 }
        );
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Test attempt not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update test attempt' },
      { status: 500 }
    );
  }
}
