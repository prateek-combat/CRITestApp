import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/tests/{id}:
 *   get:
 *     summary: Get a test by ID
 *     description: Retrieves a test and its questions by ID.
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
 *         description: Test found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to fetch test.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const test = await prisma.test.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
        createdBy: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });
    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }
    return NextResponse.json(test);
  } catch (error) {
    console.error(`[API /api/tests/${id} GET] Failed to fetch test:`, error);
    return NextResponse.json(
      { message: 'Failed to fetch test', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tests/{id}:
 *   patch:
 *     summary: Update a test
 *     description: Updates a test's details.
 *     tags:
 *       - Tests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTestInput'
 *     responses:
 *       200:
 *         description: Test updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to update test.
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, lockOrder, allowReview } = body;

    const dataToUpdate: any = {};

    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (lockOrder !== undefined) dataToUpdate.lockOrder = lockOrder;
    if (allowReview !== undefined) dataToUpdate.allowReview = allowReview;

    const updatedTest = await prisma.test.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error(`[API /api/tests/${id} PATCH] Failed to update test:`, error);
    return NextResponse.json(
      { message: 'Failed to update test', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tests/{id}:
 *   delete:
 *     summary: Permanently delete a test (SUPER_ADMIN only)
 *     description: Permanently deletes a test and all its questions. Only SUPER_ADMIN can permanently delete tests. Consider using archive instead.
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
 *         description: Test permanently deleted successfully.
 *       403:
 *         description: Insufficient permissions - SUPER_ADMIN required.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to delete test.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    // Check authentication and SUPER_ADMIN access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    // Only SUPER_ADMIN can permanently delete tests
    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        {
          error:
            'Insufficient permissions - SUPER_ADMIN required for permanent deletion',
        },
        { status: 403 }
      );
    }

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id },
      select: {
        title: true,
        isArchived: true,
        archivedAt: true,
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

    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Test permanently deleted successfully',
      deletedTest: {
        title: existingTest.title,
        wasArchived: existingTest.isArchived,
        questionsDeleted: existingTest._count.questions,
        invitationsDeleted: existingTest._count.invitations,
        attemptsDeleted: existingTest._count.testAttempts,
      },
    });
  } catch (error) {
    console.error(
      `[API /api/tests/${id} DELETE] Failed to delete test:`,
      error
    );
    return NextResponse.json(
      { message: 'Failed to delete test', error: String(error) },
      { status: 500 }
    );
  }
}
