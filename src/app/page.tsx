'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md text-center">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Test Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Welcome to the Testing Platform
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                />
              </svg>
              Admin Login
            </Link>

            <button
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center rounded-lg bg-gray-100 px-6 py-3 font-medium text-gray-400"
              title="Coming Soon"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              User Portal
              <span className="ml-2 rounded bg-gray-200 px-2 py-1 text-xs text-gray-500">
                Coming Soon
              </span>
            </button>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500">
              For administrators: Access the admin panel to manage tests,
              invitations, and analytics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
