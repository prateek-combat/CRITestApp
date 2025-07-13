import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Increase timeout for this API route (Vercel functions)
export const maxDuration = 60; // 60 seconds instead of default 10s
export const dynamic = 'force-dynamic';

// Helper function to get current time in a specific timezone as a Date object
function getCurrentTimeInTimezone(timezone: string): Date {
  try {
    const now = new Date();
    // Get current time formatted in the target timezone
    const timeInTZ = now.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the formatted time back to a Date object
    return new Date(timeInTZ);
  } catch (error) {
    logger.error(
      'Failed to get current time in timezone',
      {
        operation: 'timezone_conversion',
        timezone,
        method: 'GET',
        path: '/api/public-test/[token]',
      },
      error as Error
    );
    return new Date(); // fallback to current time
  }
}

// Helper function to interpret a stored datetime as if it's in the specified timezone
function interpretDateTimeInTimezone(
  storedDateTime: Date,
  timezone: string
): Date {
  try {
    // The stored datetime is from datetime-local input, which doesn't include timezone
    // We need to interpret it as if it was entered in the specified timezone
    const timeString = storedDateTime.toISOString().slice(0, 19); // Remove 'Z' and timezone
    const localTime = new Date(timeString);

    // Get the time as if it was in the specified timezone
    const timeInTZ = localTime.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    return new Date(timeInTZ);
  } catch (error) {
    logger.error(
      'Failed to interpret datetime in timezone',
      {
        operation: 'timezone_interpretation',
        timezone,
        method: 'GET',
        path: '/api/public-test/[token]',
      },
      error as Error
    );
    return storedDateTime; // fallback to original datetime
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now();

  try {
    const { token } = await params;
    logger.info('Fetching public test link', {
      operation: 'fetch_public_link',
      token,
      method: 'GET',
      path: '/api/public-test/[token]',
    });

    const publicLink = await prisma.publicTestLink.findUnique({
      where: {
        linkToken: token,
      },
      select: {
        id: true,
        testId: true,
        title: true,
        description: true,
        isActive: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        isTimeRestricted: true,
        timeSlotId: true,
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
            maxParticipants: true,
            currentParticipants: true,
            isActive: true,
          },
        },
      },
    });
    logger.debug('Database query completed for public link', {
      operation: 'db_query_complete',
      token,
      method: 'GET',
      path: '/api/public-test/[token]',
    });

    if (!publicLink) {
      logger.warn('Public test link not found', {
        operation: 'link_not_found',
        token,
        method: 'GET',
        path: '/api/public-test/[token]',
      });
      return NextResponse.json({ error: 'Invalid test link' }, { status: 404 });
    }

    // Check if link is active
    if (!publicLink.isActive) {
      logger.warn('Public test link is inactive', {
        operation: 'link_inactive',
        token,
        linkId: publicLink.id,
        method: 'GET',
        path: '/api/public-test/[token]',
      });
      return NextResponse.json(
        { error: 'This test link has been deactivated' },
        { status: 403 }
      );
    }

    // Check if link has expired
    if (publicLink.expiresAt && new Date(publicLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This test link has expired' },
        { status: 403 }
      );
    }

    // Check if max uses reached
    if (publicLink.maxUses && publicLink.usedCount >= publicLink.maxUses) {
      return NextResponse.json(
        { error: 'This test link has reached its usage limit' },
        { status: 403 }
      );
    }

    // Check time slot restrictions if this is a time-restricted link
    if (publicLink.isTimeRestricted && publicLink.timeSlot) {
      const timeSlotTimezone = publicLink.timeSlot.timezone;
      const now = new Date();
      const startTime = new Date(publicLink.timeSlot.startDateTime);
      const endTime = new Date(publicLink.timeSlot.endDateTime);

      if (!publicLink.timeSlot.isActive) {
        return NextResponse.json(
          { error: 'This time slot is not active' },
          { status: 403 }
        );
      }

      // Get current time in the time slot's timezone
      const currentTimeInTZ = getCurrentTimeInTimezone(timeSlotTimezone);

      // Interpret the stored start/end times as if they were in the time slot's timezone
      const startTimeInTZ = interpretDateTimeInTimezone(
        startTime,
        timeSlotTimezone
      );
      const endTimeInTZ = interpretDateTimeInTimezone(
        endTime,
        timeSlotTimezone
      );

      // Debug logging to help identify timezone issues
      logger.debug('Validating time slot timezone constraints', {
        operation: 'timezone_validation',
        token,
        timeSlotId: publicLink.timeSlot.id,
        timezone: timeSlotTimezone,
        currentTime: now.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        currentTimeInTZ: currentTimeInTZ.toISOString(),
        startTimeInTZ: startTimeInTZ.toISOString(),
        endTimeInTZ: endTimeInTZ.toISOString(),
        method: 'GET',
        path: '/api/public-test/[token]',
      });

      if (currentTimeInTZ < startTimeInTZ) {
        return NextResponse.json(
          {
            error: 'Time slot not yet started',
            timeSlotInfo: {
              name: publicLink.timeSlot.name,
              startDateTime: publicLink.timeSlot.startDateTime,
              endDateTime: publicLink.timeSlot.endDateTime,
              timezone: publicLink.timeSlot.timezone,
              message: `This test will be available from ${startTimeInTZ.toLocaleString()} to ${endTimeInTZ.toLocaleString()} (${publicLink.timeSlot.timezone})`,
            },
          },
          { status: 403 }
        );
      }

      if (currentTimeInTZ > endTimeInTZ) {
        return NextResponse.json(
          {
            error: 'Time slot has ended',
            timeSlotInfo: {
              name: publicLink.timeSlot.name,
              startDateTime: publicLink.timeSlot.startDateTime,
              endDateTime: publicLink.timeSlot.endDateTime,
              timezone: publicLink.timeSlot.timezone,
              message: `This test was available from ${startTimeInTZ.toLocaleString()} to ${endTimeInTZ.toLocaleString()} (${publicLink.timeSlot.timezone})`,
            },
          },
          { status: 403 }
        );
      }

      // Check if time slot is full
      if (
        publicLink.timeSlot.maxParticipants &&
        publicLink.timeSlot.currentParticipants >=
          publicLink.timeSlot.maxParticipants
      ) {
        return NextResponse.json(
          {
            error: 'Time slot is full',
            timeSlotInfo: {
              name: publicLink.timeSlot.name,
              maxParticipants: publicLink.timeSlot.maxParticipants,
              currentParticipants: publicLink.timeSlot.currentParticipants,
              message: `This time slot is full (${publicLink.timeSlot.currentParticipants}/${publicLink.timeSlot.maxParticipants} participants)`,
            },
          },
          { status: 403 }
        );
      }
    }

    logger.info('Public test link validation successful', {
      operation: 'link_validation_success',
      token,
      testId: publicLink.testId,
      testTitle: publicLink.test.title,
      isTimeRestricted: publicLink.isTimeRestricted,
      method: 'GET',
      path: '/api/public-test/[token]',
    });
    return NextResponse.json({
      id: publicLink.id,
      testId: publicLink.testId,
      testTitle: publicLink.test.title,
      title: publicLink.title,
      description: publicLink.description,
      isActive: publicLink.isActive,
      expiresAt: publicLink.expiresAt?.toISOString(),
      maxUses: publicLink.maxUses,
      usedCount: publicLink.usedCount,
      isTimeRestricted: publicLink.isTimeRestricted,
      timeSlot: publicLink.timeSlot
        ? {
            id: publicLink.timeSlot.id,
            name: publicLink.timeSlot.name,
            startDateTime: publicLink.timeSlot.startDateTime.toISOString(),
            endDateTime: publicLink.timeSlot.endDateTime.toISOString(),
            timezone: publicLink.timeSlot.timezone,
            maxParticipants: publicLink.timeSlot.maxParticipants,
            currentParticipants: publicLink.timeSlot.currentParticipants,
            isActive: publicLink.timeSlot.isActive,
          }
        : null,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(
      'Failed to process public test link request',
      {
        operation: 'process_public_link',
        duration,
        method: 'GET',
        path: '/api/public-test/[token]',
      },
      error as Error
    );

    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes('timeout')) {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' },
        { status: 504 }
      );
    } else if (errorMessage.includes('connection')) {
      return NextResponse.json(
        { error: 'Database connection issue. Please try again.' },
        { status: 503 }
      );
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch test link. Please try again.' },
        { status: 500 }
      );
    }
  }
}
