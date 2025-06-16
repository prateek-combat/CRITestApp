import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const publicLink = await prisma.publicTestLink.findUnique({
      where: { id },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        attempts: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
            status: true,
            completedAt: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!publicLink) {
      return NextResponse.json(
        { error: 'Public test link not found' },
        { status: 404 }
      );
    }

    const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/public-test/${publicLink.linkToken}`;

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
      attempts: publicLink.attempts.map((attempt: any) => ({
        id: attempt.id,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        status: attempt.status,
        completedAt: attempt.completedAt?.toISOString(),
        createdAt: attempt.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error fetching public test link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public test link' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, title, description, expiresAt, maxUses } = body;

    const updatedLink = await prisma.publicTestLink.update({
      where: { id },
      data: {
        isActive: isActive !== undefined ? isActive : undefined,
        title: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        expiresAt:
          expiresAt !== undefined
            ? expiresAt
              ? new Date(expiresAt)
              : null
            : undefined,
        maxUses: maxUses !== undefined ? maxUses : undefined,
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

    const publicUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/public-test/${updatedLink.linkToken}`;

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
      publicUrl,
    });
  } catch (error) {
    console.error('Error updating public test link:', error);
    return NextResponse.json(
      { error: 'Failed to update public test link' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.publicTestLink.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Public test link deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting public test link:', error);
    return NextResponse.json(
      { error: 'Failed to delete public test link' },
      { status: 500 }
    );
  }
}
