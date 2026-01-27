import { NextRequest, NextResponse } from 'next/server';
import { completeProctorAnalysisJob } from '@/lib/queue';
import { requireWorkerAuth } from '@/lib/worker-auth';

export async function POST(request: NextRequest) {
  const auth = requireWorkerAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  const body = await request.json();
  const { jobId, result } = body ?? {};

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  await completeProctorAnalysisJob(jobId, result);

  return NextResponse.json({ success: true });
}
