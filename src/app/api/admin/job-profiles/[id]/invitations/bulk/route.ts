import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/admin/job-profiles/[id]/invitations/bulk - Create bulk job profile invitations
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const jobProfileId = params.id;
    const body = await request.json();
    const { emails, customMessage, expiresInDays = 7 } = body;

    // Validate required fields
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Email addresses are required' },
        { status: 400 }
      );
    }

    // Get the job profile with its tests and positions
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        positions: true,
        testWeights: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                description: true,
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

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of emails) {
      try {
        // Check if invitation already exists
        const existingInvitation = await prisma.jobProfileInvitation.findFirst({
          where: {
            candidateEmail: email,
            jobProfileId,
            status: { in: ['PENDING', 'SENT', 'OPENED'] },
          },
        });

        if (existingInvitation) {
          results.push({
            email,
            success: false,
            error: 'Active invitation already exists for this candidate',
          });
          failureCount++;
          continue;
        }

        // Create the invitation
        const invitation = await prisma.jobProfileInvitation.create({
          data: {
            candidateEmail: email,
            candidateName: email.split('@')[0], // Use email prefix as default name
            jobProfileId,
            expiresAt,
            createdById: session.user.id,
          },
        });

        // TODO: Implement job profile invitation email sending
        // For now, mark as SENT without actually sending email
        await prisma.jobProfileInvitation.update({
          where: { id: invitation.id },
          data: { status: 'SENT' },
        });

        results.push({
          email,
          success: true,
          invitationId: invitation.id,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to create invitation for ${email}:`, error);
        results.push({
          email,
          success: false,
          error: 'Failed to create invitation',
        });
        failureCount++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: emails.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Error creating bulk job profile invitations:', error);
    return NextResponse.json(
      { error: 'Failed to create bulk invitations' },
      { status: 500 }
    );
  }
}
