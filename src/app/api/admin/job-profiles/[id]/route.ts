import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/job-profiles/[id] - Get a specific job profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const jobProfile = await prisma.position.findUnique({
      where: { id },
      include: {
        testsMany: {
          include: {
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Transform the response
    const transformedProfile = {
      id: jobProfile.id,
      name: jobProfile.name,
      description: jobProfile.description,
      isActive: jobProfile.isActive,
      createdAt: jobProfile.createdAt.toISOString(),
      updatedAt: jobProfile.updatedAt.toISOString(),
      positions: [
        {
          id: jobProfile.id,
          name: jobProfile.name,
          code: jobProfile.code,
          description: jobProfile.description,
          department: jobProfile.department,
          level: jobProfile.level,
          isActive: jobProfile.isActive,
        },
      ],
      tests: jobProfile.testsMany.map((test: any) => ({
        id: test.id,
        title: test.title,
        description: test.description,
        questionsCount: test.questions.length,
        isArchived: test.isArchived,
      })),
      _count: {
        invitations: 0,
        completedInvitations: 0,
      },
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Error fetching job profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profile' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/job-profiles/[id] - Update a job profile
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isActive, positionIds, testIds } = body;

    // Validate required fields
    if (!name || !testIds?.length) {
      return NextResponse.json(
        { error: 'Name and tests are required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    // Update the position (job profile)
    const jobProfile = await prisma.position.update({
      where: { id },
      data: {
        name,
        code: name.toLowerCase().replace(/\s+/g, '-'),
        description,
        isActive: isActive ?? true,
        // Update the many-to-many relationship
        testsMany: {
          set: testIds.map((id: string) => ({ id })),
        },
      },
      include: {
        testsMany: {
          include: {
            questions: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Transform the response
    const transformedProfile = {
      id: jobProfile.id,
      name: jobProfile.name,
      description: jobProfile.description,
      isActive: jobProfile.isActive,
      createdAt: jobProfile.createdAt.toISOString(),
      updatedAt: jobProfile.updatedAt.toISOString(),
      positions: [
        {
          id: jobProfile.id,
          name: jobProfile.name,
          code: jobProfile.code,
          description: jobProfile.description,
          department: jobProfile.department,
          level: jobProfile.level,
          isActive: jobProfile.isActive,
        },
      ],
      tests: jobProfile.testsMany.map((test: any) => ({
        id: test.id,
        title: test.title,
        description: test.description,
        questionsCount: test.questions.length,
        isArchived: test.isArchived,
      })),
      _count: {
        invitations: 0,
        completedInvitations: 0,
      },
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Error updating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to update job profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/job-profiles/[id] - Delete a job profile
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    // Check if the job profile exists
    const jobProfile = await prisma.position.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            testsMany: true,
          },
        },
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // For safety, we'll just mark it as inactive instead of deleting
    // In a production system, you might want to check for dependencies first
    await prisma.position.update({
      where: { id },
      data: {
        isActive: false,
        // Disconnect all tests
        testsMany: {
          set: [],
        },
      },
    });

    return NextResponse.json({ message: 'Job profile deleted successfully' });
  } catch (error) {
    console.error('Error deleting job profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete job profile' },
      { status: 500 }
    );
  }
}
