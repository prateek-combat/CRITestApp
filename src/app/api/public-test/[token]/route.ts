import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ token: string }>;
}

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
    console.error('Error getting current time in timezone:', error);
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
    console.error('Error interpreting datetime in timezone:', error);
    return storedDateTime; // fallback to original datetime
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

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

    if (!publicLink) {
      return NextResponse.json({ error: 'Invalid test link' }, { status: 404 });
    }

    // Check if link is active
    if (!publicLink.isActive) {
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

      // Debug logging to help identify issues
      console.log('Timezone validation:', {
        timezone: timeSlotTimezone,
        currentTime: now.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        currentTimeInTZ: currentTimeInTZ.toISOString(),
        startTimeInTZ: startTimeInTZ.toISOString(),
        endTimeInTZ: endTimeInTZ.toISOString(),
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
    console.error('Error fetching public test link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch test link' },
      { status: 500 }
    );
  }
}
