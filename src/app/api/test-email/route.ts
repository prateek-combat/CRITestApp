import { NextRequest, NextResponse } from 'next/server';
import { enhancedEmailService } from '@/lib/enhancedEmailService';

/**
 * @swagger
 * /api/test-email:
 *   post:
 *     summary: Test email configuration
 *     description: Sends a test email to verify email service is working correctly.
 *     tags:
 *       - Email
 *     responses:
 *       200:
 *         description: Test email sent successfully.
 *       500:
 *         description: Email configuration test failed.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { testId } = body;

    // If no testId provided, we'll get the first available test
    let targetTestId = testId;
    if (!targetTestId) {
      const { prisma } = await import('@/lib/prisma');
      const firstTest = await prisma.test.findFirst({
        select: { id: true, title: true },
      });
      if (!firstTest) {
        return NextResponse.json(
          {
            success: false,
            message: 'No tests found in database to test with',
          },
          { status: 404 }
        );
      }
      targetTestId = firstTest.id;
    }

    // Test email notification with real test ID
    const result = await enhancedEmailService.sendTestCompletionNotification({
      testId: targetTestId,
      candidateId: 'test-candidate-id',
      candidateEmail: 'test@example.com',
      candidateName: 'Test Candidate',
      score: 8,
      maxScore: 10,
      completedAt: new Date(),
      timeTaken: 1200, // 20 minutes
      answers: [],
    });

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        environment: process.env.NODE_ENV,
        emailConfig: {
          gmailUser: process.env.GMAIL_USER || 'not configured',
          gmailPassword: process.env.GMAIL_APP_PASSWORD
            ? 'configured'
            : 'not configured',
          smtpHost: process.env.SMTP_HOST,
          smtpUser: process.env.SMTP_USER ? 'configured' : 'not configured',
          smtpFrom: process.env.SMTP_FROM || 'not configured',
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to send test email',
          environment: process.env.NODE_ENV,
          emailConfig: {
            gmailUser: process.env.GMAIL_USER || 'not configured',
            gmailPassword: process.env.GMAIL_APP_PASSWORD
              ? 'configured'
              : 'not configured',
            smtpHost: process.env.SMTP_HOST,
            smtpUser: process.env.SMTP_USER ? 'configured' : 'not configured',
            smtpFrom: process.env.SMTP_FROM || 'not configured',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV,
        emailConfig: {
          gmailUser: process.env.GMAIL_USER || 'not configured',
          gmailPassword: process.env.GMAIL_APP_PASSWORD
            ? 'configured'
            : 'not configured',
          smtpHost: process.env.SMTP_HOST,
          smtpUser: process.env.SMTP_USER ? 'configured' : 'not configured',
          smtpFrom: process.env.SMTP_FROM || 'not configured',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email test endpoint - use POST to send test email',
    environment: process.env.NODE_ENV,
    emailConfig: {
      gmailUser: process.env.GMAIL_USER || 'not configured',
      gmailPassword: process.env.GMAIL_APP_PASSWORD
        ? 'configured'
        : 'not configured',
      smtpHost: process.env.SMTP_HOST || 'not configured',
      smtpPort: process.env.SMTP_PORT || 'not configured',
      smtpSecure: process.env.SMTP_SECURE || 'not configured',
      smtpUser: process.env.SMTP_USER ? 'configured' : 'not configured',
      smtpFrom: process.env.SMTP_FROM || 'not configured',
    },
  });
}
