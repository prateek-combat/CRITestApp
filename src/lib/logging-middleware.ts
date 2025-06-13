import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from './logger';

export interface ApiLogContext {
  userId?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export function withLogging<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  route?: string
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();

    // Extract request information
    const method = request.method;
    const path = route || request.nextUrl.pathname;
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log request
    apiLogger.apiRequest(method, path, {
      ip,
      userAgent,
      query: Object.fromEntries(request.nextUrl.searchParams),
    });

    try {
      // Execute the handler
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      // Log successful response
      apiLogger.apiResponse(method, path, response.status, duration);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      apiLogger.apiError(method, path, error as Error, {
        duration,
        ip,
        userAgent,
      });

      // Re-throw the error
      throw error;
    }
  };
}

// Wrapper for common API patterns
export function loggedApiHandler(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>,
  route?: string
) {
  return withLogging(handler, route);
}

// Database operation logging wrapper
export function withDbLogging<T>(
  operation: () => Promise<T>,
  query: string,
  context?: ApiLogContext
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      apiLogger.dbQuery(query, duration, context);
      resolve(result);
    } catch (error) {
      const duration = Date.now() - startTime;

      apiLogger.dbError(query, error as Error, {
        duration,
        ...context,
      });
      reject(error);
    }
  });
}
