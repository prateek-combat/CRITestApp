import nodemailer from 'nodemailer';
import { logger } from './logger';

// HTML escape function to prevent XSS in emails
function escapeHtml(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
}

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
    <p>Hello ${escapeHtml(candidateName)},</p>
    <p>You have been invited to the job profile: <strong>${escapeHtml(jobProfileName)}</strong>.</p>
    <p>Positions: ${positions.map((p) => escapeHtml(p)).join(', ')}</p>
    <p>Tests: ${tests.map((t) => escapeHtml(t.title)).join(', ')}</p>
    ${customMessage ? `<p>Message from the recruiter: ${escapeHtml(customMessage)}</p>` : ''}
    <p>Please use the following link to access the test: <a href="${invitationLink}">${invitationLink}</a></p>
    <p>This link will expire on ${expiresAt.toLocaleString()}.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Combat Robotics" <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Invitation to Job Profile: ${jobProfileName}`,
      html,
    });

    logger.info('Invitation email sent successfully', {
      messageId: info.messageId,
      operation: 'send_job_profile_invitation_email',
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send invitation email', {
      error: error.message,
      operation: 'send_job_profile_invitation_email',
    });
    return { success: false, error: error.message };
  }
}

export interface InvitationEmailData {
  candidateEmail: string;
  testTitle: string;
  testLink: string;
  expiresAt: Date;
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

/**
 * Send invitation email for test
 */
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  const { candidateEmail, testTitle, testLink, expiresAt, customMessage } =
    data;

  const html = `
    <p>Hello,</p>
    <p>You have been invited to take the test: <strong>${escapeHtml(testTitle)}</strong></p>
    ${customMessage ? `<p>${escapeHtml(customMessage)}</p>` : ''}
    <p>Please use the following link to access the test: <a href="${testLink}">${testLink}</a></p>
    <p>This link will expire on ${expiresAt.toLocaleString()}.</p>
    <p>Best regards,<br>Combat Robotics Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Combat Robotics" <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Test Invitation: ${escapeHtml(testTitle)}`,
      html,
    });

    logger.info('Invitation email sent successfully', {
      messageId: info.messageId,
      operation: 'send_invitation_email',
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send invitation email', {
      error: error.message,
      operation: 'send_invitation_email',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk invitations
 */
export async function sendBulkInvitations(
  invitations: InvitationEmailData[]
): Promise<BulkEmailResult> {
  const results: Array<{
    email: string;
    success: boolean;
    messageId?: string;
    error?: string;
  }> = [];

  let totalSent = 0;
  let totalFailed = 0;

  for (const invitation of invitations) {
    const result = await sendInvitationEmail(invitation);

    if (result.success) {
      totalSent++;
      results.push({
        email: invitation.candidateEmail,
        success: true,
        messageId: result.messageId,
      });
    } else {
      totalFailed++;
      results.push({
        email: invitation.candidateEmail,
        success: false,
        error: result.error,
      });
    }

    // Add a small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    success: totalFailed === 0,
    totalSent,
    totalFailed,
    results,
  };
}

/**
 * Send reminder email
 */
export async function sendReminderEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  const { candidateEmail, testTitle, testLink, expiresAt } = data;

  const html = `
    <p>Hello,</p>
    <p>This is a reminder about your pending test: <strong>${escapeHtml(testTitle)}</strong></p>
    <p>Please complete the test before it expires.</p>
    <p>Test link: <a href="${testLink}">${testLink}</a></p>
    <p>Expires on: ${expiresAt.toLocaleString()}</p>
    <p>Best regards,<br>Combat Robotics Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Combat Robotics" <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Reminder: ${escapeHtml(testTitle)}`,
      html,
    });

    logger.info('Reminder email sent successfully', {
      messageId: info.messageId,
      operation: 'send_reminder_email',
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send reminder email', {
      error: error.message,
      operation: 'send_reminder_email',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send test completion email to candidate
 */
export async function sendTestCompletionCandidateEmail(
  candidateEmail: string,
  candidateName: string,
  testTitle: string,
  score?: number,
  totalQuestions?: number
): Promise<EmailResult> {
  const html = `
    <p>Hello ${escapeHtml(candidateName)},</p>
    <p>Thank you for completing the test: <strong>${escapeHtml(testTitle)}</strong></p>
    ${
      score !== undefined && totalQuestions !== undefined
        ? `<p>Your score: ${score} out of ${totalQuestions}</p>`
        : '<p>Your submission has been received and is being reviewed.</p>'
    }
    <p>We will contact you soon with the next steps.</p>
    <p>Best regards,<br>Combat Robotics Team</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Combat Robotics" <${process.env.GMAIL_USER}>`,
      to: candidateEmail,
      subject: `Test Completed: ${escapeHtml(testTitle)}`,
      html,
    });

    logger.info('Test completion candidate email sent successfully', {
      messageId: info.messageId,
      operation: 'send_test_completion_candidate_email',
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send test completion candidate email', {
      error: error.message,
      operation: 'send_test_completion_candidate_email',
    });
    return { success: false, error: error.message };
  }
}

/**
 * Send test completion notification to admin
 */
export async function sendTestCompletionAdminNotification(
  adminEmail: string,
  candidateName: string,
  candidateEmail: string,
  testTitle: string,
  score: number,
  totalQuestions: number,
  completedAt: Date
): Promise<EmailResult> {
  const html = `
    <p>A candidate has completed a test:</p>
    <ul>
      <li><strong>Candidate:</strong> ${escapeHtml(candidateName)} (${escapeHtml(candidateEmail)})</li>
      <li><strong>Test:</strong> ${escapeHtml(testTitle)}</li>
      <li><strong>Score:</strong> ${score} out of ${totalQuestions}</li>
      <li><strong>Completed at:</strong> ${completedAt.toLocaleString()}</li>
    </ul>
    <p>Please review the results in the admin dashboard.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Combat Robotics" <${process.env.GMAIL_USER}>`,
      to: adminEmail,
      subject: `Test Completed: ${escapeHtml(candidateName)} - ${escapeHtml(testTitle)}`,
      html,
    });

    logger.info('Test completion admin notification sent successfully', {
      messageId: info.messageId,
      operation: 'send_test_completion_admin_notification',
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    logger.error('Failed to send test completion admin notification', {
      error: error.message,
      operation: 'send_test_completion_admin_notification',
    });
    return { success: false, error: error.message };
  }
}
