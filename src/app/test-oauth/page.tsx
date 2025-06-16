'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';

export default function TestOAuthPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    setDebugInfo('Starting Google OAuth...');

    try {
      const result = await signIn('google', {
        callbackUrl: '/admin/dashboard',
        redirect: false, // Don't redirect automatically so we can see the result
      });

      setDebugInfo(`OAuth result: ${JSON.stringify(result, null, 2)}`);

      if (result?.error) {
        setError(`OAuth Error: ${result.error}`);
      } else if (result?.ok) {
        setDebugInfo('OAuth successful, redirecting...');
        window.location.href = '/admin/dashboard';
      } else {
        setError('Unknown OAuth result');
      }
    } catch (err) {
      setError(
        `Exception: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectRedirect = () => {
    // Direct redirect approach
    window.location.href =
      '/api/auth/signin/google?callbackUrl=' +
      encodeURIComponent('/admin/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">
          OAuth Debug Test
        </h1>

        <div className="space-y-4">
          <div className="rounded bg-gray-100 p-4">
            <h3 className="font-semibold">Session Status:</h3>
            <p>Status: {status}</p>
            <p>Email: {session?.user?.email || 'Not logged in'}</p>
            <p>Role: {session?.user?.role || 'N/A'}</p>
          </div>

          {debugInfo && (
            <div className="rounded border border-blue-400 bg-blue-100 p-4 text-blue-700">
              <h3 className="font-semibold">Debug Info:</h3>
              <pre className="whitespace-pre-wrap text-sm">{debugInfo}</pre>
            </div>
          )}

          {error && (
            <div className="rounded border border-red-400 bg-red-100 p-4 text-red-700">
              <h3 className="font-semibold">Error:</h3>
              <p>{error}</p>
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Test Google OAuth (No Redirect)'}
          </button>

          <button
            onClick={handleDirectRedirect}
            className="w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
          >
            Test Direct Redirect
          </button>

          <div className="text-center">
            <a href="/login" className="text-blue-500 hover:underline">
              Back to Login Page
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
