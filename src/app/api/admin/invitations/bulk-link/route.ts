import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';

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
    const {
      jobProfileName,
      candidates,
      linkUrl,
      linkType,
      customMessage,
      timeSlotInfo,
    } = body;

    // Validate required fields
    if (
      !candidates ||
      !Array.isArray(candidates) ||
      candidates.length === 0 ||
      !linkUrl ||
      !jobProfileName
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
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
        // Send email with existing link
        await sendJobProfileInvitationEmail({
          candidateEmail: candidate.email,
          candidateName: candidate.name,
          jobProfileName,
          positions: [], // For existing links, we don't need position details
          tests: [], // For existing links, we don't need test details
          customMessage: customMessage || '',
          invitationLink: linkUrl,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          companyName: process.env.COMPANY_NAME || 'Our Company',
          isTimeSlotLink: linkType === 'timeSlot',
          timeSlotInfo: timeSlotInfo,
        });

        results.push({
          email: candidate.email,
          success: true,
        });
        successCount++;
      } catch (error) {
        console.error(`Failed to send link to ${candidate.email}:`, error);
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
      message: `Sent link to ${successCount} candidates successfully`,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('Error sending bulk link invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send bulk invitations' },
      { status: 500 }
    );
  }
}
