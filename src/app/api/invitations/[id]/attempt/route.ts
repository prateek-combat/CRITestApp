import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Get existing test attempt for an invitation
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: invitationId } = await params;

    // Find existing test attempt for this invitation
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { invitationId },
      include: {
        test: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        submittedAnswers: {
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'No test attempt found for this invitation' },
        { status: 404 }
      );
    }

    return NextResponse.json(testAttempt);
  } catch (error) {
    console.error('Error getting test attempt for invitation:', error);
    return NextResponse.json(
      { error: 'Failed to get test attempt' },
      { status: 500 }
    );
  }
}
