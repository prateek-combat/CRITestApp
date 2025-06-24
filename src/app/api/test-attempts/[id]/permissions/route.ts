import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { permissionsGranted, proctoringEnabled } = body;

    // Validate input
    if (typeof permissionsGranted !== 'boolean') {
      return NextResponse.json(
        { error: 'permissionsGranted must be a boolean' },
        { status: 400 }
      );
    }

    // Try to find test attempt by ID first
    let testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
    });

    // If not found, try public test attempt
    if (!testAttempt) {
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id },
      });

      if (publicAttempt) {
        // Update public test attempt
        const updatedPublicAttempt = await prisma.publicTestAttempt.update({
          where: { id },
          data: {
            permissionsGranted,
            proctoringEnabled: proctoringEnabled ?? permissionsGranted,
            proctoringStartedAt: permissionsGranted ? new Date() : null,
          },
        });

        return NextResponse.json({
          success: true,
          attempt: updatedPublicAttempt,
        });
      }

      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Update regular test attempt
    const updatedAttempt = await prisma.testAttempt.update({
      where: { id },
      data: {
        permissionsGranted,
        proctoringEnabled: proctoringEnabled ?? permissionsGranted,
        proctoringStartedAt: permissionsGranted ? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      attempt: updatedAttempt,
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
