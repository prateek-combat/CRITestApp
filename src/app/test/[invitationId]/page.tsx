'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  Loader2,
} from 'lucide-react';

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
          // This is a public attempt, the invitationId is the attemptId
          const res = await fetch(`/api/public-test-attempts/${invitationId}`);
          if (!res.ok) throw new Error('Public test link not found.');
          const data = await res.json();
          setTestTitle(data.test.title);
          setCandidateName(data.candidateName);
          setCandidateEmail(data.candidateEmail);
          setStatus('ready');
        } else {
          // This is a standard invitation
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
        // For public tests, we already have an attemptId, so we just redirect
        router.push(`/test/attempt/${invitationId}?type=public`);
      } else {
        // For invited tests, we need to create the attempt first
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

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Loading your test...</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-red-700">
              Something went wrong
            </h2>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-500">
              Please try again or contact support if the issue persists.
            </p>
          </div>
        );
      case 'ready':
        return (
          <>
            <CheckCircle className="h-12 w-12 text-green-500" />
            <h1 className="text-2xl font-bold text-gray-800">{testTitle}</h1>
            <div className="text-center">
              <p className="text-gray-600">
                You are invited to take this test.
              </p>
              <p className="mt-2 font-medium text-gray-700">
                {candidateName} ({candidateEmail})
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              <p>
                <strong>Instructions:</strong> Ensure you are in a quiet
                environment with a stable internet connection. Once you start,
                the timer will begin.
              </p>
            </div>
            <button
              onClick={handleStartTest}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-transform hover:scale-105"
            >
              Start Test <ChevronRight className="h-5 w-5" />
            </button>
          </>
        );
      case 'starting':
        return (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-gray-600">Starting your test...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-2xl">
        <div className="flex flex-col items-center gap-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
