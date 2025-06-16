'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';

import { debugLogin, debugError } from '@/app/api/debug-utils';

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

    debugLogin('🚀 LOGIN FORM SUBMIT START', {
      email,
      hasPassword: !!password,
      passwordLength: password.length,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    try {
      debugLogin('📞 CALLING SIGNIN WITH CREDENTIALS');
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      debugLogin('📋 SIGNIN RESULT', {
        ok: result?.ok,
        error: result?.error,
        status: result?.status,
        url: result?.url,
        hasResult: !!result,
      });

      if (result?.error) {
        const errorMsg = `Login failed: ${result.error}`;
        debugLogin('❌ SIGNIN ERROR', {
          error: result.error,
          status: result.status,
        });
        setError(errorMsg);
      } else if (result?.ok) {
        debugLogin('✅ SIGNIN SUCCESS, CHECKING SESSION');
        // Check if login was successful
        const session = await getSession();

        debugLogin('📋 SESSION CHECK RESULT', {
          hasSession: !!session,
          userEmail: session?.user?.email,
          userId: session?.user?.id,
          userRole: session?.user?.role,
          expires: session?.expires,
        });

        if (session) {
          debugLogin('🎯 REDIRECTING TO DASHBOARD');
          router.push('/admin/dashboard');
          router.refresh();
        } else {
          const errorMsg = 'Login succeeded but no session created';
          debugLogin('❌ NO SESSION AFTER SUCCESSFUL LOGIN');
          setError(errorMsg);
        }
      } else {
        const errorMsg = 'Unexpected login result';
        debugLogin('❓ UNEXPECTED SIGNIN RESULT', result);
        setError(errorMsg);
      }
    } catch (error) {
      const errorMsg = `An error occurred during login: ${error instanceof Error ? error.message : 'Unknown error'}`;
      debugLogin('💥 LOGIN EXCEPTION', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      debugLogin('🏁 LOGIN FORM SUBMIT END');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    debugLogin('🔍 GOOGLE SIGNIN START', {
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });

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

      debugLogin('🔗 GOOGLE OAUTH URL CONSTRUCTED', {
        url: googleAuthUrl.toString(),
        clientId: googleClientId,
        callbackUrl,
      });

      // Direct redirect to Google OAuth
      debugLogin('🚀 REDIRECTING TO GOOGLE OAUTH');
      window.location.href = googleAuthUrl.toString();
    } catch (error) {
      const errorMsg = 'Failed to redirect to Google OAuth';
      debugLogin('💥 GOOGLE SIGNIN ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError(errorMsg);
      setIsLoading(false);
    }
  };

  const handleLocalAdminLogin = async () => {
    setIsLoading(true);
    setError('');

    debugLogin('🏠 LOCAL ADMIN LOGIN START');

    try {
      const result = await signIn('credentials', {
        email: 'local-admin',
        password: 'local-admin',
        redirect: false,
      });

      debugLogin('🏠 LOCAL ADMIN SIGNIN RESULT', {
        ok: result?.ok,
        error: result?.error,
      });

      if (result?.error) {
        debugLogin('❌ LOCAL ADMIN LOGIN FAILED', { error: result.error });
        setError('Local admin login failed');
      } else {
        const session = await getSession();
        debugLogin('🏠 LOCAL ADMIN SESSION CHECK', {
          hasSession: !!session,
          userEmail: session?.user?.email,
        });

        if (session) {
          router.push('/admin/dashboard');
          router.refresh();
        }
      }
    } catch (error) {
      debugLogin('💥 LOCAL ADMIN LOGIN ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError('An error occurred with local admin login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectTest = async () => {
    setIsLoading(true);
    setError('');

    debugLogin('🧪 DIRECT TEST START', { email, hasPassword: !!password });

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

      debugLogin('🧪 DIRECT TEST RESPONSE', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      const result = await response.json();

      debugLogin('🧪 DIRECT TEST RESULT', result);

      if (result.success) {
        setError(
          `✅ Direct test successful! User: ${result.user.email}, Role: ${result.user.role}`
        );
      } else {
        setError(`❌ Direct test failed: ${result.error}`);
      }
    } catch (error) {
      debugLogin('💥 DIRECT TEST ERROR', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      setError(
        `Direct test error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Lock className="h-8 w-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-gray-600">
            Sign in to access the admin panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                placeholder="admin@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 transition-colors focus:border-transparent focus:ring-2 focus:ring-primary-500"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-primary-600 px-4 py-3 font-medium text-white transition-colors hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:bg-primary-400"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
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
              Sign in with Google
            </button>

            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={handleLocalAdminLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                <Lock className="mr-2 h-5 w-5" />
                Local Admin Login (Dev Only)
              </button>
            )}

            <button
              onClick={handleDirectTest}
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 shadow-sm transition-colors hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
            >
              🧪 Test Credentials (Debug)
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center">
          <p className="text-xs text-gray-500">
            Test Platform Admin Panel • Secure Access Required
          </p>
        </div>
      </div>
    </div>
  );
}
