import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const publicLink = await prisma.publicTestLink.findUnique({
      where: {
        linkToken: token,
      },
      include: {
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

    return NextResponse.json({
      id: publicLink.id,
      testId: publicLink.testId,
      testTitle: publicLink.test.title,
      title: publicLink.title,
      description: publicLink.description,
      isActive: publicLink.isActive,
      expiresAt: publicLink.expiresAt?.toISOString(),
      maxUses: publicLink.maxUses,
      usedCount: publicLink.usedCount,
    });
  } catch (error) {
    console.error('Error fetching public test link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test link' },
      { status: 500 }
    );
  }
}
