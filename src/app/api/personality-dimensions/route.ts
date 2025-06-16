import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const createPersonalityDimensionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().optional(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code too long')
    .regex(
      /^[A-Z_]+$/,
      'Code must contain only uppercase letters and underscores'
    ),
});

/**
 * @swagger
 * /api/personality-dimensions:
 *   get:
 *     summary: Retrieve all personality dimensions
 *     description: Fetches all personality dimensions from the database.
 *     tags:
 *       - Personality Dimensions
 *     responses:
 *       200:
 *         description: A list of personality dimensions.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PersonalityDimension'
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal server error.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const dimensions = await prisma.personalityDimension.findMany({
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedDimensions = dimensions.map((dimension) => ({
      id: dimension.id,
      name: dimension.name,
      description: dimension.description,
      code: dimension.code,
      questionsCount: dimension._count.questions,
      createdAt: dimension.createdAt.toISOString(),
      updatedAt: dimension.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedDimensions);
  } catch (error) {
    console.error('Error fetching personality dimensions:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/personality-dimensions:
 *   post:
 *     summary: Create a new personality dimension
 *     description: Creates a new personality dimension (admin only).
 *     tags:
 *       - Personality Dimensions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Safety-First Risk Management"
 *               description:
 *                 type: string
 *                 example: "Measures approach to safety and risk assessment"
 *               code:
 *                 type: string
 *                 example: "SAFETY_RISK_MGMT"
 *     responses:
 *       201:
 *         description: Personality dimension created successfully.
 *       400:
 *         description: Validation error or duplicate code/name.
 *       401:
 *         description: Unauthorized.
 *       409:
 *         description: Dimension with same name or code already exists.
 *       500:
 *         description: Internal server error.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body
    const validationResult = createPersonalityDimensionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          message: 'Validation error',
          errors: validationResult.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, description, code } = validationResult.data;

    // Check for existing dimension with same name or code
    const existingDimension = await prisma.personalityDimension.findFirst({
      where: {
        OR: [{ name: name }, { code: code }],
      },
    });

    if (existingDimension) {
      const duplicateField = existingDimension.name === name ? 'name' : 'code';
      return NextResponse.json(
        {
          message: `Personality dimension with this ${duplicateField} already exists`,
          field: duplicateField,
        },
        { status: 409 }
      );
    }

    // Create new personality dimension
    const newDimension = await prisma.personalityDimension.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        code: code.trim().toUpperCase(),
      },
    });

    return NextResponse.json(
      {
        id: newDimension.id,
        name: newDimension.name,
        description: newDimension.description,
        code: newDimension.code,
        questionsCount: 0,
        createdAt: newDimension.createdAt.toISOString(),
        updatedAt: newDimension.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating personality dimension:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
