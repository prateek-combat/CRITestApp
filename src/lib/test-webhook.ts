import { fetchWithCSRF } from '@/lib/csrf';
import { logger } from '@/lib/logger';

const WEBHOOK_URL = process.env.TEST_RESULTS_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.TEST_WEBHOOK_SECRET;

export interface TestAttemptWebhookPayload {
  testAttemptId: string;
  testId: string;
  testTitle?: string | null;
  invitationId?: string | null;
  jobProfileInvitationId?: string | null;
  candidateEmail?: string | null;
  candidateName?: string | null;
  status: string;
  rawScore?: number | null;
  maxScore?: number | null;
  percentile?: number | null;
  categorySubScores?: Record<string, unknown> | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  meta?: Record<string, unknown>;
}

export async function notifyTestResultsWebhook(
  payload: TestAttemptWebhookPayload
): Promise<void> {
  if (!WEBHOOK_URL) {
    return;
  }

  try {
    const response = await fetchWithCSRF(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WEBHOOK_SECRET ? { 'X-Test-Webhook-Secret': WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.warn('Test webhook returned non-200 response', {
        endpoint: WEBHOOK_URL,
        status: response.status,
        statusText: response.statusText,
        payloadSummary: {
          testAttemptId: payload.testAttemptId,
          candidateEmail: payload.candidateEmail,
        },
      });
    }
  } catch (error) {
    logger.error(
      'Failed to notify external test webhook',
      {
        endpoint: WEBHOOK_URL,
        payloadSummary: {
          testAttemptId: payload.testAttemptId,
          candidateEmail: payload.candidateEmail,
        },
      },
      error as Error
    );
  }
}
