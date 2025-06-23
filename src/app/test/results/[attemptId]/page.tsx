'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TestAttempt {
  id: string;
  candidateName: string;
  candidateEmail: string;
  test: {
    id: string;
    title: string;
    description: string | null;
  };
}

export default function TestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.attemptId as string;

  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestAttempt();
  }, [attemptId]);

  const fetchTestAttempt = async () => {
    try {
      const response = await fetch(`/api/test-attempts/${attemptId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch test attempt');
      }
      const data = await response.json();
      setTestAttempt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-800">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Thank You!</h1>
          <p className="mb-4 text-gray-600">
            Your test has been completed successfully.
          </p>
          {testAttempt && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <h2 className="mb-1 font-semibold text-gray-800">
                {testAttempt.test.title}
              </h2>
              <p className="text-sm text-gray-600">
                Submitted by: {testAttempt.candidateName}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Your responses have been recorded and will be reviewed. You may now
            close this window.
          </p>
        </div>
      </div>
    </div>
  );
}
