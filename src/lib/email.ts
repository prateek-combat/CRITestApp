/**
 * Email Service Stub
 * Minimal implementation to maintain API compatibility after removing email infrastructure
 */

import { logger } from './logger';

export interface InvitationEmailData {
  candidateEmail: string;
  testTitle: string;
  testLink: string;
  expiresAt: Date;
  customMessage?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
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
 * Send invitation email (stub implementation)
 */
export async function sendInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  logger.info(
    'Email service disabled - invitation created without email notification',
    {
      email: data.candidateEmail,
      testTitle: data.testTitle,
      operation: 'send_invitation_email_stub',
    }
  );

  return {
    success: true,
    messageId: 'stub-message-id',
  };
}

/**
 * Send bulk invitation emails (stub implementation)
 */
export async function sendBulkInvitations(
  invitations: InvitationEmailData[]
): Promise<BulkEmailResult> {
  logger.info(
    'Email service disabled - bulk invitations created without email notifications',
    {
      count: invitations.length,
      emails: invitations.map((inv) => inv.candidateEmail),
      operation: 'send_bulk_invitations_stub',
    }
  );

  const results = invitations.map((invitation) => ({
    email: invitation.candidateEmail,
    success: true,
    messageId: 'stub-message-id',
  }));

  return {
    success: true,
    totalSent: invitations.length,
    totalFailed: 0,
    results,
  };
}

/**
 * Send reminder email (stub implementation)
 */
export async function sendReminderEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  logger.info('Email service disabled - reminder not sent', {
    email: data.candidateEmail,
    testTitle: data.testTitle,
    operation: 'send_reminder_email_stub',
  });

  return {
    success: true,
    messageId: 'stub-message-id',
  };
}

/**
 * Send test completion candidate email (stub implementation)
 */
export async function sendTestCompletionCandidateEmail(data: {
  candidateEmail: string;
  candidateName: string;
  testTitle: string;
  completedAt: Date;
  companyName: string;
}): Promise<EmailResult> {
  logger.info(
    'Email service disabled - test completion confirmation not sent to candidate',
    {
      email: data.candidateEmail,
      candidateName: data.candidateName,
      testTitle: data.testTitle,
      operation: 'send_test_completion_candidate_email_stub',
    }
  );

  return {
    success: true,
    messageId: 'stub-message-id',
  };
}

/**
 * Send job profile invitation email (stub implementation)
 */
export async function sendJobProfileInvitationEmail(data: {
  candidateEmail: string;
  candidateName: string;
  jobProfileTitle: string;
  invitationLink: string;
  expiresAt: Date;
  customMessage?: string;
}): Promise<EmailResult> {
  logger.info('Email service disabled - job profile invitation not sent', {
    email: data.candidateEmail,
    candidateName: data.candidateName,
    jobProfileTitle: data.jobProfileTitle,
    operation: 'send_job_profile_invitation_email_stub',
  });

  return {
    success: true,
    messageId: 'stub-message-id',
  };
}

/**
 * Send test completion admin notification (stub implementation)
 */
export async function sendTestCompletionAdminNotification(data: {
  testId: string;
  testAttemptId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  score: number;
  maxScore: number;
  completedAt: Date;
  timeTaken: number;
  answers: any[];
}): Promise<EmailResult> {
  logger.info(
    'Email service disabled - admin notification not sent for test completion',
    {
      testId: data.testId,
      candidateEmail: data.candidateEmail,
      candidateName: data.candidateName,
      score: data.score,
      operation: 'send_test_completion_admin_notification_stub',
    }
  );

  return {
    success: true,
    messageId: 'stub-message-id',
  };
}
