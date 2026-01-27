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
