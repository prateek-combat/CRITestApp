'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
  Shield,
  Clock,
  Monitor,
  Info,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/button/Button';

export default function TestStartPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const invitationId = params.invitationId as string;
  const isPublicAttempt = searchParams.get('type') === 'public';

  const [status, setStatus] = useState('loading');
  const [error, setError] = useState<string | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');

  useEffect(() => {
    const initialize = async () => {
      setStatus('loading');
      try {
        if (isPublicAttempt) {
          const res = await fetch(`/api/public-test-attempts/${invitationId}`);
          if (!res.ok) throw new Error('Public test link not found.');
          const data = await res.json();
          setTestTitle(data.test.title);
          setCandidateName(data.candidateName);
          setCandidateEmail(data.candidateEmail);
          setStatus('ready');
        } else {
          const res = await fetch(`/api/invitations/${invitationId}`);
          if (!res.ok) throw new Error('Invitation not found.');
          const data = await res.json();
          setTestTitle(data.test.title);
          setCandidateName(data.candidateName || '');
          setCandidateEmail(data.candidateEmail || '');
          setStatus('ready');
        }
      } catch (err: any) {
        setError(err.message);
        setStatus('error');
      }
    };
    initialize();
  }, [invitationId, isPublicAttempt]);

  const handleStartTest = async () => {
    setStatus('starting');
    try {
      if (isPublicAttempt) {
        router.push(`/test/attempt/${invitationId}?type=public`);
      } else {
        const response = await fetch('/api/test-attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invitationId }),
        });
        if (!response.ok) {
          throw new Error('Failed to start the test. Please try again.');
        }
        const attempt = await response.json();
        router.push(`/test/attempt/${attempt.id}`);
      }
    } catch (err: any) {
      setError(err.message);
      setStatus('error');
    }
  };

  const instructions = [
    { icon: Monitor, text: 'Ensure stable internet connection' },
    { icon: Clock, text: 'Timer starts when you begin' },
    { icon: Shield, text: 'No external help allowed' },
  ];

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-8 w-8 text-military-green" />
            </motion.div>
            <p className="text-sm text-gray-600">Loading your test...</p>
          </motion.div>
        );

      case 'error':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 text-center"
          >
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-red-700">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Try Again
            </Button>
          </motion.div>
        );

      case 'ready':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full space-y-4"
          >
            {/* Header */}
            <div className="space-y-2 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="mb-2 inline-flex rounded-full bg-gradient-to-br from-military-green/10 to-accent-orange/10 p-3"
              >
                <CheckCircle className="h-8 w-8 text-military-green" />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900">{testTitle}</h1>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  You are invited to take this test
                </p>
                <p className="font-medium text-gray-800">{candidateName}</p>
                <p className="text-sm text-gray-500">{candidateEmail}</p>
              </div>
            </div>

            {/* Instructions Card */}
            <Card variant="glass" className="p-4">
              <div className="mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-military-green" />
                <h3 className="font-semibold text-gray-900">
                  Before you begin
                </h3>
              </div>
              <div className="space-y-2">
                {instructions.map((instruction, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <instruction.icon className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{instruction.text}</span>
                  </motion.div>
                ))}
              </div>
            </Card>

            {/* Start Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleStartTest}
                size="lg"
                variant="primary"
                fullWidth
                endIcon={<ChevronRight className="h-5 w-5" />}
                className="shadow-lg"
              >
                Start Test
              </Button>
            </motion.div>
          </motion.div>
        );

      case 'starting':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 className="h-8 w-8 text-military-green" />
            </motion.div>
            <p className="text-sm text-gray-600">Starting your test...</p>
          </motion.div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
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

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card variant="default" className="p-6 shadow-xl">
          {renderContent()}
        </Card>
      </motion.div>
    </div>
  );
}
