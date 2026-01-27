import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

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
    logger.error(
      'Failed to fetch job profiles',
      {
        operation: 'fetch_job_profiles',
        method: 'GET',
        path: '/api/admin/job-profiles',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to fetch job profiles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

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
    logger.error(
      'Failed to create job profile',
      {
        operation: 'create_job_profile',
        method: 'POST',
        path: '/api/admin/job-profiles',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to create job profile' },
      { status: 500 }
    );
  }
}
