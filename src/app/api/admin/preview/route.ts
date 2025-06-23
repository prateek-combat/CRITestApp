import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// In-memory store for preview tokens (valid for 1 hour)
const previewTokens = new Map<
  string,
  {
    testId: string;
    userId: string;
    expiresAt: number;
    testTitle: string;
  }
>();

// Clean up expired tokens every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [token, data] of previewTokens.entries()) {
      if (data.expiresAt < now) {
        previewTokens.delete(token);
      }
    }
  },
  10 * 60 * 1000
);

/**
 * Validate a preview token and get test data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Preview token required' },
        { status: 400 }
      );
    }

    const tokenData = previewTokens.get(token);
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired preview token' },
        { status: 404 }
      );
    }

    if (tokenData.expiresAt < Date.now()) {
      previewTokens.delete(token);
      return NextResponse.json(
        { error: 'Preview token expired' },
        { status: 410 }
      );
    }

    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.id !== tokenData.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Token mismatch' },
        { status: 403 }
      );
    }

    // Get test data
    const test = await prisma.test.findUnique({
      where: { id: tokenData.testId },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({
      test: test,
      isPreview: true,
      previewUser: {
        name: user.firstName || user.email,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error validating preview token:', error);
    return NextResponse.json(
      { error: 'Failed to validate preview token' },
      { status: 500 }
    );
  }
}

// Export the token store so other routes can access it
export { previewTokens };
