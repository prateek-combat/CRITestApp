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
      candidateEmail,
      candidateName,
      linkUrl,
      linkType,
      customMessage,
      jobProfileName,
      timeSlotInfo,
    } = body;

    // Validate required fields
    if (!candidateEmail || !candidateName || !linkUrl || !jobProfileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Import email function
    const { sendJobProfileInvitationEmail } = await import('@/lib/email');

    // Prepare email data
    const emailData = {
      candidateEmail,
      candidateName,
      jobProfileName,
      positions: [], // For existing links, we don't need position details
      tests: [], // For existing links, we don't need test details
      customMessage: customMessage || '',
      invitationLink: linkUrl,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      companyName: process.env.COMPANY_NAME || 'Our Company',
      isTimeSlotLink: linkType === 'timeSlot',
      timeSlotInfo: timeSlotInfo,
    };

    // Send email
    try {
      await sendJobProfileInvitationEmail(emailData);

      // Log the invitation send
      console.log(
        `Sent ${linkType} link to ${candidateEmail} for ${jobProfileName}`
      );

      return NextResponse.json({
        success: true,
        message: `${linkType === 'timeSlot' ? 'Time slot' : 'Public'} link sent successfully to ${candidateName}`,
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);

      return NextResponse.json(
        {
          error: 'Failed to send email. Please check email configuration.',
          details:
            emailError instanceof Error ? emailError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending link invitation:', error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
