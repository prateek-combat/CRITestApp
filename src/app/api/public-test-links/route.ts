import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicLinks = await prisma.publicTestLink.findMany({
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedLinks = publicLinks.map((link: any) => ({
      id: link.id,
      testId: link.testId,
      testTitle: link.test.title,
      linkToken: link.linkToken,
      title: link.title,
      description: link.description,
      isActive: link.isActive,
      expiresAt: link.expiresAt?.toISOString(),
      maxUses: link.maxUses,
      usedCount: link.usedCount,
      attemptsCount: link._count.attempts,
      createdAt: link.createdAt.toISOString(),
      publicUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/public-test/${link.linkToken}`,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    console.error('Error fetching public test links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public test links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user);

    const body = await request.json();
    const { testId, title, description, expiresAt, maxUses } = body;

    if (!testId) {
      return NextResponse.json(
        { error: 'Test ID is required' },
        { status: 400 }
      );
    }

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
      select: { id: true, title: true },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Generate unique token
    const linkToken = nanoid(12);

    const publicLink = await prisma.publicTestLink.create({
      data: {
        testId,
        linkToken,
        title: title || `Public Link for ${test.title}`,
        description,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || null,
        createdById: session.user.id,
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

    const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/public-test/${linkToken}`;

    return NextResponse.json({
      id: publicLink.id,
      testId: publicLink.testId,
      testTitle: publicLink.test.title,
      linkToken: publicLink.linkToken,
      title: publicLink.title,
      description: publicLink.description,
      isActive: publicLink.isActive,
      expiresAt: publicLink.expiresAt?.toISOString(),
      maxUses: publicLink.maxUses,
      usedCount: publicLink.usedCount,
      createdAt: publicLink.createdAt.toISOString(),
      publicUrl,
    });
  } catch (error) {
    console.error('Error creating public test link:', error);
    return NextResponse.json(
      { error: 'Failed to create public test link' },
      { status: 500 }
    );
  }
}
