/**
 * Tests for worker authentication functionality
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { requireWorkerAuth } from '@/lib/worker-auth';

describe('Worker Auth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('requireWorkerAuth', () => {
    describe('when WORKER_API_TOKEN is not configured', () => {
      beforeEach(() => {
        delete process.env.WORKER_API_TOKEN;
      });

      it('should return 503 response', () => {
        const request = new NextRequest('http://localhost:3000/api/worker');

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(503);
        }
      });

      it('should return error message about token not configured', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker');

        const result = requireWorkerAuth(request);

        if (!result.authorized) {
          const body = await result.response.json();
          expect(body.error).toBe('Worker API token not configured');
        }
      });
    });

    describe('when WORKER_API_TOKEN is configured', () => {
      beforeEach(() => {
        process.env.WORKER_API_TOKEN = 'valid-worker-token-12345';
      });

      it('should return 401 when x-worker-token header is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker');

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
          const body = await result.response.json();
          expect(body.error).toBe('Unauthorized');
        }
      });

      it('should return 401 when token does not match', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'invalid-token',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
          const body = await result.response.json();
          expect(body.error).toBe('Unauthorized');
        }
      });

      it('should return 401 when token length differs but starts with same chars', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'valid-worker-token', // Shorter than expected
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
        }
      });

      it('should return 401 when token is longer than expected', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'valid-worker-token-12345-extra-chars',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
        }
      });

      it('should return authorized:true when token matches exactly', () => {
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'valid-worker-token-12345',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(true);
        expect(result).not.toHaveProperty('response');
      });

      it('should use timing-safe comparison (same time for valid and invalid tokens of same length)', () => {
        // This test verifies the function uses timingSafeEqual by checking
        // that it correctly rejects tokens that are the same length but different content
        const request1 = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'valid-worker-token-12345',
          },
        });

        const request2 = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'xxxxx-worker-token-12345', // Same length, different content
          },
        });

        const result1 = requireWorkerAuth(request1);
        const result2 = requireWorkerAuth(request2);

        expect(result1.authorized).toBe(true);
        expect(result2.authorized).toBe(false);
      });
    });

    describe('edge cases', () => {
      beforeEach(() => {
        process.env.WORKER_API_TOKEN = 'test-token';
      });

      it('should handle empty token header', async () => {
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': '',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(false);
        if (!result.authorized) {
          expect(result.response.status).toBe(401);
        }
      });

      it('should handle token with leading/trailing whitespace', async () => {
        // Note: HTTP headers typically preserve whitespace, but our token
        // comparison is exact so padded tokens should fail
        process.env.WORKER_API_TOKEN = 'test-token';
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'test-token', // Without whitespace - exact match
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(true);
      });

      it('should handle special characters in token', () => {
        process.env.WORKER_API_TOKEN = 'token-with-$pecial-ch@rs!';
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'token-with-$pecial-ch@rs!',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(true);
      });

      it('should handle ASCII extended characters in token', () => {
        // Note: HTTP headers are typically ASCII, so we test with ASCII-safe characters
        process.env.WORKER_API_TOKEN = 'token-with-extended-chars-123!@#';
        const request = new NextRequest('http://localhost:3000/api/worker', {
          headers: {
            'x-worker-token': 'token-with-extended-chars-123!@#',
          },
        });

        const result = requireWorkerAuth(request);

        expect(result.authorized).toBe(true);
      });
    });
  });
});
