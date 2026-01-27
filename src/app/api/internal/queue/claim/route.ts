import { NextRequest, NextResponse } from 'next/server';
import {
  fetchProctorAnalysisJob,
  failProctorAnalysisJob,
  PROCTOR_ANALYSIS_JOB_SCHEMA_VERSION,
} from '@/lib/queue';
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

  const job = await fetchProctorAnalysisJob();

  if (!job) {
    return NextResponse.json({ job: null });
  }

  const data = job.data;
  if (data?.schemaVersion !== PROCTOR_ANALYSIS_JOB_SCHEMA_VERSION) {
    await failProctorAnalysisJob(job.id, {
      error: 'Unsupported job schema version',
      schemaVersion: data?.schemaVersion,
    });
    return NextResponse.json(
      { job: null, error: 'Unsupported job schema version' },
      { status: 422 }
    );
  }

  return NextResponse.json({
    job: {
      id: job.id,
      name: job.name,
      data: job.data,
    },
  });
}
