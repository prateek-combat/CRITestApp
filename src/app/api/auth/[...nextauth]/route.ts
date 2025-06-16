import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

import { debugNextAuth } from '@/app/api/debug-utils';

const handler = NextAuth(authOptions);

// Wrap the handler to add debug logging
const debugHandler = async (req: Request, context: any) => {
  const url = new URL(req.url);
  const method = req.method;
  const pathname = url.pathname;

  debugNextAuth('🌐 NEXTAUTH REQUEST', {
    method,
    pathname,
    searchParams: Object.fromEntries(url.searchParams.entries()),
    timestamp: new Date().toISOString(),
    userAgent: req.headers.get('user-agent'),
    origin: req.headers.get('origin'),
    referer: req.headers.get('referer'),
    hasCookies: !!req.headers.get('cookie'),
  });

  try {
    const response = await handler(req, context);

    debugNextAuth('✅ NEXTAUTH RESPONSE', {
      status: response.status,
      statusText: response.statusText,
      hasSetCookie: !!response.headers.get('set-cookie'),
      location: response.headers.get('location'),
      contentType: response.headers.get('content-type'),
    });

    return response;
  } catch (error) {
    debugNextAuth('💥 NEXTAUTH ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export { debugHandler as GET, debugHandler as POST };
