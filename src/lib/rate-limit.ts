import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiter for development
// In production, use Redis or Upstash for distributed rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000);
}

export interface RateLimitConfig {
  uniqueTokenPerInterval?: number;
  interval?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  uniqueTokenPerInterval: 100, // 100 requests
  interval: 60000, // per minute
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config?: RateLimitConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<RateLimitConfig>;
  }

  private getKey(identifier: string): string {
    return `rate-limit:${identifier}`;
  }

  private getIdentifier(req: NextRequest): string {
    // Try to get IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // For authenticated requests, use user ID if available
    const userId = req.headers.get('x-user-id');
    if (userId) {
      return `user:${userId}`;
    }

    return `ip:${ip}`;
  }

  async check(req: NextRequest): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const identifier = this.getIdentifier(req);
    const key = this.getKey(identifier);
    const now = Date.now();
    const resetTime = now + this.config.interval;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: resetTime,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    const remaining = Math.max(
      0,
      this.config.uniqueTokenPerInterval - entry.count
    );
    const success = entry.count <= this.config.uniqueTokenPerInterval;

    return {
      success,
      limit: this.config.uniqueTokenPerInterval,
      remaining,
      reset: entry.resetTime,
    };
  }
}

// Rate limit configurations for different endpoints
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: new RateLimiter({
    uniqueTokenPerInterval: 5,
    interval: 60000, // 5 requests per minute
  }),

  // Moderate limits for public API endpoints
  publicApi: new RateLimiter({
    uniqueTokenPerInterval: 30,
    interval: 60000, // 30 requests per minute
  }),

  // Standard limits for authenticated API endpoints
  api: new RateLimiter({
    uniqueTokenPerInterval: 100,
    interval: 60000, // 100 requests per minute
  }),

  // Strict limits for file uploads
  upload: new RateLimiter({
    uniqueTokenPerInterval: 10,
    interval: 300000, // 10 uploads per 5 minutes
  }),

  // Very strict limits for sensitive operations
  sensitive: new RateLimiter({
    uniqueTokenPerInterval: 3,
    interval: 300000, // 3 requests per 5 minutes
  }),
};

// Middleware function to apply rate limiting
export async function withRateLimit(
  req: NextRequest,
  limiter: RateLimiter = rateLimitConfigs.api
): Promise<NextResponse | null> {
  const result = await limiter.check(req);

  const headers = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };

  if (!result.success) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(
            (result.reset - Date.now()) / 1000
          ).toString(),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Return null to indicate the request can proceed
  // The calling function should add these headers to the response
  return null;
}

// Helper to add rate limit headers to a response
export function addRateLimitHeaders(
  response: NextResponse,
  result: { limit: number; remaining: number; reset: number }
): NextResponse {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set(
    'X-RateLimit-Reset',
    new Date(result.reset).toISOString()
  );
  return response;
}
