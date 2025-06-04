import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Additional middleware logic can go here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to admin routes only if user has admin role
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return (
            !!token && (token.role === 'ADMIN' || token.role === 'SUPER_ADMIN')
          );
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*'],
};
