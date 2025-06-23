import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { createPreviewToken } from '@/lib/preview-tokens';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Generate a temporary preview token for admin to preview test
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { error: 'Insufficient permissions - Admin access required' },
        { status: 403 }
      );
    }

    const { id: testId } = await params;

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true, questions: { select: { id: true } } },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (test.questions.length === 0) {
      return NextResponse.json(
        { error: 'Test has no questions' },
        { status: 400 }
      );
    }

    // Generate a temporary preview token (valid for 1 hour)
    const previewToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour from now

    // Store token in memory
    createPreviewToken(previewToken, {
      testId: testId,
      userId: user.id,
      expiresAt: expiresAt,
      testTitle: test.title,
    });

    return NextResponse.json({
      previewUrl: `/admin/test-preview?token=${previewToken}`,
      expiresAt: new Date(expiresAt).toISOString(),
      testTitle: test.title,
      token: previewToken,
    });
  } catch (error) {
    console.error('Error creating preview link:', error);
    return NextResponse.json(
      { error: 'Failed to create preview link' },
      { status: 500 }
    );
  }
}
