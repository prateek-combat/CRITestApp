import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ linkToken: string }>;
}

/**
 * Check if email already has an attempt for this public test link
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { linkToken } = await params;
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find the public test link
    const publicLink = await prisma.publicTestLink.findUnique({
      where: { linkToken },
      include: {
        test: {
          select: { id: true, title: true },
        },
      },
    });

    if (!publicLink) {
      return NextResponse.json(
        { error: 'Public test link not found' },
        { status: 404 }
      );
    }

    // Check if link is active and not expired
    if (!publicLink.isActive) {
      return NextResponse.json(
        { error: 'This test link is no longer active' },
        { status: 403 }
      );
    }

    if (publicLink.expiresAt && new Date() > publicLink.expiresAt) {
      return NextResponse.json(
        { error: 'This test link has expired' },
        { status: 403 }
      );
    }

    // Check for existing attempt with this email
    const existingAttempt = await prisma.publicTestAttempt.findFirst({
      where: {
        publicLinkId: publicLink.id,
        candidateEmail: email.trim().toLowerCase(),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAttempt) {
      // Check if the attempt can be resumed
      const canResume = existingAttempt.status === 'IN_PROGRESS';

      return NextResponse.json({
        hasExistingAttempt: true,
        canResume,
        attempt: {
          id: existingAttempt.id,
          status: existingAttempt.status,
          startedAt: existingAttempt.startedAt,
          completedAt: existingAttempt.completedAt,
          candidateName: existingAttempt.candidateName,
        },
        message: canResume
          ? 'You have an in-progress test. You can resume from where you left off.'
          : 'You have already completed this test.',
      });
    }

    // No existing attempt found - user can start the test
    return NextResponse.json({
      hasExistingAttempt: false,
      canStart: true,
      testInfo: {
        title: publicLink.test.title,
        testId: publicLink.test.id,
      },
    });
  } catch (error) {
    console.error('Error checking email for public test:', error);
    return NextResponse.json(
      { error: 'Failed to check email status' },
      { status: 500 }
    );
  }
}

/**
 * Get existing attempt for resume (GET method)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { linkToken } = await params;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Find the public test link
    const publicLink = await prisma.publicTestLink.findUnique({
      where: { linkToken },
    });

    if (!publicLink) {
      return NextResponse.json(
        { error: 'Public test link not found' },
        { status: 404 }
      );
    }

    // Find existing attempt
    const existingAttempt = await prisma.publicTestAttempt.findFirst({
      where: {
        publicLinkId: publicLink.id,
        candidateEmail: email.trim().toLowerCase(),
        status: 'IN_PROGRESS',
      },
    });

    if (existingAttempt) {
      return NextResponse.json({
        attemptId: existingAttempt.id,
        canResume: true,
      });
    }

    return NextResponse.json({
      canResume: false,
      message: 'No in-progress attempt found',
    });
  } catch (error) {
    console.error('Error getting resume attempt:', error);
    return NextResponse.json(
      { error: 'Failed to get resume attempt' },
      { status: 500 }
    );
  }
}
