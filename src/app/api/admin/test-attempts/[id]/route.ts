import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    // Check if it's a regular test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id },
    });

    if (testAttempt) {
      // Use a transaction to ensure all related data is deleted
      await prisma.$transaction(async (tx) => {
        await tx.proctorEvent.deleteMany({ where: { attemptId: id } });
        await tx.proctorAsset.deleteMany({ where: { attemptId: id } });
        await tx.submittedAnswer.deleteMany({ where: { testAttemptId: id } });
        await tx.testAttempt.delete({ where: { id } });
      });
    } else {
      // If not a regular attempt, check if it's a public test attempt
      const publicTestAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id },
      });

      if (publicTestAttempt) {
        await prisma.$transaction(async (tx) => {
          await tx.publicProctorEvent.deleteMany({ where: { attemptId: id } });
          await tx.publicProctorAsset.deleteMany({ where: { attemptId: id } });
          await tx.publicSubmittedAnswer.deleteMany({
            where: { attemptId: id },
          });
          await tx.publicTestAttempt.delete({ where: { id } });
        });
      } else {
        return NextResponse.json(
          { error: 'Test attempt not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting test attempt:', error);
    return NextResponse.json(
      { error: 'Failed to delete test attempt' },
      { status: 500 }
    );
  }
}
