'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

// Debug utilities removed for production

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMsg = `Login failed: ${result.error}`;
        setError(errorMsg);
      } else if (result?.ok) {
        // Check if login was successful
        const session = await getSession();

        if (session) {
          // Get the callback URL from the URL parameters or default to dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl =
            urlParams.get('callbackUrl') || '/admin/dashboard';

          // Use window.location for more reliable redirect
          window.location.href = callbackUrl;
        } else {
          const errorMsg = 'Login succeeded but no session created';
          setError(errorMsg);
        }
      } else {
        const errorMsg = 'Unexpected login result';
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `An error occurred during login: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Bypass NextAuth and go directly to Google OAuth
      const googleClientId =
        '659780694762-shvlosoelr4ofbb7bu4it5km04laqs25.apps.googleusercontent.com';
      const callbackUrl =
        'https://cri-test-app.vercel.app/api/auth/callback/google';
      const state = encodeURIComponent('/admin/dashboard'); // Store the redirect URL in state

      const googleAuthUrl = new URL(
        'https://accounts.google.com/o/oauth2/v2/auth'
      );
      googleAuthUrl.searchParams.set('client_id', googleClientId);
      googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('state', state);
      googleAuthUrl.searchParams.set('prompt', 'consent');
      googleAuthUrl.searchParams.set('access_type', 'offline');

      // Direct redirect to Google OAuth
      window.location.href = googleAuthUrl.toString();
    } catch (error) {
      const errorMsg = 'Failed to redirect to Google OAuth';
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleLocalAdminLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: 'local-admin',
        password: 'local-admin',
        redirect: false,
      });

      if (result?.error) {
        setError('Local admin login failed');
      } else {
        const session = await getSession();

        if (session) {
          // Get the callback URL from the URL parameters or default to dashboard
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl =
            urlParams.get('callbackUrl') || '/admin/dashboard';

          // Use window.location for more reliable redirect
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      setError('An error occurred with local admin login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectTest = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          debugKey: 'debug-oauth-2024',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setError(`Direct test successful: ${JSON.stringify(data, null, 2)}`);
      } else {
        setError(`Direct test failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setError('Direct test request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600">
            <Lock className="h-6 w-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access the test platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm placeholder-gray-500 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">Or</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {process.env.NODE_ENV === 'development' && (
                <>
                  <button
                    type="button"
                    onClick={handleLocalAdminLogin}
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-800 shadow-sm hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Local Admin Login (Dev Only)
                  </button>

                  <button
                    type="button"
                    onClick={handleDirectTest}
                    disabled={isLoading || !email || !password}
                    className="flex w-full justify-center rounded-md border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Direct API Test (Dev Only)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
