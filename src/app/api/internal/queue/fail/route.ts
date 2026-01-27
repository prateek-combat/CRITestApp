import { NextRequest, NextResponse } from 'next/server';
import { failProctorAnalysisJob } from '@/lib/queue';
import { requireWorkerAuth } from '@/lib/worker-auth';
import { rateLimitConfigs, withRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimited = await withRateLimit(request, rateLimitConfigs.sensitive);
  if (rateLimited) {
    return rateLimited;
  }

  const auth = requireWorkerAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await request.json();
  const { jobId, error } = body ?? {};

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  await failProctorAnalysisJob(jobId, error);

  return NextResponse.json({ success: true });
}
