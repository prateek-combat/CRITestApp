import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const updatePersonalityDimensionSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name too long')
    .optional(),
  description: z.string().optional(),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50, 'Code too long')
    .regex(
      /^[A-Z_]+$/,
      'Code must contain only uppercase letters and underscores'
    )
    .optional(),
});

/**
 * @swagger
 * /api/personality-dimensions/{id}:
 *   get:
 *     summary: Get a specific personality dimension
 *     description: Retrieves details of a specific personality dimension by ID.
 *     tags:
 *       - Personality Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The personality dimension ID
 *     responses:
 *       200:
 *         description: Personality dimension details.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Personality dimension not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

    const { id } = await params;

    const dimension = await prisma.personalityDimension.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
          },
        },
        questions: {
          select: {
            id: true,
            promptText: true,
            testId: true,
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!dimension) {
      return NextResponse.json(
        { message: 'Personality dimension not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: dimension.id,
      name: dimension.name,
      description: dimension.description,
      code: dimension.code,
      questionsCount: dimension._count.questions,
      questions: dimension.questions,
      createdAt: dimension.createdAt.toISOString(),
      updatedAt: dimension.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching personality dimension:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/personality-dimensions/{id}:
 *   put:
 *     summary: Update a personality dimension
 *     description: Updates a specific personality dimension (admin only).
 *     tags:
 *       - Personality Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The personality dimension ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Safety Management"
 *               description:
 *                 type: string
 *                 example: "Updated description of safety approach"
 *               code:
 *                 type: string
 *                 example: "UPDATED_SAFETY_MGMT"
 *     responses:
 *       200:
 *         description: Personality dimension updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Personality dimension not found.
 *       409:
 *         description: Dimension with same name or code already exists.
 *       500:
 *         description: Internal server error.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updatePersonalityDimensionSchema.safeParse(body);
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

    // Check if dimension exists
    const existingDimension = await prisma.personalityDimension.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existingDimension) {
      return NextResponse.json(
        { message: 'Personality dimension not found' },
        { status: 404 }
      );
    }

    const { name, description, code } = validationResult.data;

    // Check for conflicts with other dimensions (excluding current one)
    if (name || code) {
      const conflictConditions = [];
      if (name) conflictConditions.push({ name });
      if (code) conflictConditions.push({ code: code.toUpperCase() });

      const conflictingDimension = await prisma.personalityDimension.findFirst({
        where: {
          AND: [{ id: { not: id } }, { OR: conflictConditions }],
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

      if (conflictingDimension) {
        const duplicateField =
          conflictingDimension.name === name ? 'name' : 'code';
        return NextResponse.json(
          {
            message: `Another personality dimension with this ${duplicateField} already exists`,
            field: duplicateField,
          },
          { status: 409 }
        );
      }
    }

    // Update dimension
    const updatedDimension = await prisma.personalityDimension.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(code && { code: code.trim().toUpperCase() }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedDimension.id,
      name: updatedDimension.name,
      description: updatedDimension.description,
      code: updatedDimension.code,
      questionsCount: updatedDimension._count.questions,
      createdAt: updatedDimension.createdAt.toISOString(),
      updatedAt: updatedDimension.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error updating personality dimension:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/personality-dimensions/{id}:
 *   delete:
 *     summary: Delete a personality dimension
 *     description: Soft deletes a personality dimension (admin only). Cannot delete if it has associated questions.
 *     tags:
 *       - Personality Dimensions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The personality dimension ID
 *     responses:
 *       200:
 *         description: Personality dimension deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Personality dimension not found.
 *       409:
 *         description: Cannot delete dimension with associated questions.
 *       500:
 *         description: Internal server error.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }

    const { id } = await params;

    // Check if dimension exists
    const existingDimension = await prisma.personalityDimension.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!existingDimension) {
      return NextResponse.json(
        { message: 'Personality dimension not found' },
        { status: 404 }
      );
    }

    // Check if dimension has associated questions
    if (existingDimension._count.questions > 0) {
      return NextResponse.json(
        {
          message:
            'Cannot delete personality dimension with associated questions',
          questionsCount: existingDimension._count.questions,
        },
        { status: 409 }
      );
    }

    // Delete the dimension
    await prisma.personalityDimension.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Personality dimension deleted successfully',
      deletedDimension: {
        id: existingDimension.id,
        name: existingDimension.name,
        code: existingDimension.code,
      },
    });
  } catch (error) {
    console.error('Error deleting personality dimension:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
