import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/job-profiles/[id]/time-slot-link - Create time-restricted public links
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { timeSlotId } = body;

    if (!timeSlotId) {
      return NextResponse.json(
        { error: 'Time slot ID is required' },
        { status: 400 }
      );
    }

    // Get job profile with tests and time slot
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id },
      include: {
        testWeights: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                isArchived: true,
              },
            },
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

    // Get time slot details
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      select: {
        id: true,
        name: true,
        description: true,
        startDateTime: true,
        endDateTime: true,
        timezone: true,
        maxParticipants: true,
        currentParticipants: true,
        isActive: true,
        jobProfileId: true,
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    if (timeSlot.jobProfileId !== id) {
      return NextResponse.json(
        { error: 'Time slot does not belong to this job profile' },
        { status: 400 }
      );
    }

    if (!timeSlot.isActive) {
      return NextResponse.json(
        { error: 'Time slot is not active' },
        { status: 400 }
      );
    }

    // Get base URL for public links
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const createdLinks = [];

    // Create time-restricted public links for each test in the job profile
    for (const testWeight of jobProfile.testWeights) {
      const test = testWeight.test;

      if (test.isArchived) {
        continue; // Skip archived tests
      }

      // Check if a time-restricted link already exists for this test and time slot
      const existingLink = await prisma.publicTestLink.findFirst({
        where: {
          testId: test.id,
          timeSlotId: timeSlotId,
          isActive: true,
        },
      });

      if (existingLink) {
        // Return existing link
        createdLinks.push({
          id: existingLink.id,
          testId: existingLink.testId,
          testTitle: test.title,
          linkToken: existingLink.linkToken,
          title: existingLink.title,
          description: existingLink.description,
          isActive: existingLink.isActive,
          isTimeRestricted: existingLink.isTimeRestricted,
          timeSlotId: existingLink.timeSlotId,
          usedCount: existingLink.usedCount,
          createdAt: existingLink.createdAt.toISOString(),
          publicUrl: `${baseUrl}/public-test/${existingLink.linkToken}`,
          isExisting: true,
          timeSlot: {
            name: timeSlot.name,
            startDateTime: timeSlot.startDateTime.toISOString(),
            endDateTime: timeSlot.endDateTime.toISOString(),
            timezone: timeSlot.timezone,
          },
        });
      } else {
        // Create new time-restricted public link
        const linkToken = nanoid(12);
        const publicLink = await prisma.publicTestLink.create({
          data: {
            testId: test.id,
            jobProfileId: jobProfile.id,
            linkToken,
            title: `${jobProfile.name} - ${test.title} (${timeSlot.name})`,
            description: `Time-restricted access for ${test.title} during ${timeSlot.name}`,
            isTimeRestricted: true,
            timeSlotId: timeSlotId,
            createdById: session.user.id,
          },
        });

        createdLinks.push({
          id: publicLink.id,
          testId: publicLink.testId,
          testTitle: test.title,
          linkToken: publicLink.linkToken,
          title: publicLink.title,
          description: publicLink.description,
          isActive: publicLink.isActive,
          isTimeRestricted: publicLink.isTimeRestricted,
          timeSlotId: publicLink.timeSlotId,
          usedCount: publicLink.usedCount,
          createdAt: publicLink.createdAt.toISOString(),
          publicUrl: `${baseUrl}/public-test/${linkToken}`,
          isExisting: false,
          timeSlot: {
            name: timeSlot.name,
            startDateTime: timeSlot.startDateTime.toISOString(),
            endDateTime: timeSlot.endDateTime.toISOString(),
            timezone: timeSlot.timezone,
          },
        });
      }
    }

    return NextResponse.json({
      message: `Generated ${createdLinks.filter((link) => !link.isExisting).length} new time-restricted links and found ${createdLinks.filter((link) => link.isExisting).length} existing links`,
      jobProfileName: jobProfile.name,
      timeSlot: {
        id: timeSlot.id,
        name: timeSlot.name,
        startDateTime: timeSlot.startDateTime.toISOString(),
        endDateTime: timeSlot.endDateTime.toISOString(),
        timezone: timeSlot.timezone,
        maxParticipants: timeSlot.maxParticipants,
        currentParticipants: timeSlot.currentParticipants,
      },
      links: createdLinks,
    });
  } catch (error) {
    console.error('Error creating time-restricted public links:', error);
    return NextResponse.json(
      { error: 'Failed to create time-restricted public links' },
      { status: 500 }
    );
  }
}
