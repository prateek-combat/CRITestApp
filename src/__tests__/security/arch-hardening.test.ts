import type { NextResponse } from 'next/server';

jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      body,
    }),
  },
}));

jest.mock('next-auth/jwt', () => ({
  getToken: jest.fn(),
}));

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

const loadCsrf = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@/lib/csrf') as typeof import('@/lib/csrf');
};

describe('CSRF cookie naming', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('uses __Host-csrf-token in production', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    const { CSRF_COOKIE_NAME } = loadCsrf();
    expect(CSRF_COOKIE_NAME).toBe('__Host-csrf-token');
  });

  it('uses csrf-token in non-production', () => {
    process.env.NODE_ENV = 'development';
    jest.resetModules();
    const { CSRF_COOKIE_NAME } = loadCsrf();
    expect(CSRF_COOKIE_NAME).toBe('csrf-token');
  });
});

describe('CSRF validation', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('allows unauthenticated requests', async () => {
    const { getToken } = require('next-auth/jwt');
    getToken.mockResolvedValue(null);

    const { validateCSRFToken } = loadCsrf();
    const request = {
      method: 'POST',
      headers: new Headers(),
      cookies: { get: () => undefined },
      nextUrl: new URL('http://localhost/api/admin/tests'),
    } as any;

    await expect(validateCSRFToken(request)).resolves.toBe(true);
  });

  it('rejects missing CSRF tokens for authenticated requests', async () => {
    const { getToken } = require('next-auth/jwt');
    getToken.mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });

    const { validateCSRFToken } = loadCsrf();
    const request = {
      method: 'POST',
      headers: new Headers(),
      cookies: { get: () => undefined },
      nextUrl: new URL('http://localhost/api/admin/tests'),
    } as any;

    await expect(validateCSRFToken(request)).resolves.toBe(false);
  });

  it('accepts matching CSRF header and cookie', async () => {
    const { getToken } = require('next-auth/jwt');
    getToken.mockResolvedValue({ sub: 'user-1', role: 'ADMIN' });

    const { validateCSRFToken, CSRF_COOKIE_NAME } = loadCsrf();
    const request = {
      method: 'POST',
      headers: new Headers({ 'x-csrf-token': 'token123' }),
      cookies: {
        get: (name: string) =>
          name === CSRF_COOKIE_NAME ? { value: 'token123' } : undefined,
      },
      nextUrl: new URL('http://localhost/api/admin/tests'),
    } as any;

    await expect(validateCSRFToken(request)).resolves.toBe(true);
  });
});

describe('admin auth helper', () => {
  afterEach(() => {
    jest.resetModules();
  });

  it('returns 401 when no session', async () => {
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue(null);

    const { requireAdmin } =
      require('@/lib/auth') as typeof import('@/lib/auth');
    const result = await requireAdmin();

    expect('response' in result).toBe(true);
    expect((result as { response: NextResponse }).response.status).toBe(401);
  });

  it('returns 403 for non-admin role', async () => {
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue({ user: { role: 'USER' } });

    const { requireAdmin } =
      require('@/lib/auth') as typeof import('@/lib/auth');
    const result = await requireAdmin();

    expect('response' in result).toBe(true);
    expect((result as { response: NextResponse }).response.status).toBe(403);
  });

  it('returns session for admin role', async () => {
    const { getServerSession } = require('next-auth/next');
    getServerSession.mockResolvedValue({ user: { role: 'ADMIN' } });

    const { requireAdmin } =
      require('@/lib/auth') as typeof import('@/lib/auth');
    const result = await requireAdmin();

    expect('session' in result).toBe(true);
  });
});

describe('worker auth', () => {
  afterEach(() => {
    delete process.env.WORKER_API_TOKEN;
  });

  it('rejects requests with missing token', () => {
    process.env.WORKER_API_TOKEN = 'secret';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireWorkerAuth } =
      require('@/lib/worker-auth') as typeof import('@/lib/worker-auth');

    const req = { headers: new Headers() } as any;
    const result = requireWorkerAuth(req);

    expect(result.authorized).toBe(false);
    const response = (result as { response: NextResponse }).response;
    expect(response.status).toBe(401);
  });

  it('returns 503 when token is not configured', () => {
    delete process.env.WORKER_API_TOKEN;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireWorkerAuth } =
      require('@/lib/worker-auth') as typeof import('@/lib/worker-auth');

    const req = { headers: new Headers({ 'x-worker-token': 'secret' }) } as any;
    const result = requireWorkerAuth(req);

    expect(result.authorized).toBe(false);
    const response = (result as { response: NextResponse }).response;
    expect(response.status).toBe(503);
  });

  it('accepts requests with valid token', () => {
    process.env.WORKER_API_TOKEN = 'secret';
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { requireWorkerAuth } =
      require('@/lib/worker-auth') as typeof import('@/lib/worker-auth');

    const req = { headers: new Headers({ 'x-worker-token': 'secret' }) } as any;
    const result = requireWorkerAuth(req);

    expect(result.authorized).toBe(true);
  });
});
