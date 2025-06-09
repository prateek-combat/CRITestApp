import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/tests:
 *   get:
 *     summary: Retrieve a list of tests
 *     description: Fetches all tests from the database.
 *     tags:
 *       - Tests
 *     responses:
 *       200:
 *         description: A list of tests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Test'
 *       500:
 *         description: Failed to fetch tests.
 */
export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      include: {
        _count: {
          select: {
            questions: true,
            invitations: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedTests = tests.map((test: any) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      createdAt: test.createdAt.toISOString(),
      questionsCount: test._count.questions,
      invitationsCount: test._count.invitations,
    }));

    return NextResponse.json(formattedTests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tests:
 *   post:
 *     summary: Create a new test
 *     description: Adds a new test to the database.
 *     tags:
 *       - Tests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTestInput'
 *     responses:
 *       201:
 *         description: Test created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Test'
 *       400:
 *         description: Bad request (e.g., missing required fields).
 *       404:
 *         description: Creator user not found.
 *       500:
 *         description: Failed to create test.
 */
export async function POST(request: NextRequest) {
  try {
    const { title, description, allowReview } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // For now, we'll use a default admin user
    // In a real app, you'd get this from authentication
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    // If no admin user exists, create one
    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@testplatform.com',
          passwordHash: 'dummy', // In real app, this would be hashed
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
    }

    const test = await prisma.test.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        overallTimeLimitSeconds: 3600, // Default 1 hour
        allowReview: allowReview !== undefined ? allowReview : true, // Default to true
        createdById: adminUser.id,
      },
    });

    return NextResponse.json({
      id: test.id,
      title: test.title,
      description: test.description,
      allowReview: test.allowReview,
      createdAt: test.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating test:', error);
    return NextResponse.json(
      { error: 'Failed to create test' },
      { status: 500 }
    );
  }
}
