import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { attemptId } = await params;

    // Try to find a regular test attempt first
    let attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        submittedAnswers: {
          include: {
            question: true,
          },
          orderBy: { submittedAt: 'asc' },
        },
        invitation: true,
      },
    });

    let isPublic = false;

    // If not found, try public test attempt
    if (!attempt) {
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
          submittedAnswers: {
            include: {
              question: true,
            },
            orderBy: { submittedAt: 'asc' },
          },
        },
      });

      if (publicAttempt) {
        isPublic = true;
        // Transform public attempt to match regular attempt structure
        attempt = {
          id: publicAttempt.id,
          candidateName: publicAttempt.candidateName,
          candidateEmail: publicAttempt.candidateEmail,
          startedAt: publicAttempt.startedAt,
          completedAt: publicAttempt.completedAt,
          status: publicAttempt.status,
          rawScore: publicAttempt.rawScore,
          percentile: publicAttempt.percentile,
          categorySubScores: publicAttempt.categorySubScores,
          tabSwitches: publicAttempt.tabSwitches,
          test: publicAttempt.publicLink.test,
          submittedAnswers: publicAttempt.submittedAnswers,
          invitation: {
            id: publicAttempt.publicLink.id,
            candidateName: publicAttempt.candidateName,
            candidateEmail: publicAttempt.candidateEmail,
          },
        } as any;
      }
    }

    if (!attempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      attempt,
      isPublic,
    });
  } catch (error) {
    console.error('Error fetching test analysis data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test analysis data' },
      { status: 500 }
    );
  }
}
