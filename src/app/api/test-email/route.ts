import { NextResponse } from 'next/server';
import { testEmailConfiguration } from '@/lib/email';

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
export async function POST() {
  try {
    const result = await testEmailConfiguration();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Email configuration test successful! Check your inbox.',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: '❌ Email configuration test failed.',
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
        message: '❌ Email test failed with unexpected error.',
      },
      { status: 500 }
    );
  }
}
