import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== 'admin' && session.user.role !== 'super_admin')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobProfileId,
      candidateEmail,
      candidateName,
      customMessage,
      expiresInDays = 7,
    } = body;

    // Validate required fields
    if (!jobProfileId || !candidateEmail || !candidateName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate job profile exists and get its details
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        tests: true,
        positions: true,
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
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        candidateEmail,
        jobProfileId,
        status: { in: ['pending', 'opened'] },
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An active invitation already exists for this candidate' },
        { status: 400 }
      );
    }

    // Generate unique token
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        token,
        candidateEmail,
        candidateName,
        customMessage,
        expiresAt,
        status: 'pending',
        jobProfileId,
        createdById: session.user.id,
      },
      include: {
        jobProfile: {
          include: {
            tests: true,
            positions: true,
          },
        },
      },
    });

    // Send invitation email using the job profile email function
    try {
      const { sendJobProfileInvitationEmail } = await import('@/lib/email');

      const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/job-profile-invitation/${token}`;

      await sendJobProfileInvitationEmail({
        candidateEmail,
        candidateName,
        jobProfileName: jobProfile.name,
        positions: jobProfile.positions.map((p) => p.name),
        tests: jobProfile.tests.map((t) => ({
          title: t.title,
          questionsCount: t.questionsCount,
        })),
        customMessage,
        invitationLink,
        expiresAt,
        companyName: process.env.COMPANY_NAME || 'Our Company',
      });
    } catch (emailError) {
      // Log email error but don't fail the invitation creation
      console.error('Failed to send invitation email:', emailError);

      // Update invitation status to indicate email failure
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'email_failed',
          notes:
            'Failed to send invitation email. Please check email configuration.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        token: invitation.token,
        candidateEmail: invitation.candidateEmail,
        candidateName: invitation.candidateName,
        status: invitation.status,
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
