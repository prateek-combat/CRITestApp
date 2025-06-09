import { NextResponse } from 'next/server';
import { PrismaClient, QuestionCategory } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'], // Optional: configure logging
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Retrieve a specific question by ID
 *     description: Fetches a single question from the database using its ID.
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the question to retrieve.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The requested question.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       404:
 *         description: Question not found.
 *       500:
 *         description: Failed to fetch question.
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const question = await prisma.question.findUnique({
      where: { id },
    });
    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(question);
  } catch (error) {
    console.error(
      `[API /api/questions/${id} GET] Failed to fetch question:`,
      error
    );
    return NextResponse.json(
      { message: 'Failed to fetch question', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update an existing question
 *     description: Modifies an existing question in the database by its ID.
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the question to update.
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateQuestionInput'
 *     responses:
 *       200:
 *         description: Question updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Bad request (e.g., invalid data).
 *       404:
 *         description: Question not found or related Test not found.
 *       500:
 *         description: Failed to update question.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const {
      promptText,
      promptImageUrl,
      timerSeconds,
      answerOptions,
      correctAnswerIndex,
      category,
      sectionTag,
    } = body;

    // Validate required fields
    if (!promptText || !answerOptions || answerOptions.length < 2) {
      return NextResponse.json(
        { error: 'Prompt text and at least 2 answer options are required' },
        { status: 400 }
      );
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex >= answerOptions.length) {
      return NextResponse.json(
        { error: 'Correct answer index is invalid' },
        { status: 400 }
      );
    }

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: {
        promptText,
        promptImageUrl: promptImageUrl || null,
        timerSeconds: parseInt(timerSeconds),
        answerOptions,
        correctAnswerIndex: parseInt(correctAnswerIndex),
        category,
        sectionTag: sectionTag || null,
      },
    });

    return NextResponse.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question by ID
 *     description: Removes a question from the database by its ID.
 *     tags:
 *       - Questions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the question to delete.
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Question deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Question deleted successfully
 *       404:
 *         description: Question not found.
 *       500:
 *         description: Failed to delete question.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
    });

    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Delete the question (this will cascade delete related submitted answers)
    await prisma.question.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}
