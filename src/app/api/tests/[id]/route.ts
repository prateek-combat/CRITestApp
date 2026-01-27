import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { apiCache } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

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
    // Check authentication for admin access
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

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
    logger.error(
      'Failed to fetch test',
      {
        operation: 'get_test',
        service: 'tests',
        testId: id,
        method: 'GET',
        path: `/api/tests/${id}`,
      },
      error as Error
    );
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

    // Clear the cache after update
    apiCache.delete('tests:all');

    return NextResponse.json(updatedTest);
  } catch (error) {
    logger.error(
      'Failed to update test',
      {
        operation: 'update_test',
        service: 'tests',
        testId: id,
        method: 'PATCH',
        path: `/api/tests/${id}`,
      },
      error as Error
    );
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
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

    // Only SUPER_ADMIN can permanently delete tests
    if (session.user.role !== 'SUPER_ADMIN') {
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

    // Clear the cache after deletion
    apiCache.delete('tests:all');

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
    logger.error(
      'Failed to delete test',
      {
        operation: 'delete_test',
        service: 'tests',
        testId: id,
        method: 'DELETE',
        path: `/api/tests/${id}`,
      },
      error as Error
    );
    return NextResponse.json(
      { message: 'Failed to delete test', error: String(error) },
      { status: 500 }
    );
  }
}
