import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/prisma';



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
    const { jobProfileId, candidates, customMessage, expiresInDays } = body;

    // Validate required fields
    if (
      !jobProfileId ||
      !candidates ||
      !Array.isArray(candidates) ||
      candidates.length === 0
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get job profile details
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        positions: true,
        tests: true,
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Import email function
    const { sendJobProfileInvitationEmail } = await import('@/lib/email');

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Process each candidate
    for (const candidate of candidates) {
      try {
        // Create invitation record
        const invitation = await prisma.invitation.create({
          data: {
            jobProfileId,
            candidateEmail: candidate.email,
            candidateName: candidate.name,
            invitationToken: nanoid(32),
            expiresAt: new Date(
              Date.now() + (expiresInDays || 7) * 24 * 60 * 60 * 1000
            ),
            sentById: session.user.id,
          },
        });

        // Generate invitation link
        const invitationLink = `${process.env.NEXT_PUBLIC_APP_URL}/assessment/${invitation.invitationToken}`;

        // Send email
        await sendJobProfileInvitationEmail({
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          jobProfileName: jobProfile.name,
          positions: jobProfile.positions,
          tests: jobProfile.tests,
          customMessage: customMessage || '',
          invitationLink,
          expiresAt: invitation.expiresAt,
          companyName: process.env.COMPANY_NAME || 'Our Company',
        });

        results.push({
          email: candidate.email,
          success: true,
          invitationId: invitation.id,
        });
        successCount++;
      } catch (error) {
        console.error(
          `Failed to send invitation to ${candidate.email}:`,
          error
        );
        results.push({
          email: candidate.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} invitations successfully`,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('Error sending bulk invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk invitations' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
