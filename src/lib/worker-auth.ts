import { NextRequest, NextResponse } from 'next/server';

export function requireWorkerAuth(
  request: NextRequest
): { authorized: true } | { authorized: false; response: NextResponse } {
  const expected = process.env.WORKER_API_TOKEN;
  const token = request.headers.get('x-worker-token');

  if (!expected || token !== expected) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
