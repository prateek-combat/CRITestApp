'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button/Button';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        return;
      }

      if (result?.ok) {
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get('callbackUrl') || result?.url;
        window.location.href = callbackUrl || '/admin/dashboard';
        return;
      }

      setError('Unable to sign in with Google');
    } catch {
      setError('Failed to initiate Google sign-in');
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600">
              Access is restricted to pre-registered admin accounts.
            </p>
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              loading={isLoading}
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
