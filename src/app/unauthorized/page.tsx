'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = '/login';
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-parchment text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-archive-wash absolute inset-0" />
        <div className="bg-archive-grid absolute inset-0 opacity-40" />
        <div className="noise-overlay absolute inset-0 opacity-20 mix-blend-multiply" />
      </div>
      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        <div>
          <div className="mx-auto h-12 w-12 text-red-600">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-ink">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-ink/60">
            You don&apos;t have permission to access the admin area.
          </p>
          {session && (
            <p className="mt-2 text-xs text-ink/50">
              Signed in as: {session.user.email} ({session.user.role})
            </p>
          )}
        </div>

        <div className="space-y-4">
          <button
            onClick={handleSignOut}
            className="group relative flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign Out
          </button>

          <Link
            href="/"
            className="group relative flex w-full justify-center rounded-md border border-ink/20 bg-parchment/80 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-parchment focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-2"
          >
            Go to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}
