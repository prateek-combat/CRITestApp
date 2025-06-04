import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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
    const { title, description, lockOrder } = body;

    const dataToUpdate: any = {};

    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (lockOrder !== undefined) dataToUpdate.lockOrder = lockOrder;

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
 *     summary: Delete a test
 *     description: Deletes a test and all its questions.
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
 *         description: Test deleted successfully.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to delete test.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.test.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Test deleted successfully' });
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
