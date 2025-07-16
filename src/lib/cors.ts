import { NextRequest, NextResponse } from 'next/server';

// Define allowed origins based on environment
const getAllowedOrigins = () => {
  const origins = [process.env.NEXTAUTH_URL || 'http://localhost:3000'];

  // Add production URLs
  if (process.env.VERCEL_URL) {
    origins.push(`https://${process.env.VERCEL_URL}`);
  }

  // Add custom allowed origins from environment
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(
      ...process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    );
  }

  return origins;
};

export interface CorsOptions {
  origin?:
    | boolean
    | string
    | string[]
    | ((origin: string | undefined) => boolean | string);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CorsOptions = {
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: [],
  credentials: true,
  maxAge: 86400, // 24 hours
};

export function cors(options: CorsOptions = {}) {
  const opts = { ...defaultOptions, ...options };
  const allowedOrigins = getAllowedOrigins();

  return async function corsMiddleware(req: NextRequest) {
    const origin = req.headers.get('origin');
    const response = NextResponse.next();

    // Check if origin is allowed
    let isAllowed = false;
    let allowedOrigin = '';

    if (opts.origin === true) {
      // Allow any origin
      isAllowed = true;
      allowedOrigin = origin || '*';
    } else if (typeof opts.origin === 'string') {
      // Allow specific origin
      isAllowed = origin === opts.origin;
      allowedOrigin = opts.origin;
    } else if (Array.isArray(opts.origin)) {
      // Allow origins from array
      isAllowed = origin ? opts.origin.includes(origin) : false;
      allowedOrigin = origin || '';
    } else if (typeof opts.origin === 'function') {
      // Custom origin validation
      const result = opts.origin(origin);
      isAllowed = !!result;
      allowedOrigin = typeof result === 'string' ? result : origin || '';
    } else {
      // Default: use environment-based origins
      isAllowed = origin ? allowedOrigins.includes(origin) : false;
      allowedOrigin = origin || '';
    }

    // Set CORS headers if origin is allowed
    if (isAllowed && allowedOrigin) {
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      response.headers.set(
        'Access-Control-Allow-Methods',
        opts.methods!.join(', ')
      );
      response.headers.set(
        'Access-Control-Allow-Headers',
        opts.allowedHeaders!.join(', ')
      );

      if (opts.exposedHeaders && opts.exposedHeaders.length > 0) {
        response.headers.set(
          'Access-Control-Expose-Headers',
          opts.exposedHeaders.join(', ')
        );
      }

      if (opts.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
      }

      if (opts.maxAge) {
        response.headers.set('Access-Control-Max-Age', opts.maxAge.toString());
      }

      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Set credentials header for non-preflight requests
    if (opts.credentials && isAllowed) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
  };
}

// Helper function to apply CORS to API route handlers
export function withCors(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  options?: CorsOptions
) {
  const corsMiddleware = cors(options);

  return async function corsHandler(req: NextRequest) {
    const corsResponse = await corsMiddleware(req);

    // If it's a preflight request, return the CORS response
    if (req.method === 'OPTIONS') {
      return corsResponse;
    }

    // Otherwise, run the handler
    const response = await handler(req);

    // Copy CORS headers to the handler response
    corsResponse.headers.forEach((value, key) => {
      if (key.startsWith('Access-Control-')) {
        response.headers.set(key, value);
      }
    });

    return response;
  };
}
