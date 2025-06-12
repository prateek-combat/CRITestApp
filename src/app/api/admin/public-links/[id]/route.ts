import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isActive } = await request.json();
    const linkId = params.id;

    const updatedLink = await prisma.publicTestLink.update({
      where: { id: linkId },
      data: { isActive },
    });

    return NextResponse.json(updatedLink);
  } catch (error) {
    console.error('Error updating public link:', error);
    return NextResponse.json(
      { error: 'Failed to update public link' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const linkId = params.id;

    // Check if there are any test attempts associated with this link
    const attemptCount = await prisma.publicTestAttempt.count({
      where: { publicLinkId: linkId },
    });

    if (attemptCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete public link with ${attemptCount} test attempts. Deactivate it instead.`,
        },
        { status: 400 }
      );
    }

    await prisma.publicTestLink.delete({
      where: { id: linkId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting public link:', error);
    return NextResponse.json(
      { error: 'Failed to delete public link' },
      { status: 500 }
    );
  }
}
