import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export interface RateLimitRule {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
  isExceeded: boolean;
}

export function getClientIdentifier(request: NextRequest): string {
  // Get client IP or use a fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

export function getRateLimitRule(endpoint: string): RateLimitRule {
  // Default rate limit rules
  const rules: Record<string, RateLimitRule> = {
    '/api/uploads': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute
    default: { windowMs: 60000, maxRequests: 60 }, // 60 requests per minute
  };

  return rules[endpoint] || rules.default;
}

export function checkRateLimit(
  clientId: string,
  rule: RateLimitRule
): RateLimitInfo {
  const now = Date.now();
  const key = clientId;

  const existing = requestCounts.get(key);

  // If no existing record or window has expired, start fresh
  if (!existing || now > existing.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + rule.windowMs,
    };
    requestCounts.set(key, newRecord);

    return {
      count: 1,
      resetTime: newRecord.resetTime,
      isExceeded: false,
    };
  }

  // Increment existing count
  existing.count++;
  requestCounts.set(key, existing);

  return {
    count: existing.count,
    resetTime: existing.resetTime,
    isExceeded: existing.count > rule.maxRequests,
  };
}

export function createRateLimitResponse(
  rule: RateLimitRule,
  info: RateLimitInfo
): NextResponse | null {
  if (!info.isExceeded) {
    return null;
  }

  const retryAfter = Math.ceil((info.resetTime - Date.now()) / 1000);

  return new NextResponse(
    JSON.stringify({
      error: 'Rate limit exceeded',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': rule.maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(
          0,
          rule.maxRequests - info.count
        ).toString(),
        'X-RateLimit-Reset': Math.ceil(info.resetTime / 1000).toString(),
      },
    }
  );
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute
