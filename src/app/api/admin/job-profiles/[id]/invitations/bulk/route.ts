import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import {
import { prisma } from '@/lib/prisma';
  sendJobProfileInvitationEmail,
  type JobProfileInvitationEmailData,
} from '@/lib/email';



// POST /api/admin/job-profiles/[id]/invitations/bulk - Create bulk job profile invitations
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

        // Send job profile invitation email
        try {
          const emailData: JobProfileInvitationEmailData = {
            candidateEmail: email,
            candidateName: email.split('@')[0], // Use email prefix as default name
            jobProfileName: jobProfile.name,
            positions: jobProfile.positions.map((p) => p.name),
            tests: jobProfile.testWeights.map((tw) => ({
              title: tw.test.title,
              questionsCount: undefined, // We don't have question count in this query
            })),
            customMessage: customMessage || '',
            invitationLink: `${process.env.NEXTAUTH_URL}/job-profile-invitation/${invitation.id}`,
            expiresAt: expiresAt,
          };

          const emailResult = await sendJobProfileInvitationEmail(emailData);

          if (emailResult.success) {
            // Update invitation status to SENT
            await prisma.jobProfileInvitation.update({
              where: { id: invitation.id },
              data: { status: 'SENT' },
            });
          } else {
            console.error(
              `Failed to send invitation email to ${email}:`,
              emailResult.error
            );
            // Still mark as SENT in database even if email fails
            await prisma.jobProfileInvitation.update({
              where: { id: invitation.id },
              data: { status: 'SENT' },
            });
          }
        } catch (emailError) {
          console.error(
            `Failed to send invitation email to ${email}:`,
            emailError
          );
          // Don't fail the request if email fails, just log it
          await prisma.jobProfileInvitation.update({
            where: { id: invitation.id },
            data: { status: 'SENT' },
          });
        }

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
