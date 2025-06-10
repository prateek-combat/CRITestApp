import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/tests/{id}/restore:
 *   post:
 *     summary: Restore an archived test (SUPER_ADMIN only)
 *     description: Restores a previously archived test. Only SUPER_ADMIN can restore tests.
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Test restored successfully.
 *       403:
 *         description: Insufficient permissions - SUPER_ADMIN required.
 *       404:
 *         description: Test not found or not archived.
 *       500:
 *         description: Failed to restore test.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and SUPER_ADMIN access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Only SUPER_ADMIN can restore tests
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions - SUPER_ADMIN required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if test exists and is archived
    const existingTest = await prisma.test.findUnique({
      where: { id },
    });

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (!existingTest.isArchived) {
      return NextResponse.json(
        { error: 'Test is not archived' },
        { status: 400 }
      );
    }

    // Restore the test
    await prisma.test.update({
      where: { id },
      data: {
        isArchived: false,
        archivedAt: null,
        archivedById: null,
      },
    });

    return NextResponse.json({
      message: 'Test restored successfully',
      testInfo: {
        title: existingTest.title,
        id: existingTest.id,
      },
    });
  } catch (error) {
    console.error('Error restoring test:', error);
    return NextResponse.json(
      { error: 'Failed to restore test' },
      { status: 500 }
    );
  }
}
