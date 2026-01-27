import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Disable caching

/**
 * GET /api/admin/positions/[id]
 * Get a specific position by ID
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

    const position = await prisma.position.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        tests: {
          select: {
            id: true,
            title: true,
            description: true,
            isArchived: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Add test counts
    const responseData = {
      ...position,
      testCount: position.tests.length,
      activeTestCount: position.tests.filter((test) => !test.isArchived).length,
      archivedTestCount: position.tests.filter((test) => test.isArchived)
        .length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/positions/[id]
 * Update a specific position
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
    const { name, code, description, department, level, isActive } = body;

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check for conflicts with other positions (if name or code changed)
    if (name !== existingPosition.name || code !== existingPosition.code) {
      const conflictingPosition = await prisma.position.findFirst({
        where: {
          AND: [
            { id: { not: id } }, // Exclude current position
            {
              OR: [{ name }, { code }],
            },
          ],
        },
      });

      if (conflictingPosition) {
        return NextResponse.json(
          { error: 'Position with this name or code already exists' },
          { status: 409 }
        );
      }
    }

    const updatedPosition = await prisma.position.update({
      where: { id },
      data: {
        name,
        code: code?.toUpperCase(),
        description,
        department,
        level,
        isActive,
        updatedAt: new Date(),
      },
      include: {
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/positions/[id]
 * Delete a specific position (only if no tests are assigned)
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

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: { id },
      include: {
        tests: {
          select: { id: true },
        },
      },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Check if position has tests assigned
    if (existingPosition.tests.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete position with assigned tests. Please reassign or remove tests first.',
          testCount: existingPosition.tests.length,
        },
        { status: 409 }
      );
    }

    // Delete the position
    await prisma.position.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Position deleted successfully',
      deletedId: id,
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}
