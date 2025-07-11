import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

export async function GET() {
  try {
    const session = await getServerSession(authOptionsSimple);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobProfiles = await prisma.jobProfile.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(jobProfiles);
  } catch (error) {
    console.error('Error fetching job profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // Check if name already exists
    const existingProfile = await prisma.jobProfile.findFirst({
      where: { name },
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

    const jobProfile = await prisma.jobProfile.create({
      data: {
        name,
        description,
        isActive,
        createdById: session.user.id,
        testWeights: {
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
    console.error('Error creating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to create job profile' },
      { status: 500 }
    );
  }
}
