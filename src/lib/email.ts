import nodemailer from 'nodemailer';
import { logger } from './logger';

export interface JobProfileInvitationEmailData {
  candidateEmail: string;
  candidateName: string;
  jobProfileName: string;
  positions: string[];
  tests: {
    title: string;
    questionsCount?: number;
  }[];
  customMessage: string;
  invitationLink: string;
  expiresAt: Date;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendJobProfileInvitationEmail(
  data: JobProfileInvitationEmailData
): Promise<EmailResult> {
  const {
    candidateEmail,
    candidateName,
    jobProfileName,
    positions,
    tests,
    customMessage,
    invitationLink,
    expiresAt,
  } = data;

  const html = `
    <p>Hello${candidateName ? ` ${candidateName}` : ''},</p>
    <p>You have been invited to the job profile: <strong>${jobProfileName}</strong>.</p>
    <p>Positions: ${positions.join(', ')}</p>
    <p>Tests to complete:</p>
    <ul>
      ${tests.map((test) => `<li>${test.title}${test.questionsCount ? ` (${test.questionsCount} questions)` : ''}</li>`).join('')}
    </ul>
    ${customMessage ? `<p>${customMessage}</p>` : ''}
    <p>Please click the link below to start the assessment:</p>
    <p><a href="${invitationLink}">${invitationLink}</a></p>
    <p>This invitation expires on: ${expiresAt.toLocaleDateString()}</p>
    <p>Best regards,<br>Combat Robotics India</p>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: candidateEmail,
    subject: `Job Profile Invitation: ${jobProfileName}`,
    html,
  };

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Job profile invitation email sent', {
      to: candidateEmail,
      messageId: info.messageId,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send job profile invitation email', {
      error,
      to: candidateEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Legacy test invitation interface for compatibility
export interface InvitationEmailData {
  candidateEmail: string;
  testTitle: string;
  testLink: string;
  expiresAt: Date;
  companyName: string;
  customMessage?: string;
}

export interface BulkEmailResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  results: Array<{
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }>;
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate array of email addresses
 */
export function validateEmailAddresses(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  emails.forEach((email) => {
    if (validateEmail(email)) {
      valid.push(email.trim());
    } else {
      invalid.push(email);
    }
  });

  return { valid, invalid };
}

/**
 * Parse multiple emails from a text input (stub implementation)
 */
export function parseMultipleEmails(emailText: string): string[] {
  if (!emailText || typeof emailText !== 'string') {
    return [];
  }

  // Split by common delimiters and clean up
  return emailText
    .split(/[,;\n\r\t]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}

// Legacy function for test invitations
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  const {
    candidateEmail,
    testTitle,
    testLink,
    expiresAt,
    companyName,
    customMessage,
  } = data;

  const html = `
    <p>Hello,</p>
    <p>You have been invited to take the test: <strong>${testTitle}</strong>.</p>
    ${customMessage ? `<p>${customMessage}</p>` : ''}
    <p>Please click the link below to start the test:</p>
    <p><a href="${testLink}">${testLink}</a></p>
    <p>This invitation expires on: ${expiresAt.toLocaleDateString()}</p>
    <p>Best regards,<br>${companyName}</p>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: candidateEmail,
    subject: `Test Invitation: ${testTitle}`,
    html,
  };

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Test invitation email sent', {
      to: candidateEmail,
      messageId: info.messageId,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send test invitation email', {
      error,
      to: candidateEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Bulk invitation sending
export async function sendBulkInvitations(
  invitations: InvitationEmailData[]
): Promise<BulkEmailResult> {
  const results: BulkEmailResult['results'] = [];
  let totalSent = 0;
  let totalFailed = 0;

  for (const invitation of invitations) {
    const result = await sendInvitationEmail(invitation);
    results.push({
      email: invitation.candidateEmail,
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });

    if (result.success) {
      totalSent++;
    } else {
      totalFailed++;
    }
  }

  return {
    success: totalFailed === 0,
    totalSent,
    totalFailed,
    results,
  };
}

// Test reminder email
export async function sendReminderEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  const { candidateEmail, testTitle, testLink, expiresAt, companyName } = data;

  const html = `
    <p>Hello,</p>
    <p>This is a reminder about your pending test: <strong>${testTitle}</strong>.</p>
    <p>The test invitation will expire on: ${expiresAt.toLocaleDateString()}</p>
    <p>Please click the link below to start the test:</p>
    <p><a href="${testLink}">${testLink}</a></p>
    <p>Best regards,<br>${companyName}</p>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: candidateEmail,
    subject: `Reminder: ${testTitle}`,
    html,
  };

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Reminder email sent', {
      to: candidateEmail,
      messageId: info.messageId,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send reminder email', {
      error,
      to: candidateEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Test completion emails
export interface TestCompletionEmailData {
  candidateEmail: string;
  candidateName?: string;
  testTitle: string;
  completionTime: Date;
  score?: number;
  maxScore?: number;
}

export async function sendTestCompletionCandidateEmail(
  data: TestCompletionEmailData
): Promise<EmailResult> {
  const {
    candidateEmail,
    candidateName,
    testTitle,
    completionTime,
    score,
    maxScore,
  } = data;

  const html = `
    <p>Hello${candidateName ? ` ${candidateName}` : ''},</p>
    <p>Thank you for completing the test: <strong>${testTitle}</strong>.</p>
    <p>Test completed on: ${completionTime.toLocaleString()}</p>
    ${
      score !== undefined && maxScore !== undefined
        ? `<p>Your score: ${score} / ${maxScore}</p>`
        : '<p>Your results are being processed.</p>'
    }
    <p>We will contact you soon regarding the next steps.</p>
    <p>Best regards,<br>Combat Robotics India</p>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: candidateEmail,
    subject: `Test Completed: ${testTitle}`,
    html,
  };

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Test completion email sent to candidate', {
      to: candidateEmail,
      messageId: info.messageId,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send test completion email', {
      error,
      to: candidateEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export interface AdminNotificationEmailData extends TestCompletionEmailData {
  adminEmail: string;
  candidateId?: string;
  testAttemptId?: string;
}

export async function sendTestCompletionAdminNotification(
  data: AdminNotificationEmailData
): Promise<EmailResult> {
  const {
    adminEmail,
    candidateEmail,
    candidateName,
    testTitle,
    completionTime,
    score,
    maxScore,
    candidateId,
    testAttemptId,
  } = data;

  const html = `
    <p>Hello Admin,</p>
    <p>A candidate has completed a test.</p>
    <p><strong>Candidate Details:</strong></p>
    <ul>
      <li>Name: ${candidateName || 'Not provided'}</li>
      <li>Email: ${candidateEmail}</li>
      ${candidateId ? `<li>ID: ${candidateId}</li>` : ''}
    </ul>
    <p><strong>Test Details:</strong></p>
    <ul>
      <li>Test: ${testTitle}</li>
      <li>Completed: ${completionTime.toLocaleString()}</li>
      ${
        score !== undefined && maxScore !== undefined
          ? `<li>Score: ${score} / ${maxScore}</li>`
          : ''
      }
      ${testAttemptId ? `<li>Attempt ID: ${testAttemptId}</li>` : ''}
    </ul>
    <p>Please review the results in the admin dashboard.</p>
    <p>Best regards,<br>Test Platform System</p>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: adminEmail,
    subject: `Test Completed by ${candidateName || candidateEmail}`,
    html,
  };

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      logger.warn('Email credentials not configured. Skipping email send.');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    const info = await transporter.sendMail(mailOptions);
    logger.info('Admin notification email sent', {
      to: adminEmail,
      messageId: info.messageId,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send admin notification email', {
      error,
      to: adminEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
