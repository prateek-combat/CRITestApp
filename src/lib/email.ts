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
    <p>Hello ${candidateName},</p>
    <p>You have been invited to the job profile: <strong>${jobProfileName}</strong>.</p>
    <p>Positions: ${positions.join(', ')}</p>
    <p>Tests: ${tests.map((t) => t.title).join(', ')}</p>
    ${customMessage ? `<p>Message from the recruiter: ${customMessage}</p>` : ''}
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
