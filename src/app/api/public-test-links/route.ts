import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const publicLinks = await prisma.publicTestLink.findMany({
      where: {
        isTimeRestricted: false, // Only get non-time-restricted links
      },
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
      publicUrl: `${baseUrl}/public-test/${link.linkToken}`,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    logger.error(
      'Failed to fetch public test links',
      {
        operation: 'get_public_test_links',
        service: 'public_tests',
        method: 'GET',
        path: '/api/public-test-links',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to fetch public test links' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Creating public test link', {
      operation: 'create_public_test_link',
      service: 'public_tests',
      userId: session.user.id,
      method: 'POST',
      path: '/api/public-test-links',
    });

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
        title: title || `Public Test - ${test.title}`,
        description: description || `Public link for ${test.title}`,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUses: maxUses || null,
        isTimeRestricted: false, // Explicitly set to false for regular public links
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

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const publicUrl = `${baseUrl}/public-test/${linkToken}`;

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
    logger.error(
      'Failed to create public test link',
      {
        operation: 'create_public_test_link',
        service: 'public_tests',
        method: 'POST',
        path: '/api/public-test-links',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to create public test link' },
      { status: 500 }
    );
  }
}
