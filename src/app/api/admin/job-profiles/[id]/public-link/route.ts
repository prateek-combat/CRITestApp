import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';



// POST /api/admin/job-profiles/[id]/public-link - Create public links for all tests in a job profile
export async function POST(
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

    const { id: jobProfileId } = await params;

    // Get the job profile with its tests
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        testWeights: {
          include: {
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

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    if (jobProfile.testWeights.length === 0) {
      return NextResponse.json(
        { error: 'Job profile has no tests assigned' },
        { status: 400 }
      );
    }

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const createdLinks = [];

    // Create public links for each test in the job profile
    for (const testWeight of jobProfile.testWeights) {
      const test = testWeight.test;

      // Check if a public link already exists for this test
      const existingLink = await prisma.publicTestLink.findFirst({
        where: {
          testId: test.id,
          isActive: true,
        },
      });

      if (existingLink) {
        // Return existing link
        createdLinks.push({
          id: existingLink.id,
          testId: existingLink.testId,
          testTitle: test.title,
          linkToken: existingLink.linkToken,
          title: existingLink.title,
          description: existingLink.description,
          isActive: existingLink.isActive,
          expiresAt: existingLink.expiresAt?.toISOString(),
          maxUses: existingLink.maxUses,
          usedCount: existingLink.usedCount,
          createdAt: existingLink.createdAt.toISOString(),
          publicUrl: `${baseUrl}/public-test/${existingLink.linkToken}`,
          isExisting: true,
        });
      } else {
        // Create new public link
        const linkToken = nanoid(12);
        const publicLink = await prisma.publicTestLink.create({
          data: {
            testId: test.id,
            jobProfileId: jobProfileId,
            linkToken,
            title: `${jobProfile.name} - ${test.title}`,
            description: `Public link for ${test.title} as part of ${jobProfile.name} assessment`,
            isTimeRestricted: false, // Explicitly set to false for regular public links
            createdById: session.user.id,
          },
        });

        createdLinks.push({
          id: publicLink.id,
          testId: publicLink.testId,
          testTitle: test.title,
          linkToken: publicLink.linkToken,
          title: publicLink.title,
          description: publicLink.description,
          isActive: publicLink.isActive,
          expiresAt: publicLink.expiresAt?.toISOString(),
          maxUses: publicLink.maxUses,
          usedCount: publicLink.usedCount,
          createdAt: publicLink.createdAt.toISOString(),
          publicUrl: `${baseUrl}/public-test/${linkToken}`,
          isExisting: false,
        });
      }
    }

    return NextResponse.json({
      message: `Created ${createdLinks.filter((link) => !link.isExisting).length} new public links and found ${createdLinks.filter((link) => link.isExisting).length} existing links`,
      jobProfileName: jobProfile.name,
      links: createdLinks,
    });
  } catch (error) {
    console.error('Error creating job profile public links:', error);
    return NextResponse.json(
      { error: 'Failed to create public links' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
