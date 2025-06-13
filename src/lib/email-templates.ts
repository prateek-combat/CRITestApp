/**
 * Email Template System
 * Centralized email templates to reduce HTML duplication
 */

import { EMAIL_COMPANY_NAME } from './constants';

interface BaseEmailData {
  recipientName?: string;
  customMessage?: string;
}

interface InvitationEmailData extends BaseEmailData {
  testTitle: string;
  testLink: string;
  expiresAt: Date;
}

interface TestCompletionEmailData extends BaseEmailData {
  testTitle: string;
  candidateName: string;
  candidateEmail: string;
  completedAt: Date;
  score?: number;
  dashboardLink?: string;
}

interface ReminderEmailData extends BaseEmailData {
  testTitle: string;
  testLink: string;
  daysRemaining: number;
}

/**
 * Base email template with consistent styling
 */
function baseEmailTemplate(content: string, title: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .card {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 40px;
          margin: 20px 0;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
          text-decoration: none;
        }
        h1 {
          color: #1f2937;
          font-size: 28px;
          margin: 20px 0;
          text-align: center;
        }
        h2 {
          color: #374151;
          font-size: 20px;
          margin: 15px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          text-align: center;
          margin: 20px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .info-box {
          background-color: #f3f4f6;
          border-left: 4px solid #2563eb;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .warning {
          color: #dc2626;
          font-weight: 500;
        }
        .success {
          color: #059669;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background-color: #f9fafb;
          font-weight: 600;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="header">
            <a href="#" class="logo">${EMAIL_COMPANY_NAME}</a>
          </div>
          ${content}
          <div class="footer">
            <p>This is an automated email from ${EMAIL_COMPANY_NAME}.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Test invitation email template
 */
export function invitationEmailTemplate(data: InvitationEmailData): string {
  const expiryDate = new Date(data.expiresAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h1>You're Invited to Take a Test</h1>
    
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    
    <p>You have been invited to complete the following assessment:</p>
    
    <div class="info-box">
      <h2>${data.testTitle}</h2>
      ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
    </div>
    
    <div style="text-align: center;">
      <a href="${data.testLink}" class="button">Start Test</a>
    </div>
    
    <p><strong>Important:</strong> This invitation expires on <span class="warning">${expiryDate}</span>.</p>
    
    <p>If you have any questions or need assistance, please contact your test administrator.</p>
    
    <p>Best regards,<br>${EMAIL_COMPANY_NAME} Team</p>
  `;

  return baseEmailTemplate(content, `Test Invitation - ${data.testTitle}`);
}

/**
 * Test completion notification email template (for admins)
 */
export function testCompletionAdminTemplate(
  data: TestCompletionEmailData
): string {
  const completedDate = new Date(data.completedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = `
    <h1>Test Completed</h1>
    
    <p>A candidate has completed the test assessment.</p>
    
    <table>
      <tr>
        <th>Test</th>
        <td>${data.testTitle}</td>
      </tr>
      <tr>
        <th>Candidate</th>
        <td>${data.candidateName}</td>
      </tr>
      <tr>
        <th>Email</th>
        <td>${data.candidateEmail}</td>
      </tr>
      <tr>
        <th>Completed At</th>
        <td>${completedDate}</td>
      </tr>
      ${
        data.score !== undefined
          ? `
      <tr>
        <th>Score</th>
        <td class="success">${data.score}%</td>
      </tr>
      `
          : ''
      }
    </table>
    
    ${
      data.dashboardLink
        ? `
    <div style="text-align: center;">
      <a href="${data.dashboardLink}" class="button">View Full Results</a>
    </div>
    `
        : ''
    }
    
    <p>You can review the detailed results and analytics in your admin dashboard.</p>
  `;

  return baseEmailTemplate(content, 'Test Completion Notification');
}

/**
 * Test completion confirmation email template (for candidates)
 */
export function testCompletionCandidateTemplate(
  data: TestCompletionEmailData
): string {
  const content = `
    <h1>Test Submission Confirmed</h1>
    
    <p>Dear ${data.candidateName},</p>
    
    <p>Thank you for completing the <strong>${data.testTitle}</strong> assessment.</p>
    
    <div class="info-box">
      <p class="success">✓ Your responses have been successfully recorded and submitted.</p>
    </div>
    
    <h2>What happens next?</h2>
    <p>Our team will review your submission and may contact you regarding the next steps in the evaluation process.</p>
    
    <p>If you have any questions or concerns about your test submission, please don't hesitate to contact us.</p>
    
    <p>Best regards,<br>${EMAIL_COMPANY_NAME} Team</p>
  `;

  return baseEmailTemplate(content, 'Test Submission Confirmed');
}

/**
 * Test reminder email template
 */
export function reminderEmailTemplate(data: ReminderEmailData): string {
  const urgencyClass = data.daysRemaining <= 3 ? 'warning' : '';

  const content = `
    <h1>Reminder: Complete Your Test</h1>
    
    <p>Hello${data.recipientName ? ` ${data.recipientName}` : ''},</p>
    
    <p>This is a friendly reminder that you have a pending test assessment:</p>
    
    <div class="info-box">
      <h2>${data.testTitle}</h2>
      <p class="${urgencyClass}">Time remaining: ${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${data.testLink}" class="button">Complete Test Now</a>
    </div>
    
    <p>Please complete the test before it expires to ensure your submission is recorded.</p>
    
    <p>If you've already completed the test, you can safely ignore this reminder.</p>
    
    <p>Best regards,<br>${EMAIL_COMPANY_NAME} Team</p>
  `;

  return baseEmailTemplate(content, `Test Reminder - ${data.testTitle}`);
}

/**
 * Generic notification email template
 */
export function genericEmailTemplate(
  subject: string,
  heading: string,
  body: string,
  ctaText?: string,
  ctaLink?: string
): string {
  const content = `
    <h1>${heading}</h1>
    
    ${body}
    
    ${
      ctaText && ctaLink
        ? `
    <div style="text-align: center;">
      <a href="${ctaLink}" class="button">${ctaText}</a>
    </div>
    `
        : ''
    }
  `;

  return baseEmailTemplate(content, subject);
}
