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
      select: {
        id: true,
        isActive: true,
        expiresAt: true,
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
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        candidateName: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingAttempt) {
      // For public links, we always allow fresh starts
      // Previous attempts will be archived when starting a new test
      return NextResponse.json({
        hasExistingAttempt: true,
        canStart: true,
        attempt: {
          id: existingAttempt.id,
          status: existingAttempt.status,
          startedAt: existingAttempt.startedAt,
          completedAt: existingAttempt.completedAt,
          candidateName: existingAttempt.candidateName,
        },
        message:
          existingAttempt.status === 'COMPLETED'
            ? 'You have previously completed this test. You can take it again.'
            : 'You have a previous attempt. Starting a fresh attempt.',
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
