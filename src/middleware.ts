import { NextRequest, NextResponse } from 'next/server';
// import { auth } from '@/lib/auth';

export default async function middleware(req: NextRequest) {
  // Middleware temporarily disabled due to Edge Runtime compatibility issues with NextAuth v4
  // Auth protection is handled at the page level instead
  return NextResponse.next();
}

export const config = {
  matcher: [], // Disabled - auth protection handled at page level
};
