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
 * Parse multiple emails from text
 */
export function parseMultipleEmails(emailText: string): {
  valid: string[];
  invalid: string[];
} {
  const emails = emailText
    .split(/[,;\n\r\t\s]+/)
    .map((email) => email.trim())
    .filter((email) => email.length > 0);

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    if (validateEmail(email)) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return { valid, invalid };
}

/**
 * Send invitation email (stub implementation)
 * Always returns success but logs that email service is disabled
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
 * Always returns success but logs that email service is disabled
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
