import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

// GET /api/admin/job-profiles - Get all job profiles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobProfiles = await prisma.jobProfile.findMany({
      where: {
        isActive: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to match the expected JobProfile interface
    const transformedProfiles = jobProfiles.map((jobProfile) => ({
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
    }));

    return NextResponse.json(transformedProfiles);
  } catch (error) {
    console.error('Error fetching job profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job profiles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/job-profiles - Create a new job profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isActive, positionIds, testIds, testWeights } =
      body;

    // Validate required fields
    if (!name || !positionIds?.length || !testIds?.length) {
      return NextResponse.json(
        { error: 'Name, positions, and tests are required' },
        { status: 400 }
      );
    }

    // Create the job profile with positions and test weights
    const jobProfile = await prisma.jobProfile.create({
      data: {
        name,
        description,
        isActive: isActive ?? true,
        createdById: session.user.id,
        positions: {
          connect: positionIds.map((id: string) => ({ id })),
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
      tests: jobProfile.testWeights.map((testWeight) => ({
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

    return NextResponse.json(transformedProfile, { status: 201 });
  } catch (error) {
    console.error('Error creating job profile:', error);
    return NextResponse.json(
      { error: 'Failed to create job profile' },
      { status: 500 }
    );
  }
}
