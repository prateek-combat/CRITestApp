import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0; // Disable caching

/**
 * GET /api/admin/positions
 * Get all positions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const isActive = searchParams.get('isActive');
    const includeTestCount = searchParams.get('includeTestCount') === 'true';

    const where: any = {};
    if (department) {
      where.department = department;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const positions = await prisma.position.findMany({
      where,
      include: {
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        ...(includeTestCount && {
          tests: {
            select: {
              id: true,
              title: true,
              isArchived: true,
            },
          },
        }),
      },
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
    });

    // Transform the response to include test counts if requested
    const transformedPositions = positions.map((position) => ({
      ...position,
      ...(includeTestCount && {
        testCount: position.tests?.length || 0,
        activeTestCount:
          position.tests?.filter((test) => !test.isArchived).length || 0,
        tests: undefined, // Remove full test data from response
      }),
    }));

    return NextResponse.json(transformedPositions);
  } catch (error) {
    console.error('Error fetching positions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch positions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/positions
 * Create a new position
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, description, department, level } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      );
    }

    // Check if position with same name or code already exists
    const existingPosition = await prisma.position.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    if (existingPosition) {
      return NextResponse.json(
        { error: 'Position with this name or code already exists' },
        { status: 409 }
      );
    }

    const position = await prisma.position.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        department,
        level,
        createdById: session.user.id,
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

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error('Error creating position:', error);
    return NextResponse.json(
      { error: 'Failed to create position' },
      { status: 500 }
    );
  }
}
