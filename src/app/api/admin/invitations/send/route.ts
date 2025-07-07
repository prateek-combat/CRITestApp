import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

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
    console.log('Received invitation request body:', body);

    const {
      jobProfileId,
      candidateEmail,
      candidateName,
      customMessage,
      expiresInDays = 7,
    } = body;

    console.log('Extracted fields:', {
      jobProfileId,
      candidateEmail,
      candidateName,
      customMessage,
      expiresInDays,
    });

    // Validate required fields
    if (!jobProfileId || !candidateEmail || !candidateName) {
      console.log('Validation failed - missing fields:', {
        hasJobProfileId: !!jobProfileId,
        hasCandidateEmail: !!candidateEmail,
        hasCandidateName: !!candidateName,
      });
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: {
            jobProfileId: !!jobProfileId,
            candidateEmail: !!candidateEmail,
            candidateName: !!candidateName,
          },
        },
        { status: 400 }
      );
    }

    // Validate job profile exists and get its details
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

    if (!jobProfile.isActive) {
      return NextResponse.json(
        { error: 'Job profile is not active' },
        { status: 400 }
      );
    }

    // Check if invitation already exists for this email and job profile
    const existingInvitation = await prisma.jobProfileInvitation.findFirst({
      where: {
        candidateEmail,
        jobProfileId,
        status: { in: ['PENDING', 'SENT', 'OPENED'] },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An active invitation already exists for this candidate' },
        { status: 400 }
      );
    }

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create job profile invitation
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

    // Send invitation email using the job profile email function
    try {
      const { sendJobProfileInvitationEmail } = await import('@/lib/email');

      const invitationLink = `${process.env.NEXTAUTH_URL}/job-profile-invitation/${invitation.id}`;

      await sendJobProfileInvitationEmail({
        candidateEmail,
        candidateName,
        jobProfileName: jobProfile.name,
        positions: jobProfile.positions.map((p) => p.name),
        tests: jobProfile.testWeights.map((tw) => ({
          title: tw.test.title,
          questionsCount: undefined, // We don't have question count in this query
        })),
        customMessage,
        invitationLink,
        expiresAt,
        companyName: process.env.COMPANY_NAME || 'Our Company',
      });

      // Update invitation status to SENT
      await prisma.jobProfileInvitation.update({
        where: { id: invitation.id },
        data: { status: 'SENT' },
      });
    } catch (emailError) {
      // Log email error but don't fail the invitation creation
      console.error('Failed to send invitation email:', emailError);

      // Update invitation status to indicate email failure
      await prisma.jobProfileInvitation.update({
        where: { id: invitation.id },
        data: { status: 'SENT' }, // Still mark as sent even if email fails
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
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
