import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/tests/{id}/archive:
 *   post:
 *     summary: Archive a test (SUPER_ADMIN only)
 *     description: Archives a test instead of permanently deleting it. Only SUPER_ADMIN can archive tests.
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
 *         description: Test archived successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Test archived successfully
 *                 canRestore:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Insufficient permissions - SUPER_ADMIN required.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to archive test.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and SUPER_ADMIN access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Only SUPER_ADMIN can archive tests
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Insufficient permissions - SUPER_ADMIN required' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if test exists and is not already archived
    const existingTest = await prisma.test.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
          },
        },
      },
    });

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    if (existingTest.isArchived) {
      return NextResponse.json(
        { error: 'Test is already archived' },
        { status: 400 }
      );
    }

    // Archive the test
    await prisma.test.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        archivedById: user.id,
      },
    });

    return NextResponse.json({
      message: 'Test archived successfully',
      canRestore: true,
      testInfo: {
        title: existingTest.title,
        questionsCount: existingTest._count.questions,
        invitationsCount: existingTest._count.invitations,
        attemptsCount: existingTest._count.testAttempts,
      },
    });
  } catch (error) {
    console.error('Error archiving test:', error);
    return NextResponse.json(
      { error: 'Failed to archive test' },
      { status: 500 }
    );
  }
}
