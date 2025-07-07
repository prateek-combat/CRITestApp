import { NextRequest, NextResponse } from 'next/server';
import { prisma, TestAttemptStatus } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // This is a soft delete. We set the status to ARCHIVED.
    // A separate cleanup process can permanently delete these later.

    try {
      // Try updating a regular test attempt first
      await prisma.testAttempt.update({
        where: { id },
        data: {
          status: TestAttemptStatus.ARCHIVED,
        },
      });
    } catch (error) {
      // If it fails (e.g., not found), try updating a public test attempt
      try {
        await prisma.publicTestAttempt.update({
          where: { id },
          data: {
            status: TestAttemptStatus.ARCHIVED,
          },
        });
      } catch (e) {
        // If both fail, the attempt likely doesn't exist.
        return NextResponse.json(
          { error: 'Test attempt not found or could not be archived.' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, archivedId: id });
  } catch (error) {
    console.error('Error archiving test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to archive test attempt' },
      { status: 500 }
    );
  }
}
