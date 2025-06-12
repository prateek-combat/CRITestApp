import nodemailer from 'nodemailer';
import { emailLogger } from './logger';

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
    companyName = 'Combat Robotics India',
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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9f0e9 100%);
        }
        .container {
          max-width: 700px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4A5D23 0%, #3e4e1d 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .header p {
          margin: 10px 0 0 0;
          font-size: 18px;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          color: #4A5D23;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .intro-text {
          font-size: 16px;
          color: #323f17;
          margin-bottom: 25px;
          line-height: 1.7;
        }
        .test-info {
          background: linear-gradient(135deg, #f0f4e8 0%, #d9e4c4 100%);
          border-left: 5px solid #4A5D23;
          border-radius: 10px;
          padding: 25px;
          margin: 25px 0;
        }
        .test-name {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 700;
          color: #4A5D23;
          margin-bottom: 15px;
        }
        .candidate-info {
          background: rgba(255,255,255,0.8);
          padding: 15px;
          border-radius: 8px;
          margin-top: 15px;
        }
        .candidate-label {
          font-weight: 600;
          color: #4A5D23;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .candidate-value {
          font-size: 16px;
          color: #323f17;
          margin-top: 5px;
        }
        .expiry-info {
          background: linear-gradient(135deg, #fef7ec 0%, #fed7aa 100%);
          border-left: 5px solid #F5821F;
          padding: 20px;
          margin: 25px 0;
          border-radius: 10px;
        }
        .expiry-info strong {
          color: #c25b16;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .expiry-date {
          color: #c25b16;
          font-weight: 700;
          font-size: 18px;
        }
        .cta-section {
          text-align: center;
          margin: 35px 0;
          padding: 25px;
          background: linear-gradient(135deg, #4A5D23 0%, #3e4e1d 100%);
          border-radius: 12px;
        }
        .cta-button {
          display: inline-block;
          background: linear-gradient(135deg, #F5821F 0%, #e4751c 100%);
          color: white;
          padding: 18px 35px;
          text-decoration: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 18px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(245, 130, 31, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 130, 31, 0.4);
        }
        .custom-message {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-left: 5px solid #3b82f6;
          padding: 20px;
          margin: 25px 0;
          border-radius: 10px;
          font-style: italic;
        }
        .custom-message-title {
          font-weight: 700;
          color: #1e40af;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .custom-message-text {
          color: #1e3a8a;
          line-height: 1.6;
        }
        .instructions {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-left: 5px solid #10B981;
          border-radius: 12px;
          padding: 25px;
          margin: 25px 0;
        }
        .instruction-title {
          font-weight: 700;
          color: #047857;
          margin-bottom: 15px;
          font-size: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .instruction-list {
          margin: 0;
          padding-left: 20px;
        }
        .instruction-list li {
          margin: 12px 0;
          color: #047857;
          font-weight: 500;
          line-height: 1.6;
        }
        .footer {
          margin-top: 40px;
          padding: 25px;
          background: #f8f9fa;
          border-top: 3px solid #4A5D23;
          text-align: center;
        }
        .footer-text {
          color: #6b7280;
          font-size: 14px;
          margin: 8px 0;
        }
        .footer-link {
          color: #4A5D23;
          text-decoration: none;
          font-weight: 600;
        }
        .footer-link:hover {
          color: #F5821F;
        }
        .company-branding {
          margin-top: 20px;
          padding: 20px;
          background: linear-gradient(135deg, #4A5D23 0%, #3e4e1d 100%);
          border-radius: 10px;
          color: white;
        }
        .company-name {
          font-size: 20px;
          font-weight: 700;
          color: #F5821F;
          margin-bottom: 5px;
        }
        .company-tagline {
          font-size: 14px;
          opacity: 0.9;
        }
        .urgent-banner {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 15px;
          text-align: center;
          font-weight: 700;
          font-size: 16px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎯 You're Invited to Take a Test</h1>
          <p>Complete your assessment to proceed with the application process</p>
        </div>
        
        <div class="content">
          <div class="greeting">Hello,</div>
          
          <div class="intro-text">
            You have been invited to take an online assessment. Please complete this test by the deadline to continue with your application process.
          </div>

          ${
            customMessage
              ? `
            <div class="custom-message">
              <div class="custom-message-title">💬 Personal Message</div>
              <div class="custom-message-text">${customMessage}</div>
            </div>
          `
              : ''
          }

          <div class="test-info">
            <div class="test-name">📋 ${testTitle}</div>
            <div class="candidate-info">
              <div class="candidate-label">Candidate Email</div>
              <div class="candidate-value">${candidateEmail}</div>
            </div>
          </div>

          <div class="expiry-info">
            <strong>⏰ Important Deadline</strong>
            <div style="margin-top: 10px;">
              This invitation expires on <span class="expiry-date">${expiryDate}</span>. 
              Please complete the test before this date to secure your opportunity.
            </div>
          </div>

          <div class="cta-section">
            <a href="${testLink}" class="cta-button">
              🚀 Start Test Now
            </a>
          </div>

          <div class="instructions">
            <div class="instruction-title">📝 Before you begin</div>
            <ul class="instruction-list">
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet environment with minimal distractions</li>
              <li>Allow camera and microphone access when prompted</li>
              <li>Complete the test in one session - you cannot pause and resume</li>
              <li>Make sure your device is fully charged or plugged in</li>
            </ul>
          </div>

          <div class="intro-text">
            If you have any questions or technical issues, please contact our support team immediately.
          </div>
          
          <div style="font-size: 18px; color: #4A5D23; font-weight: 600; text-align: center; margin: 20px 0;">
            Good luck with your assessment! 🍀
          </div>
        </div>

        <div class="footer">
          <div class="footer-text">
            This is an automated message from ${companyName}.
          </div>
          <div class="footer-text">
            If you believe you received this email in error, please contact our support team.
          </div>
          <div class="footer-text" style="margin-top: 15px;">
            <a href="${testLink}" class="footer-link">Access Test Link</a> • Valid until ${expiryDate}
          </div>
          
          <div class="company-branding">
            <div class="company-name">Combat Robotics India</div>
            <div class="company-tagline">Innovation • Excellence • Technology</div>
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

  // Customize for reminder with enhanced styling
  let urgentBanner = '';
  if (reminderType === 'final') {
    urgentBanner = `
      <div class="urgent-banner">
        🚨 FINAL NOTICE: Only ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining!
      </div>
    `;
  }

  return baseHtml
    .replace('<div class="content">', `<div class="content">${urgentBanner}`)
    .replace(
      "🎯 You're Invited to Take a Test",
      `${reminderIcon} ${reminderTitle}: Test Pending`
    )
    .replace(
      'Complete your assessment to proceed with the application process',
      `Only ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''} remaining to complete your test`
    )
    .replace(
      'You have been invited to take an online assessment. Please complete this test by the deadline to continue with your application process.',
      `<strong style="color: #dc2626;">URGENT:</strong> Your test invitation expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}. Please complete it as soon as possible to avoid missing this opportunity.`
    );
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
    emailLogger.error(
      'Failed to send invitation email',
      {
        candidateEmail: data.candidateEmail,
        testTitle: data.testTitle,
        operation: 'send_invitation',
      },
      error as Error
    );
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
    emailLogger.error(
      'Failed to send reminder email',
      {
        candidateEmail: data.candidateEmail,
        testTitle: data.testTitle,
        reminderType: data.reminderType,
        operation: 'send_reminder',
      },
      error as Error
    );
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
