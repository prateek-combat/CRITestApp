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

    // Find and update public test attempt
    const publicAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id },
    });

    if (!publicAttempt) {
      return NextResponse.json(
        { error: 'Public test attempt not found' },
        { status: 404 }
      );
    }

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
  } catch (error) {
    console.error('Error updating public test permissions:', error);
    return NextResponse.json(
      { error: 'Failed to update permissions' },
      { status: 500 }
    );
  }
}
