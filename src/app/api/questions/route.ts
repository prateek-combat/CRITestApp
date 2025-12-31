import { NextResponse } from 'next/server';
import { QuestionCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Retrieve a list of questions
 *     description: Fetches all questions from the database.
 *     tags:
 *       - Questions
 *     responses:
 *       200:
 *         description: A list of questions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 *       500:
 *         description: Failed to fetch questions.
 */
export async function GET() {
  try {
    const questions = await prisma.question.findMany();
    // No mapping needed, Prisma returns timerSeconds as per schema
    return NextResponse.json(questions);
  } catch (error) {
    console.error('[API /api/questions GET] Failed to fetch questions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch questions', error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     description: Adds a new question to the database.
 *     tags:
 *       - Questions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateQuestionInput'
 *     responses:
 *       201:
 *         description: Question created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Question'
 *       400:
 *         description: Bad request (e.g., missing required fields, invalid data).
 *       404:
 *         description: Related entity (e.g., Test) not found.
 *       409:
 *         description: Conflict (e.g., unique constraint violation).
 *       500:
 *         description: Failed to create question.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      promptText,
      promptImageUrl,
      timerSeconds, // This comes from the client and is the correct field name for Prisma
      answerOptions,
      correctAnswerIndex,
      category, // Added category
      testId,
    } = body;

    // Basic validation
    if (
      promptText === undefined ||
      timerSeconds === undefined ||
      answerOptions === undefined ||
      correctAnswerIndex === undefined ||
      testId === undefined ||
      category === undefined
    ) {
      // Added category to validation
      return NextResponse.json(
        {
          message:
            'Missing required fields: promptText, timerSeconds, answerOptions, correctAnswerIndex, testId, and category are required.',
        },
        { status: 400 }
      );
    }

    // Validate category
    if (
      !Object.values(QuestionCategory).includes(category as QuestionCategory)
    ) {
      return NextResponse.json(
        {
          message: `Invalid category. Must be one of: ${Object.values(QuestionCategory).join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(answerOptions) ||
      answerOptions.length < 2 ||
      answerOptions.length > 6
    ) {
      // Adjusted min to 2 as per general tests, can be 4-6 if strict
      return NextResponse.json(
        { message: 'answerOptions must be an array of 2 to 6 strings.' },
        { status: 400 }
      );
    }

    const validTimers = [15, 30, 45, 60];
    if (!validTimers.includes(timerSeconds)) {
      return NextResponse.json(
        { message: `timerSeconds must be one of ${validTimers.join(', ')}.` },
        { status: 400 }
      );
    }

    if (correctAnswerIndex < 0 || correctAnswerIndex >= answerOptions.length) {
      return NextResponse.json(
        {
          message:
            'correctAnswerIndex is out of bounds for the provided answerOptions.',
        },
        { status: 400 }
      );
    }

    const testExists = await prisma.test.findUnique({ where: { id: testId } });
    if (!testExists) {
      return NextResponse.json(
        { message: `Test with ID ${testId} not found.` },
        { status: 404 }
      );
    }

    const newQuestion = await prisma.question.create({
      data: {
        promptText,
        promptImageUrl: promptImageUrl || null,
        timerSeconds, // Correct: Use timerSeconds directly as per schema
        answerOptions,
        correctAnswerIndex,
        category: category as QuestionCategory, // Added category, casting to QuestionCategory
        test: {
          connect: { id: testId },
        },
      },
    });

    // No mapping needed for timerSeconds in the response
    return NextResponse.json(newQuestion, { status: 201 });
  } catch (error: any) {
    console.error(
      '[API /api/questions POST] Failed to create question:',
      error
    );
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          message:
            'A question with this identifier might already exist or related data is invalid.',
          error: String(error),
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to create question', error: String(error) },
      { status: 500 }
    );
  }
}
