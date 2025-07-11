import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

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
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id },
      include: {
        positions: {
          where: {
            isActive: true,
          },
        },
        testWeights: {
          include: {
            test: {
              include: {
                questions: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        invitations: true,
        _count: {
          select: {
            invitations: true,
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
      positions: jobProfile.positions.map((position) => ({
        id: position.id,
        name: position.name,
        code: position.code,
        description: position.description,
        department: position.department,
        level: position.level,
        isActive: position.isActive,
      })),
      tests: jobProfile.testWeights
        .filter((tw) => tw.test && !tw.test.isArchived)
        .map((testWeight) => ({
          id: testWeight.test.id,
          title: testWeight.test.title,
          description: testWeight.test.description,
          questionsCount: testWeight.test.questions.length,
          isArchived: testWeight.test.isArchived,
          weight: testWeight.weight,
        })),
      _count: {
        invitations: jobProfile._count.invitations,
        completedInvitations: jobProfile.invitations.filter(
          (inv) => inv.status === 'COMPLETED'
        ).length,
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
    console.log('[PUT /api/admin/job-profiles/[id]] Request started');
    
    const session = await getServerSession(authOptionsSimple);
    console.log('[PUT] Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      role: session?.user?.role 
    });

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      console.log('[PUT] Authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PUT] Parsing request body...');
    const body = await request.json();
    console.log('[PUT] Request body received:', { 
      hasName: !!body.name,
      positionIdsLength: body.positionIds?.length || 0,
      testIdsLength: body.testIds?.length || 0,
      hasTestWeights: !!body.testWeights 
    });
    
    const { name, description, isActive, positionIds, testIds, testWeights } =
      body;

    // Validate required fields
    if (!name || !positionIds?.length || !testIds?.length) {
      console.log('[PUT] Validation failed:', { name: !!name, positionIds: positionIds?.length, testIds: testIds?.length });
      return NextResponse.json(
        { error: 'Name, positions, and tests are required' },
        { status: 400 }
      );
    }

    const { id } = await params;
    console.log('[PUT] Job profile ID:', id);

    // Update the job profile with transaction to handle both positions and test weights
    console.log('[PUT] Starting transaction...');
    const jobProfile = await prisma.$transaction(async (tx) => {
      console.log('[PUT] Deleting existing test weights...');
      const deletedWeights = await tx.testWeight.deleteMany({
        where: { jobProfileId: id },
      });
      console.log('[PUT] Deleted test weights count:', deletedWeights.count);

      console.log('[PUT] Updating job profile...');
      const updatedJobProfile = await tx.jobProfile.update({
        where: { id },
        data: {
          name,
          description,
          isActive: isActive ?? true,
          positions: {
            set: positionIds.map((positionId: string) => ({ id: positionId })),
          },
          testWeights: {
            create: testIds.map((testId: string, index: number) => ({
              testId,
              weight: testWeights?.[index] || 1.0,
            })),
          },
        },
        include: {
          positions: {
            where: {
              isActive: true,
            },
          },
          testWeights: {
            include: {
              test: {
                include: {
                  questions: {
                    select: {
                      id: true,
                    },
                  },
                },
              },
            },
          },
          invitations: true,
          _count: {
            select: {
              invitations: true,
            },
          },
        },
      });

      console.log('[PUT] Job profile updated successfully');

      // Associate tests directly with positions for analytics/leaderboard visibility
      // If multiple positions, associate with the first active position
      console.log('[PUT] Starting position association...');
      const primaryPosition = updatedJobProfile.positions.find(
        (p) => p.isActive
      );
      if (primaryPosition) {
        console.log('[PUT] Primary position found:', primaryPosition.id);
        for (const testId of testIds) {
          // Check if test already has a position association
          const existingTest = await tx.test.findUnique({
            where: { id: testId },
            select: { positionId: true },
          });

          // Only update if test doesn't have a position association
          if (!existingTest?.positionId) {
            await tx.test.update({
              where: { id: testId },
              data: { positionId: primaryPosition.id },
            });
            console.log('[PUT] Associated test', testId, 'with position', primaryPosition.id);
          } else {
            console.log('[PUT] Test', testId, 'already has position association');
          }
        }
      } else {
        console.log('[PUT] No primary position found');
      }

      return updatedJobProfile;
    });
    
    console.log('[PUT] Transaction completed successfully');

    // Transform the response
    const transformedProfile = {
      id: jobProfile.id,
      name: jobProfile.name,
      description: jobProfile.description,
      isActive: jobProfile.isActive,
      createdAt: jobProfile.createdAt.toISOString(),
      updatedAt: jobProfile.updatedAt.toISOString(),
      positions: jobProfile.positions.map((position) => ({
        id: position.id,
        name: position.name,
        code: position.code,
        description: position.description,
        department: position.department,
        level: position.level,
        isActive: position.isActive,
      })),
      tests: jobProfile.testWeights
        .filter((tw) => tw.test && !tw.test.isArchived)
        .map((testWeight) => ({
          id: testWeight.test.id,
          title: testWeight.test.title,
          description: testWeight.test.description,
          questionsCount: testWeight.test.questions.length,
          isArchived: testWeight.test.isArchived,
          weight: testWeight.weight,
        })),
      _count: {
        invitations: jobProfile._count.invitations,
        completedInvitations: jobProfile.invitations.filter(
          (inv) => inv.status === 'COMPLETED'
        ).length,
      },
    };

    console.log('[PUT] Returning transformed profile');
    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('[PUT] Error updating job profile:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined, // First 5 lines of stack
    });
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
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            invitations: true,
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
    await prisma.jobProfile.update({
      where: { id },
      data: {
        isActive: false,
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
