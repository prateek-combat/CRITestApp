import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

export function requireWorkerAuth(
  request: NextRequest
): { authorized: true } | { authorized: false; response: NextResponse } {
  const expected = process.env.WORKER_API_TOKEN;
  const token = request.headers.get('x-worker-token');

  if (!expected) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Worker API token not configured' },
        { status: 503 }
      ),
    };
  }

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const expectedBuffer = Buffer.from(expected);
  const tokenBuffer = Buffer.from(token);
  const isMatch =
    expectedBuffer.length === tokenBuffer.length &&
    timingSafeEqual(expectedBuffer, tokenBuffer);

  if (!isMatch) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
