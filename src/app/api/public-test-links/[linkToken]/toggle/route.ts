import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ linkToken: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

    const { linkToken } = await params;

    // Get the current status - we need to find by linkToken first
    const publicLink = await prisma.publicTestLink.findUnique({
      where: { linkToken: linkToken },
      select: { id: true, isActive: true },
    });

    if (!publicLink) {
      return NextResponse.json(
        { error: 'Public link not found' },
        { status: 404 }
      );
    }

    // Toggle the status
    const updatedLink = await prisma.publicTestLink.update({
      where: { id: publicLink.id },
      data: { isActive: !publicLink.isActive },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    logger.info(`Public link ${publicLink.isActive ? 'disabled' : 'enabled'}`, {
      operation: 'toggle_public_link',
      service: 'public_tests',
      linkId: publicLink.id,
      newStatus: updatedLink.isActive,
      userId: session.user.id,
      method: 'PUT',
      path: '/api/public-test-links/[linkId]/toggle',
    });

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({
      id: updatedLink.id,
      testId: updatedLink.testId,
      testTitle: updatedLink.test.title,
      linkToken: updatedLink.linkToken,
      title: updatedLink.title,
      description: updatedLink.description,
      isActive: updatedLink.isActive,
      expiresAt: updatedLink.expiresAt?.toISOString(),
      maxUses: updatedLink.maxUses,
      usedCount: updatedLink.usedCount,
      createdAt: updatedLink.createdAt.toISOString(),
      publicUrl: `${baseUrl}/public-test/${updatedLink.linkToken}`,
      message: `Link ${updatedLink.isActive ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    logger.error(
      'Failed to toggle public test link',
      {
        operation: 'toggle_public_link',
        service: 'public_tests',
        method: 'PUT',
        path: '/api/public-test-links/[linkId]/toggle',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to toggle public test link' },
      { status: 500 }
    );
  }
}
