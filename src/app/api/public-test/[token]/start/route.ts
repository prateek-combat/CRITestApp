import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Increase timeout for this API route (Vercel functions)
export const maxDuration = 60; // 60 seconds instead of default 10s
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: RouteParams) {
  // Set a longer timeout for this operation
  const startTime = Date.now();

  try {
    const { token } = await params;
    const body = await request.json();
    const { candidateName, candidateEmail } = body;

    if (!candidateName?.trim() || !candidateEmail?.trim()) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    if (!candidateEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const publicLink = await prisma.publicTestLink.findUnique({
      where: { linkToken: token },
      select: {
        id: true,
        testId: true,
        isActive: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        test: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!publicLink) {
      return NextResponse.json({ error: 'Invalid test link' }, { status: 404 });
    }

    // Check if link is active
    if (!publicLink.isActive) {
      return NextResponse.json(
        { error: 'This test link has been deactivated' },
        { status: 403 }
      );
    }

    // Check if link has expired
    if (publicLink.expiresAt && new Date(publicLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This test link has expired' },
        { status: 403 }
      );
    }

    // Check if max uses reached
    if (publicLink.maxUses && publicLink.usedCount >= publicLink.maxUses) {
      return NextResponse.json(
        { error: 'This test link has reached its usage limit' },
        { status: 403 }
      );
    }

    // Check if candidate already started a test with this email on this link
    const existingAttempt = await prisma.publicTestAttempt.findFirst({
      where: {
        publicLinkId: publicLink.id,
        candidateEmail: candidateEmail.trim().toLowerCase(),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (existingAttempt) {
      // For public links, we always start fresh - archive any existing attempts
      if (existingAttempt.status === 'IN_PROGRESS') {
        await prisma.publicTestAttempt.update({
          where: { id: existingAttempt.id },
          data: {
            status: 'ARCHIVED',
            completedAt: new Date(),
          },
        });
      } else if (existingAttempt.status === 'COMPLETED') {
        // Allow retaking completed tests on public links
        await prisma.publicTestAttempt.update({
          where: { id: existingAttempt.id },
          data: { status: 'ARCHIVED' },
        });
      }
    }

    // Create new test attempt and increment usage count in a transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Create the test attempt
        const testAttempt = await tx.publicTestAttempt.create({
          data: {
            publicLinkId: publicLink.id,
            candidateName: candidateName.trim(),
            candidateEmail: candidateEmail.trim().toLowerCase(),
            ipAddress: ipAddress,
          },
          select: {
            id: true,
          },
        });

        // Increment usage count
        await tx.publicTestLink.update({
          where: { id: publicLink.id },
          data: { usedCount: { increment: 1 } },
        });

        return testAttempt;
      },
      {
        maxWait: 20000, // 20 seconds
        timeout: 30000, // 30 seconds
      }
    );

    return NextResponse.json({
      attemptId: result.id,
      testId: publicLink.testId,
      testTitle: publicLink.test.title,
      message: 'Test started successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode =
      error && typeof error === 'object' && 'code' in error ? error.code : null;

    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    } else if (errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection issue. Please try again.' },
        { status: 503 }
      );
    } else if (errorCode === 'P2002') {
      return NextResponse.json(
        {
          error:
            'You have already started this test. Please continue your existing attempt.',
        },
        { status: 409 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to start test. Please try again.' },
        { status: 500 }
      );
    }
  }
}
