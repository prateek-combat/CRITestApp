import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: params.id },
      include: {
        testWeights: {
          include: {
            test: true,
          },
        },
        _count: {
          select: {
            invitations: true,
          },
        },
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(jobProfile);
  } catch (error) {
    console.error('Error fetching job profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isActive, testIds, notificationEmails } = body;

    if (!name || !testIds || testIds.length === 0) {
      return NextResponse.json(
        { error: 'Name and tests are required' },
        { status: 400 }
      );
    }

    // Check if name already exists (excluding current profile)
    const existingProfile = await prisma.jobProfile.findFirst({
      where: {
        name,
        NOT: { id: params.id },
      },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: 'A job profile with this name already exists' },
        { status: 400 }
      );
    }

    // Process notification emails (simple storage for now)
    let processedEmails = '';
    if (notificationEmails && typeof notificationEmails === 'string') {
      processedEmails = notificationEmails;
    }

    const jobProfile = await prisma.jobProfile.update({
      where: { id: params.id },
      data: {
        name,
        description,
        isActive,
        testWeights: {
          deleteMany: {},
          create: testIds.map((testId: string) => ({
            testId,
            weight: 1.0,
          })),
        },
      },
      include: {
        testWeights: {
          include: {
            test: true,
          },
        },
        _count: {
          select: {
            invitations: true,
          },
        },
      },
    });

    return NextResponse.json(jobProfile);
  } catch (error) {
    console.error('Error updating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to update job profile' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if job profile exists
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            invitations: true,
          },
        },
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Delete the job profile (this will cascade delete related invitations)
    await prisma.jobProfile.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Job profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting job profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete job profile' },
      { status: 500 }
    );
  }
}
