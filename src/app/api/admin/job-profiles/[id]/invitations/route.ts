import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';
import {
  sendJobProfileInvitationEmail,
  type JobProfileInvitationEmailData,
} from '@/lib/email';

const prisma = new PrismaClient();

// POST /api/admin/job-profiles/[id]/invitations - Create single job profile invitation
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
    const {
      candidateEmail,
      candidateName,
      customMessage,
      expiresInDays = 7,
    } = body;

    // Validate required fields
    if (!candidateEmail || !candidateName) {
      return NextResponse.json(
        { error: 'Candidate email and name are required' },
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

    // Check if invitation already exists
    const existingInvitation = await prisma.jobProfileInvitation.findFirst({
      where: {
        candidateEmail,
        jobProfileId,
        status: { in: ['PENDING', 'SENT', 'OPENED'] },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Active invitation already exists for this candidate' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create the invitation
    const invitation = await prisma.jobProfileInvitation.create({
      data: {
        candidateEmail,
        candidateName,
        jobProfileId,
        expiresAt,
        createdById: session.user.id,
      },
      include: {
        jobProfile: {
          include: {
            positions: true,
            testWeights: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });

    // Send job profile invitation email
    try {
      const emailData: JobProfileInvitationEmailData = {
        candidateEmail,
        candidateName,
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
        console.error('Failed to send invitation email:', emailResult.error);
        // Still mark as SENT in database even if email fails
        await prisma.jobProfileInvitation.update({
          where: { id: invitation.id },
          data: { status: 'SENT' },
        });
      }
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the request if email fails, just log it
      await prisma.jobProfileInvitation.update({
        where: { id: invitation.id },
        data: { status: 'SENT' },
      });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        candidateEmail: invitation.candidateEmail,
        candidateName: invitation.candidateName,
        status: 'SENT',
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error('Error creating job profile invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
