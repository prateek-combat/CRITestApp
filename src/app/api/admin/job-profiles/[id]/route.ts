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
        positions: true, // Include all positions, not just active ones
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
    console.log('🔍 [VERCEL DEBUG] PUT Request started');
    
    const session = await getServerSession(authOptionsSimple);
    console.log('🔍 [VERCEL DEBUG] Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      role: session?.user?.role,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : []
    });

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      console.log('🔍 [VERCEL DEBUG] Authorization failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 [VERCEL DEBUG] Parsing request body...');
    const body = await request.json();
    console.log('🔍 [VERCEL DEBUG] Full request body:', JSON.stringify(body, null, 2));
    console.log('🔍 [VERCEL DEBUG] Request body summary:', { 
      hasName: !!body.name,
      name: body.name,
      description: body.description,
      isActive: body.isActive,
      positionIdsLength: body.positionIds?.length || 0,
      positionIds: body.positionIds,
      testIdsLength: body.testIds?.length || 0,
      testIds: body.testIds,
      testWeightsLength: body.testWeights?.length || 0,
      testWeights: body.testWeights,
      hasTestWeights: !!body.testWeights 
    });
    
    const { name, description, isActive, positionIds, testIds, testWeights } =
      body;

    // Validate required fields
    if (!name || !positionIds?.length || !testIds?.length) {
      console.log('🔍 [VERCEL DEBUG] Validation failed:', { 
        name: !!name, 
        nameValue: name,
        positionIds: positionIds?.length, 
        positionIdsValue: positionIds,
        testIds: testIds?.length,
        testIdsValue: testIds
      });
      return NextResponse.json(
        { error: 'Name, positions, and tests are required' },
        { status: 400 }
      );
    }

    // Validate array lengths match (if testWeights provided)
    if (testWeights && testWeights.length !== testIds.length) {
      console.log('🔍 [VERCEL DEBUG] Array length mismatch:', { 
        testIdsLength: testIds.length, 
        testWeightsLength: testWeights.length,
        testIdsActual: testIds,
        testWeightsActual: testWeights
      });
      return NextResponse.json(
        { 
          error: 'Test weights array must match the number of tests',
          details: `Expected ${testIds.length} weights, got ${testWeights.length}`
        },
        { status: 400 }
      );
    }

    // Ensure testWeights array has the correct length (pad with 1.0 if needed)
    const normalizedTestWeights = testIds.map((_: string, index: number) => 
      testWeights && testWeights[index] !== undefined ? testWeights[index] : 1.0
    );
    
    console.log('🔍 [VERCEL DEBUG] Test weights normalization:', {
      original: testWeights,
      normalized: normalizedTestWeights,
      testIdsCount: testIds.length,
      mapping: testIds.map((testId: string, index: number) => ({ testId, weight: normalizedTestWeights[index] }))
    });

    const { id } = await params;
    console.log('🔍 [VERCEL DEBUG] Job profile ID:', id);

    // Update the job profile with transaction to handle both positions and test weights
    console.log('🔍 [VERCEL DEBUG] Starting transaction with increased timeout...');
    const jobProfile = await prisma.$transaction(async (tx) => {
      console.log('🔍 [VERCEL DEBUG] Transaction started - deleting existing test weights...');
      const deletedWeights = await tx.testWeight.deleteMany({
        where: { jobProfileId: id },
      });
      console.log('🔍 [VERCEL DEBUG] Deleted test weights count:', deletedWeights.count);

      console.log('🔍 [VERCEL DEBUG] Preparing job profile update...');
      
      // Create test weights data with validation
      const testWeightsData = testIds.map((testId: string, index: number) => {
        const weight = normalizedTestWeights[index];
        console.log(`🔍 [VERCEL DEBUG] Creating test weight: testId=${testId}, weight=${weight}, index=${index}`);
        return {
          testId,
          weight,
        };
      });
      
      console.log('🔍 [VERCEL DEBUG] Test weights data prepared:', JSON.stringify(testWeightsData, null, 2));
      
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
            create: testWeightsData,
          },
        },
        include: {
          positions: true, // Include all positions, not just active ones
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

      console.log('🔍 [VERCEL DEBUG] Job profile updated successfully');

      // Associate tests directly with positions for analytics/leaderboard visibility
      // If multiple positions, associate with the first available position (active preferred)
      console.log('🔍 [VERCEL DEBUG] Starting optimized position association...');
      const primaryPosition = updatedJobProfile.positions.find(
        (p) => p.isActive
      ) || updatedJobProfile.positions[0]; // Fallback to first position if no active ones
      
      if (primaryPosition) {
        console.log('🔍 [VERCEL DEBUG] Primary position found:', primaryPosition.id);
        
        // Batch check which tests need position association
        const testsToCheck = await tx.test.findMany({
          where: {
            id: { in: testIds },
            positionId: null
          },
          select: { id: true }
        });
        
        const testsNeedingAssociation = testsToCheck.map(t => t.id);
        console.log('🔍 [VERCEL DEBUG] Tests needing position association:', testsNeedingAssociation);
        
        // Batch update tests that need position association
        if (testsNeedingAssociation.length > 0) {
          const updateResult = await tx.test.updateMany({
            where: {
              id: { in: testsNeedingAssociation }
            },
            data: {
              positionId: primaryPosition.id
            }
          });
          console.log('🔍 [VERCEL DEBUG] Batch associated', updateResult.count, 'tests with position', primaryPosition.id);
        } else {
          console.log('🔍 [VERCEL DEBUG] All tests already have position associations');
        }
      } else {
        console.log('🔍 [VERCEL DEBUG] No primary position found');
      }

      return updatedJobProfile;
    }, {
      maxWait: 10000, // 10 seconds
      timeout: 15000, // 15 seconds
    });
    
    console.log('🔍 [VERCEL DEBUG] Transaction completed successfully');

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

    console.log('🔍 [VERCEL DEBUG] Returning transformed profile');
    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('🔍 [VERCEL DEBUG] ERROR CAUGHT:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : typeof error,
      code: (error as any)?.code,
      meta: (error as any)?.meta,
      stack: error instanceof Error ? error.stack?.split('\\n').slice(0, 10) : undefined,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Failed to update job profile';
    let errorDetails = error instanceof Error ? error.message : String(error);
    
    if ((error as any)?.code === 'P2002') {
      console.log('🔍 [VERCEL DEBUG] Prisma P2002 - Unique constraint violation');
      errorMessage = 'Duplicate constraint violation';
      errorDetails = 'A unique constraint would be violated';
    } else if ((error as any)?.code === 'P2025') {
      console.log('🔍 [VERCEL DEBUG] Prisma P2025 - Record not found');
      errorMessage = 'Record not found';
      errorDetails = 'One or more referenced records do not exist';
    } else if ((error as any)?.code === 'P2003') {
      console.log('🔍 [VERCEL DEBUG] Prisma P2003 - Foreign key constraint failed');
      errorMessage = 'Foreign key constraint failed';
      errorDetails = 'Invalid reference to related record';
    } else {
      console.log('🔍 [VERCEL DEBUG] Unknown error type');
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        code: (error as any)?.code || 'UNKNOWN'
      },
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
