import { NextRequest, NextResponse } from 'next/server';
import { completeProctorAnalysisJob } from '@/lib/queue';
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
  const { jobId, result } = body ?? {};

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  if (result !== undefined && (typeof result !== 'object' || result === null)) {
    return NextResponse.json(
      { error: 'result must be an object if provided' },
      { status: 400 }
    );
  }

  await completeProctorAnalysisJob(jobId, result);

  return NextResponse.json({ success: true });
}
