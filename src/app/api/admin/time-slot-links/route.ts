import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

// GET /api/admin/time-slot-links - Get all time-restricted links
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
    const timeSlotId = searchParams.get('timeSlotId');

    // Build where clause - filter by timeSlotId not being null
    const whereClause: any = {
      timeSlotId: {
        not: null,
      },
    };

    if (timeSlotId) {
      whereClause.timeSlotId = timeSlotId;
    }

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const timeSlotLinks = await prisma.publicTestLink.findMany({
      where: whereClause,
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        timeSlot: {
          select: {
            id: true,
            name: true,
            startDateTime: true,
            endDateTime: true,
            timezone: true,
            jobProfile: {
              select: {
                id: true,
                name: true,
              },
            },
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

    const formattedLinks = timeSlotLinks.map((link: any) => ({
      id: link.id,
      testId: link.testId,
      testTitle: link.test.title,
      linkToken: link.linkToken,
      title: link.title,
      description: link.description,
      isActive: link.isActive,
      isTimeRestricted: link.isTimeRestricted,
      timeSlotId: link.timeSlotId,
      usedCount: link.usedCount,
      attemptsCount: link._count.attempts,
      createdAt: link.createdAt.toISOString(),
      publicUrl: `${baseUrl}/public-test/${link.linkToken}`,
      timeSlot: link.timeSlot
        ? {
            id: link.timeSlot.id,
            name: link.timeSlot.name,
            startDateTime: link.timeSlot.startDateTime.toISOString(),
            endDateTime: link.timeSlot.endDateTime.toISOString(),
            timezone: link.timeSlot.timezone,
            jobProfile: link.timeSlot.jobProfile,
          }
        : null,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    console.error('Error fetching time-restricted links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time-restricted links' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE /api/admin/time-slot-links - Delete time-restricted links
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
    const linkId = searchParams.get('linkId');
    const timeSlotId = searchParams.get('timeSlotId');

    if (!linkId && !timeSlotId) {
      return NextResponse.json(
        { error: 'Either linkId or timeSlotId is required' },
        { status: 400 }
      );
    }

    let deleteResult;

    if (linkId) {
      // Delete a specific link
      const link = await prisma.publicTestLink.findUnique({
        where: { id: linkId },
        select: { timeSlotId: true },
      });

      if (!link) {
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }

      if (!link.timeSlotId) {
        return NextResponse.json(
          {
            error:
              'Cannot delete non-time-restricted links through this endpoint',
          },
          { status: 400 }
        );
      }

      deleteResult = await prisma.publicTestLink.delete({
        where: { id: linkId },
      });

      return NextResponse.json({
        message: 'Time-restricted link deleted successfully',
        deletedLinkId: linkId,
      });
    } else if (timeSlotId) {
      // Delete all links for a specific time slot
      deleteResult = await prisma.publicTestLink.deleteMany({
        where: {
          timeSlotId: timeSlotId,
        },
      });

      return NextResponse.json({
        message: `Deleted ${deleteResult.count} time-restricted links for time slot`,
        deletedCount: deleteResult.count,
        timeSlotId: timeSlotId,
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting time-restricted links:', error);
    return NextResponse.json(
      { error: 'Failed to delete time-restricted links' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
