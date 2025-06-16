import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { testAttemptId, activity } = await request.json();

    if (!testAttemptId || !activity) {
      return NextResponse.json(
        { message: 'Test attempt ID and activity are required' },
        { status: 400 }
      );
    }

    // Verify test attempt exists
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: testAttemptId },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { message: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Add the activity to the proctoring events
    const existingEvents = (testAttempt.proctoringEvents as any[]) || [];
    const newEvent = {
      type: 'suspicious_activity',
      timestamp: new Date().toISOString(),
      data: activity,
    };

    // Update the test attempt with the new proctoring event
    await prisma.testAttempt.update({
      where: { id: testAttemptId },
      data: {
        proctoringEvents: [...existingEvents, newEvent],
        // Increment risk score based on activity severity
        riskScore: {
          increment:
            activity.severity === 'high'
              ? 10
              : activity.severity === 'medium'
                ? 5
                : 2,
        },
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error logging proctoring activity:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
