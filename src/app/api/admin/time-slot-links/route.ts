import { requireAdmin } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/time-slot-links - Get all time-restricted links
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
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
  }
}

// DELETE /api/admin/time-slot-links - Delete time-restricted links
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
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
        select: {
          timeSlotId: true,
          _count: {
            select: {
              attempts: true,
            },
          },
        },
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
        attemptCount: link._count.attempts,
        note:
          link._count.attempts > 0
            ? `${link._count.attempts} test attempts were preserved in the database with their publicLinkId set to NULL`
            : 'No test attempts were associated with this link',
      });
    } else if (timeSlotId) {
      // Delete all links for a specific time slot that have no attempts
      deleteResult = await prisma.publicTestLink.deleteMany({
        where: {
          timeSlotId: timeSlotId,
          attempts: {
            none: {},
          },
        },
      });

      // Count total links and links with attempts
      const totalLinks = await prisma.publicTestLink.count({
        where: { timeSlotId: timeSlotId },
      });

      const linksWithAttempts = totalLinks - deleteResult.count;

      return NextResponse.json({
        message: `Deleted ${deleteResult.count} time-restricted links without attempts`,
        deletedCount: deleteResult.count,
        preservedCount: linksWithAttempts,
        timeSlotId: timeSlotId,
        note:
          linksWithAttempts > 0
            ? `${linksWithAttempts} links with test attempts were preserved`
            : 'All links were deleted successfully',
      });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting time-restricted links:', error);
    return NextResponse.json(
      { error: 'Failed to delete time-restricted links' },
      { status: 500 }
    );
  }
}
