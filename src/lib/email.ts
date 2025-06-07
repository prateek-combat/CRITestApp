import nodemailer from 'nodemailer';

export interface InvitationEmailData {
  candidateEmail: string;
  testTitle: string;
  testLink: string;
  expiresAt: Date;
  companyName?: string;
  customMessage?: string;
}

export interface ReminderEmailData extends InvitationEmailData {
  reminderType: 'first' | 'second' | 'final';
  daysUntilExpiry: number;
}

// Create Gmail transporter
function createGmailTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      'Gmail credentials not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.'
    );
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

// Generate invitation email HTML template
function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const {
    candidateEmail,
    testTitle,
    testLink,
    expiresAt,
    companyName = 'Test Platform',
    customMessage,
  } = data;

  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Invitation - ${testTitle}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          background-color: #f8fafc;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 20px 0;
        }
        .subtitle {
          font-size: 18px;
          color: #6b7280;
          margin-bottom: 30px;
        }
        .content {
          margin: 30px 0;
        }
        .test-info {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .test-name {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .expiry-info {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .cta-button {
          display: inline-block;
          background: #1e40af;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .cta-button:hover {
          background: #1d4ed8;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .custom-message {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
          font-style: italic;
        }
        .instructions {
          background: #f0fdf4;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
        }
        .instruction-title {
          font-weight: 600;
          color: #166534;
          margin-bottom: 10px;
        }
        .instruction-list {
          margin: 0;
          padding-left: 20px;
        }
        .instruction-list li {
          margin: 8px 0;
          color: #166534;
        }
        .powered-by {
          margin-top: 20px;
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎯 ${companyName}</div>
          <h1 class="title">You're Invited to Take a Test</h1>
          <p class="subtitle">Complete your assessment to proceed with the application process</p>
        </div>

        <div class="content">
          <p>Hello,</p>
          <p>You have been invited to take an online assessment. Please complete this test by the deadline to continue with your application.</p>

          ${
            customMessage
              ? `
            <div class="custom-message">
              <strong>Personal Message:</strong><br>
              ${customMessage}
            </div>
          `
              : ''
          }

          <div class="test-info">
            <div class="test-name">📋 ${testTitle}</div>
            <p><strong>Candidate:</strong> ${candidateEmail}</p>
          </div>

          <div class="expiry-info">
            <strong>⏰ Important:</strong> This invitation expires on <strong>${expiryDate}</strong>. 
            Please complete the test before this date.
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${testLink}" class="cta-button">
              🚀 Start Test Now
            </a>
          </div>

          <div class="instructions">
            <div class="instruction-title">📝 Before you begin:</div>
            <ul class="instruction-list">
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet environment with minimal distractions</li>
              <li>Allow camera and microphone access when prompted</li>
              <li>Complete the test in one session - you cannot pause and resume</li>
              <li>Make sure your device is fully charged or plugged in</li>
            </ul>
          </div>

          <p>If you have any questions or technical issues, please contact our support team.</p>
          
          <p>Good luck!</p>
        </div>

        <div class="footer">
          <p>This is an automated message from ${companyName}.</p>
          <p>If you believe you received this email in error, please contact our support team.</p>
          <p><a href="${testLink}" style="color: #1e40af;">Test Link</a> • Valid until ${expiryDate}</p>
          <div class="powered-by">
            Powered by Google Workspace
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate reminder email HTML template
function generateReminderEmailHtml(data: ReminderEmailData): string {
  const { reminderType, daysUntilExpiry } = data;

  let reminderTitle = '';
  let reminderIcon = '';
  let urgencyStyle = '';

  switch (reminderType) {
    case 'first':
      reminderTitle = 'Friendly Reminder';
      reminderIcon = '⏰';
      urgencyStyle = 'border-left-color: #f59e0b;';
      break;
    case 'second':
      reminderTitle = 'Important Reminder';
      reminderIcon = '⚠️';
      urgencyStyle = 'border-left-color: #ea580c;';
      break;
    case 'final':
      reminderTitle = 'Final Notice';
      reminderIcon = '🚨';
      urgencyStyle = 'border-left-color: #dc2626;';
      break;
  }

  const baseHtml = generateInvitationEmailHtml(data);

  // Customize for reminder
  return baseHtml
    .replace(
      "You're Invited to Take a Test",
      `${reminderIcon} ${reminderTitle}: Test Pending`
    )
    .replace(
      'Complete your assessment to proceed',
      `Only ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining to complete your test`
    )
    .replace(
      'You have been invited to take an online assessment. Please complete this test by the deadline to continue with your application.',
      `<strong>URGENT:</strong> Your test invitation expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please complete it as soon as possible to avoid missing this opportunity.`
    )
    .replace('background: #fef3c7;', `background: #fef3c7; ${urgencyStyle}`);
}

// Send invitation email
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createGmailTransporter();

    const mailOptions = {
      from: `${data.companyName || 'Test Platform'} <${process.env.GMAIL_USER}>`,
      to: data.candidateEmail,
      subject: `🎯 Test Invitation: ${data.testTitle}`,
      html: generateInvitationEmailHtml(data),
      text: `
You have been invited to take the test: ${data.testTitle}

Please complete this test by ${data.expiresAt.toLocaleDateString()}.

Test Link: ${data.testLink}

${data.customMessage ? `Message: ${data.customMessage}` : ''}

If you have any questions, please contact our support team.
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Send reminder email
export async function sendReminderEmail(
  data: ReminderEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createGmailTransporter();

    const { reminderType } = data;
    let subjectPrefix = '';

    switch (reminderType) {
      case 'first':
        subjectPrefix = '⏰ Reminder';
        break;
      case 'second':
        subjectPrefix = '⚠️ Important';
        break;
      case 'final':
        subjectPrefix = '🚨 Final Notice';
        break;
    }

    const mailOptions = {
      from: `${data.companyName || 'Test Platform'} <${process.env.GMAIL_USER}>`,
      to: data.candidateEmail,
      subject: `${subjectPrefix}: Test Pending - ${data.testTitle}`,
      html: generateReminderEmailHtml(data),
      text: `
REMINDER: You have a pending test invitation.

Test: ${data.testTitle}
Days remaining: ${data.daysUntilExpiry}
Expires: ${data.expiresAt.toLocaleDateString()}

Test Link: ${data.testLink}

Please complete this test as soon as possible.
      `.trim(),
    };

    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Bulk send invitations
export async function sendBulkInvitations(
  invitations: InvitationEmailData[]
): Promise<{
  success: boolean;
  results: {
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }[];
  totalSent: number;
  totalFailed: number;
}> {
  const results = await Promise.allSettled(
    invitations.map(async (invitation) => {
      const result = await sendInvitationEmail(invitation);
      return {
        email: invitation.candidateEmail,
        ...result,
      };
    })
  );

  const processedResults = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        email: invitations[index].candidateEmail,
        success: false,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });

  const totalSent = processedResults.filter((r) => r.success).length;
  const totalFailed = processedResults.filter((r) => !r.success).length;

  return {
    success: totalSent > 0,
    results: processedResults,
    totalSent,
    totalFailed,
  };
}

// Validate email addresses
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Parse multiple emails from text (comma or newline separated)
export function parseMultipleEmails(emailText: string): {
  valid: string[];
  invalid: string[];
} {
  const emails = emailText
    .split(/[,\n\r]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

// Test email configuration
export async function testEmailConfiguration(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const transporter = createGmailTransporter();

    // Verify SMTP connection
    await transporter.verify();

    // Send a test email
    const testEmail = process.env.TEST_EMAIL || process.env.GMAIL_USER;

    if (!testEmail) {
      throw new Error(
        'No test email configured. Set TEST_EMAIL or use your Gmail account.'
      );
    }

    const mailOptions = {
      from: `Test Platform <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: '✅ Google Workspace Email Configuration Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1e40af;">✅ Email Configuration Test</h2>
          <p>This is a test email to verify your Google Workspace email configuration is working correctly.</p>
          <p>If you received this email, your setup is working perfectly! 🎉</p>
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0; color: #166534;">✅ Configuration Details:</h3>
            <ul style="margin: 10px 0; color: #166534;">
              <li>Service: Google Workspace / Gmail</li>
              <li>Sender: ${process.env.GMAIL_USER}</li>
              <li>Test sent at: ${new Date().toISOString()}</li>
            </ul>
          </div>
          <p style="font-size: 12px; color: #6b7280;">
            This email was sent automatically by your Test Platform to verify email configuration.
          </p>
        </div>
      `,
      text: `
Email Configuration Test

This is a test email to verify your Google Workspace email configuration is working correctly.

If you received this email, your setup is working perfectly!

Configuration Details:
- Service: Google Workspace / Gmail  
- Sender: ${process.env.GMAIL_USER}
- Test sent at: ${new Date().toISOString()}

This email was sent automatically by your Test Platform to verify email configuration.
      `.trim(),
    };

    await transporter.sendMail(mailOptions);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// Get email service info
export function getEmailServiceInfo() {
  return {
    service: 'Google Workspace',
    sender: process.env.GMAIL_USER,
    configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
  };
}
