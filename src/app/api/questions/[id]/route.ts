import { NextResponse } from 'next/server';
import { PrismaClient, QuestionCategory } from '@prisma/client';

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
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const {
      promptText,
      promptImageUrl,
      timerSeconds,
      answerOptions,
      correctAnswerIndex,
      category,
      testId,
    } = body;

    // Basic validation for fields if they are provided
    if (
      answerOptions !== undefined &&
      (!Array.isArray(answerOptions) ||
        answerOptions.length < 2 ||
        answerOptions.length > 6)
    ) {
      return NextResponse.json(
        {
          message:
            'If provided, answerOptions must be an array of 2 to 6 strings.',
        },
        { status: 400 }
      );
    }

    const validTimers = [15, 30, 45, 60];
    if (timerSeconds !== undefined && !validTimers.includes(timerSeconds)) {
      return NextResponse.json(
        {
          message: `If provided, timerSeconds must be one of ${validTimers.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    if (
      correctAnswerIndex !== undefined &&
      answerOptions !== undefined &&
      (correctAnswerIndex < 0 || correctAnswerIndex >= answerOptions.length)
    ) {
      return NextResponse.json(
        {
          message:
            'correctAnswerIndex is out of bounds for the provided answerOptions.',
        },
        { status: 400 }
      );
    }

    // Validate category if provided
    if (
      category !== undefined &&
      !Object.values(QuestionCategory).includes(category as QuestionCategory)
    ) {
      return NextResponse.json(
        {
          message: `If provided, category must be one of: ${Object.values(QuestionCategory).join(', ')}`,
        },
        { status: 400 }
      );
    }

    // If testId is provided, ensure the target test exists
    if (testId) {
      const testExists = await prisma.test.findUnique({
        where: { id: testId },
      });
      if (!testExists) {
        return NextResponse.json(
          { message: `Target Test with ID ${testId} not found.` },
          { status: 404 }
        );
      }
    }

    const dataToUpdate: any = {};
    if (promptText !== undefined) dataToUpdate.promptText = promptText;
    if (promptImageUrl !== undefined)
      dataToUpdate.promptImageUrl = promptImageUrl;
    if (timerSeconds !== undefined) dataToUpdate.timerSeconds = timerSeconds;
    if (answerOptions !== undefined) dataToUpdate.answerOptions = answerOptions;
    if (correctAnswerIndex !== undefined)
      dataToUpdate.correctAnswerIndex = correctAnswerIndex;
    if (category !== undefined)
      dataToUpdate.category = category as QuestionCategory;
    if (testId !== undefined) dataToUpdate.testId = testId;

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: 'No fields provided to update.' },
        { status: 400 }
      );
    }

    const updatedQuestion = await prisma.question.update({
      where: { id },
      data: dataToUpdate,
    });
    return NextResponse.json(updatedQuestion);
  } catch (error: any) {
    console.error(
      `[API /api/questions/${id} PUT] Failed to update question:`,
      error
    );
    if (error.code === 'P2025') {
      // Record to update not found
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to update question', error: String(error) },
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
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    await prisma.question.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Question deleted successfully' });
  } catch (error: any) {
    console.error(
      `[API /api/questions/${id} DELETE] Failed to delete question:`,
      error
    );
    if (error.code === 'P2025') {
      // Record to delete not found
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to delete question', error: String(error) },
      { status: 500 }
    );
  }
}
