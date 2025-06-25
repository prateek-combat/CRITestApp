'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button/Button';
import Link from 'next/link';

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
        setError(`Login failed: ${result.error}`);
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl =
            urlParams.get('callbackUrl') || '/admin/dashboard';
          window.location.href = callbackUrl;
        } else {
          setError('Login succeeded but no session created');
        }
      } else {
        setError('Unexpected login result');
      }
    } catch (error) {
      setError(
        `An error occurred during login: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/admin/dashboard',
      });

      if (result?.error) {
        setError('Google sign-in failed');
      } else if (result?.ok) {
        const session = await getSession();
        if (session) {
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl =
            urlParams.get('callbackUrl') || '/admin/dashboard';
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      setError('Failed to initiate Google sign-in');
    } finally {
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
          const urlParams = new URLSearchParams(window.location.search);
          const callbackUrl =
            urlParams.get('callbackUrl') || '/admin/dashboard';
          window.location.href = callbackUrl;
        }
      }
    } catch (error) {
      setError('An error occurred with local admin login');
    } finally {
      setIsLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-military-green/5 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-orange/5 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo and Title */}
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-6 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="mb-4 inline-flex rounded-2xl bg-gradient-to-br from-military-green to-primary-600 p-3 shadow-xl"
          >
            <Lock className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to access the platform
          </p>
        </motion.div>

        {/* Login Card */}
        <Card variant="default" className="p-6 shadow-xl">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4"
            >
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            </motion.div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm transition-all focus:border-military-green focus:ring-2 focus:ring-military-green/50"
                  placeholder="Enter your email"
                />
              </div>
            </motion.div>

            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-10 text-sm transition-all focus:border-military-green focus:ring-2 focus:ring-military-green/50"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3 transition-opacity hover:opacity-70"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                fullWidth
                size="md"
                variant="primary"
                endIcon={!isLoading && <ArrowRight className="h-4 w-4" />}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="relative my-6"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-500">OR</span>
            </div>
          </motion.div>

          {/* Google Sign In */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              fullWidth
              size="md"
              variant="outline"
              startIcon={
                <svg className="h-4 w-4" viewBox="0 0 24 24">
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
              }
            >
              Continue with Google
            </Button>

            {process.env.NODE_ENV === 'development' && (
              <Button
                onClick={handleLocalAdminLogin}
                disabled={isLoading}
                fullWidth
                size="sm"
                variant="ghost"
                className="text-xs"
                startIcon={<Sparkles className="h-3 w-3" />}
              >
                Local Admin (Dev)
              </Button>
            )}
          </motion.div>
        </Card>

        {/* Back to Home */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-center"
        >
          <Link
            href="/"
            className="text-sm text-gray-600 transition-colors hover:text-military-green"
          >
            ← Back to home
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
