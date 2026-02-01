/**
 * Tests for rate limiting functionality
 * @jest-environment node
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  RateLimiter,
  rateLimitConfigs,
  withRateLimit,
  addRateLimitHeaders,
} from '@/lib/rate-limit';

describe('RateLimiter', () => {
  describe('constructor', () => {
    it('should use default config when no options provided', async () => {
      const limiter = new RateLimiter();
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = await limiter.check(request);

      expect(result.limit).toBe(100); // Default uniqueTokenPerInterval
      expect(result.success).toBe(true);
    });

    it('should merge custom config with defaults', async () => {
      const limiter = new RateLimiter({
        uniqueTokenPerInterval: 5,
        interval: 30000,
      });
      const request = new NextRequest('http://localhost:3000/api/test');

      const result = await limiter.check(request);

      expect(result.limit).toBe(5);
      expect(result.success).toBe(true);
    });
  });

  describe('getIdentifier', () => {
    it('should use x-user-id header when present', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 2 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'user-123' },
      });

      // First request
      await limiter.check(request);
      // Second request - should still succeed
      const result = await limiter.check(request);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('should use x-forwarded-for header when no user id', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 2 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      await limiter.check(request);
      const result = await limiter.check(request);

      expect(result.remaining).toBe(0);
    });

    it('should extract first IP from x-forwarded-for with multiple IPs', async () => {
      // Use a unique IP to avoid collision with other tests
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 1 });
      const uniqueIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-forwarded-for': `${uniqueIp}, 10.0.0.1, 172.16.0.1` },
      });

      const result = await limiter.check(request);

      expect(result.success).toBe(true);
    });

    it('should use x-real-ip as fallback when x-forwarded-for not present', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 2 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      await limiter.check(request);
      const result = await limiter.check(request);

      expect(result.remaining).toBe(0);
    });

    it('should use "unknown" when no identifiers present', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 2 });
      const request = new NextRequest('http://localhost:3000/api/test');

      await limiter.check(request);
      const result = await limiter.check(request);

      expect(result.remaining).toBe(0);
    });
  });

  describe('check', () => {
    it('should allow requests under the limit', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 5 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'test-user-check-1' },
      });

      for (let i = 0; i < 5; i++) {
        const result = await limiter.check(request);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it('should block requests over the limit', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 3 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'test-user-check-2' },
      });

      // Use up all tokens
      for (let i = 0; i < 3; i++) {
        await limiter.check(request);
      }

      // Fourth request should fail
      const result = await limiter.check(request);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return correct reset time', async () => {
      const limiter = new RateLimiter({
        uniqueTokenPerInterval: 1,
        interval: 60000,
      });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'test-user-check-3' },
      });

      const beforeCheck = Date.now();
      const result = await limiter.check(request);
      const afterCheck = Date.now();

      expect(result.reset).toBeGreaterThanOrEqual(beforeCheck + 60000);
      expect(result.reset).toBeLessThanOrEqual(afterCheck + 60000);
    });

    it('should reset count after interval expires', async () => {
      // Create limiter with very short interval for testing
      const limiter = new RateLimiter({
        uniqueTokenPerInterval: 1,
        interval: 10, // 10ms interval
      });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'test-user-reset' },
      });

      // First request
      const result1 = await limiter.check(request);
      expect(result1.success).toBe(true);

      // Second request immediately - should fail
      const result2 = await limiter.check(request);
      expect(result2.success).toBe(false);

      // Wait for interval to expire
      await new Promise((resolve) => setTimeout(resolve, 20));

      // Third request after interval - should succeed
      const result3 = await limiter.check(request);
      expect(result3.success).toBe(true);
    });
  });

  describe('rateLimitConfigs', () => {
    it('should have auth config with strict limits', async () => {
      expect(rateLimitConfigs.auth).toBeInstanceOf(RateLimiter);

      const request = new NextRequest('http://localhost:3000/api/auth', {
        headers: { 'x-user-id': 'auth-test-user' },
      });
      const result = await rateLimitConfigs.auth.check(request);

      expect(result.limit).toBe(5); // 5 requests per minute
    });

    it('should have publicApi config with moderate limits', async () => {
      expect(rateLimitConfigs.publicApi).toBeInstanceOf(RateLimiter);

      const request = new NextRequest('http://localhost:3000/api/public', {
        headers: { 'x-user-id': 'public-test-user' },
      });
      const result = await rateLimitConfigs.publicApi.check(request);

      expect(result.limit).toBe(30); // 30 requests per minute
    });

    it('should have api config with standard limits', async () => {
      expect(rateLimitConfigs.api).toBeInstanceOf(RateLimiter);

      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'api-test-user' },
      });
      const result = await rateLimitConfigs.api.check(request);

      expect(result.limit).toBe(100); // 100 requests per minute
    });

    it('should have upload config with strict limits', async () => {
      expect(rateLimitConfigs.upload).toBeInstanceOf(RateLimiter);

      const request = new NextRequest('http://localhost:3000/api/upload', {
        headers: { 'x-user-id': 'upload-test-user' },
      });
      const result = await rateLimitConfigs.upload.check(request);

      expect(result.limit).toBe(10); // 10 uploads per 5 minutes
    });

    it('should have sensitive config with very strict limits', async () => {
      expect(rateLimitConfigs.sensitive).toBeInstanceOf(RateLimiter);

      const request = new NextRequest('http://localhost:3000/api/sensitive', {
        headers: { 'x-user-id': 'sensitive-test-user' },
      });
      const result = await rateLimitConfigs.sensitive.check(request);

      expect(result.limit).toBe(3); // 3 requests per 5 minutes
    });
  });

  describe('withRateLimit', () => {
    it('should return null when under limit', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 10 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'with-rate-limit-user-1' },
      });

      const result = await withRateLimit(request, limiter);

      expect(result).toBeNull();
    });

    it('should return 429 response when over limit', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 1 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'with-rate-limit-user-2' },
      });

      // First request
      await withRateLimit(request, limiter);

      // Second request should be rate limited
      const result = await withRateLimit(request, limiter);

      expect(result).toBeInstanceOf(NextResponse);
      expect(result?.status).toBe(429);

      const body = await result?.json();
      expect(body.error).toBe('Too Many Requests');
      expect(body.message).toContain('Rate limit exceeded');
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it('should include rate limit headers in 429 response', async () => {
      const limiter = new RateLimiter({ uniqueTokenPerInterval: 1 });
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'with-rate-limit-user-3' },
      });

      // Use up the limit
      await withRateLimit(request, limiter);
      const result = await withRateLimit(request, limiter);

      expect(result?.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(result?.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(result?.headers.get('X-RateLimit-Reset')).toBeTruthy();
      expect(result?.headers.get('Retry-After')).toBeTruthy();
      expect(result?.headers.get('Content-Type')).toBe('application/json');
    });

    it('should use default api limiter when no limiter provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-user-id': 'with-rate-limit-default-user' },
      });

      const result = await withRateLimit(request);

      expect(result).toBeNull(); // Default is 100 requests, so first should pass
    });
  });

  describe('addRateLimitHeaders', () => {
    it('should add X-RateLimit-Limit header', () => {
      const response = new NextResponse('OK');
      const result = { limit: 100, remaining: 50, reset: Date.now() + 60000 };

      addRateLimitHeaders(response, result);

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    });

    it('should add X-RateLimit-Remaining header', () => {
      const response = new NextResponse('OK');
      const result = { limit: 100, remaining: 50, reset: Date.now() + 60000 };

      addRateLimitHeaders(response, result);

      expect(response.headers.get('X-RateLimit-Remaining')).toBe('50');
    });

    it('should add X-RateLimit-Reset header as ISO string', () => {
      const response = new NextResponse('OK');
      const resetTime = Date.now() + 60000;
      const result = { limit: 100, remaining: 50, reset: resetTime };

      addRateLimitHeaders(response, result);

      const resetHeader = response.headers.get('X-RateLimit-Reset');
      expect(resetHeader).toBe(new Date(resetTime).toISOString());
    });

    it('should return the modified response', () => {
      const response = new NextResponse('OK');
      const result = { limit: 100, remaining: 50, reset: Date.now() + 60000 };

      const returnedResponse = addRateLimitHeaders(response, result);

      expect(returnedResponse).toBe(response);
    });
  });
});
