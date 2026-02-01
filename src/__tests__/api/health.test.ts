/**
 * Tests for health check API route
 * @jest-environment node
 */

import { GET, HEAD } from '@/app/api/health/route';

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.status).toBe('ok');
    });

    it('should return 200 status code', async () => {
      const response = await GET();

      expect(response.status).toBe(200);
    });

    it('should return a timestamp', async () => {
      const beforeRequest = new Date().toISOString();
      const response = await GET();
      const body = await response.json();
      const afterRequest = new Date().toISOString();

      expect(body.timestamp).toBeDefined();
      expect(body.timestamp >= beforeRequest).toBe(true);
      expect(body.timestamp <= afterRequest).toBe(true);
    });

    it('should return valid ISO 8601 timestamp', async () => {
      const response = await GET();
      const body = await response.json();

      const parsedDate = new Date(body.timestamp);
      expect(parsedDate.toISOString()).toBe(body.timestamp);
    });

    it('should return JSON content type', async () => {
      const response = await GET();

      expect(response.headers.get('content-type')).toContain(
        'application/json'
      );
    });
  });

  describe('HEAD /api/health', () => {
    it('should return 200 status code', async () => {
      const response = await HEAD();

      expect(response.status).toBe(200);
    });

    it('should return Content-Type header', async () => {
      const response = await HEAD();

      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should return empty body', async () => {
      const response = await HEAD();

      // HEAD requests should have null body
      expect(response.body).toBeNull();
    });
  });
});
