import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/time-slots - Get all time slots for a job profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobProfileId = searchParams.get('jobProfileId');

    // Build where clause - if jobProfileId is provided, filter by it
    const whereClause: any = {
      isActive: true,
    };

    if (jobProfileId) {
      whereClause.jobProfileId = jobProfileId;
    }

    const timeSlots = await prisma.timeSlot.findMany({
      where: whereClause,
      include: {
        jobProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        publicTestLinks: {
          select: {
            id: true,
            title: true,
            isActive: true,
            usedCount: true,
          },
        },
        _count: {
          select: {
            publicTestLinks: true,
          },
        },
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const transformedTimeSlots = timeSlots.map((timeSlot) => ({
      id: timeSlot.id,
      name: timeSlot.name,
      description: timeSlot.description,
      startDateTime: timeSlot.startDateTime.toISOString(),
      endDateTime: timeSlot.endDateTime.toISOString(),
      timezone: timeSlot.timezone,
      maxParticipants: timeSlot.maxParticipants,
      currentParticipants: timeSlot.currentParticipants,
      isActive: timeSlot.isActive,
      createdAt: timeSlot.createdAt.toISOString(),
      jobProfile: timeSlot.jobProfile,
      publicTestLinks: timeSlot.publicTestLinks,
      _count: timeSlot._count,
    }));

    return NextResponse.json(transformedTimeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);

    // Check if it's a database connection error
    if (
      error instanceof Error &&
      error.message.includes("Can't reach database server")
    ) {
      return NextResponse.json(
        {
          error:
            'Database connection temporarily unavailable. Please try again.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/time-slots - Create a new time slot
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobProfileId,
      name,
      description,
      startDateTime,
      endDateTime,
      timezone,
      maxParticipants,
    } = body;

    // Check if the user exists in the database
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: `User not found in database. Session user ID: ${session.user.id}`,
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!jobProfileId || !name || !startDateTime || !endDateTime) {
      return NextResponse.json(
        {
          error: 'Job Profile ID, name, start time, and end time are required',
        },
        { status: 400 }
      );
    }

    // Store datetime as-is for now (we'll handle timezone conversion in validation)
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (start >= end) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check if job profile exists
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      select: { id: true, name: true },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    const timeSlot = await prisma.timeSlot.create({
      data: {
        jobProfileId,
        name,
        description,
        startDateTime: start,
        endDateTime: end,
        timezone: timezone || 'UTC',
        maxParticipants: maxParticipants || null,
        createdById: session.user.id,
      },
      include: {
        jobProfile: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: timeSlot.id,
      name: timeSlot.name,
      description: timeSlot.description,
      startDateTime: timeSlot.startDateTime.toISOString(),
      endDateTime: timeSlot.endDateTime.toISOString(),
      timezone: timeSlot.timezone,
      maxParticipants: timeSlot.maxParticipants,
      currentParticipants: timeSlot.currentParticipants,
      isActive: timeSlot.isActive,
      createdAt: timeSlot.createdAt.toISOString(),
      jobProfile: timeSlot.jobProfile,
    });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/time-slots - Delete a time slot
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeSlotId = searchParams.get('timeSlotId');

    if (!timeSlotId) {
      return NextResponse.json(
        { error: 'Time slot ID is required' },
        { status: 400 }
      );
    }

    // Check if time slot exists
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId },
      include: {
        publicTestLinks: {
          select: {
            id: true,
            usedCount: true,
          },
        },
        _count: {
          select: {
            publicTestLinks: true,
          },
        },
      },
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'Time slot not found' },
        { status: 404 }
      );
    }

    // Check if there are any test attempts associated with this time slot
    const hasAttempts = timeSlot.publicTestLinks.some(
      (link) => link.usedCount > 0
    );

    if (hasAttempts) {
      return NextResponse.json(
        {
          error: 'Cannot delete time slot with existing test attempts',
          details:
            'This time slot has associated test attempts. Please archive it instead of deleting.',
        },
        { status: 400 }
      );
    }

    // Delete the time slot (this will cascade delete associated public test links)
    await prisma.timeSlot.delete({
      where: { id: timeSlotId },
    });

    return NextResponse.json({
      message: 'Time slot deleted successfully',
      deletedTimeSlotId: timeSlotId,
      deletedLinksCount: timeSlot._count.publicTestLinks,
    });
  } catch (error) {
    console.error('Error deleting time slot:', error);

    // Check if it's a database connection error
    if (
      error instanceof Error &&
      error.message.includes("Can't reach database server")
    ) {
      return NextResponse.json(
        {
          error:
            'Database connection temporarily unavailable. Please try again.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete time slot' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
