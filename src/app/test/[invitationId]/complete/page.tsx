'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function TestCompletePage() {
  const searchParams = useSearchParams();
  const [candidateName, setCandidateName] = useState<string>('');
  const [testTitle, setTestTitle] = useState<string>('Combat Test');
  const [loading, setLoading] = useState(true);
  const invitationId = searchParams.get('invitationId');

  useEffect(() => {
    const fetchBasicInfo = async () => {
      try {
        // Only fetch basic info for personalization, no scores
        const response = await fetch(
          `/api/test-attempts?invitationId=${invitationId}`
        );
        if (response.ok) {
          const data = await response.json();
          const latestAttempt = Array.isArray(data) ? data[0] : data;

          if (latestAttempt) {
            setCandidateName(latestAttempt.candidateName || '');
            setTestTitle(latestAttempt.test?.title || 'Combat Test');
          }
        }
      } catch (err) {
        // Silently handle errors - we'll just show generic thank you
        console.log('Could not fetch test info for personalization');
      } finally {
        setLoading(false);
      }
    };

    if (invitationId) {
      fetchBasicInfo();
    } else {
      setLoading(false);
    }
  }, [invitationId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-500 border-t-transparent"></div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Finalizing Your Submission...
          </h2>
          <p className="text-gray-600">Just a moment!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Main Thank You Card */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          {/* Header with Success Icon */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white bg-opacity-20">
              <svg
                className="h-10 w-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">
              Thank You!
            </h1>
            <p className="text-lg text-brand-100">
              Your test has been completed successfully
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="mb-8 text-center">
              <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                {candidateName
                  ? `Thank you, ${candidateName}!`
                  : 'Thank you for your participation!'}
              </h2>
              <p className="mb-6 text-lg leading-relaxed text-gray-600">
                You have successfully completed the{' '}
                <span className="font-medium text-brand-600">{testTitle}</span>.
                Your responses have been recorded and will be reviewed by our
                team.
              </p>

              <div className="mb-8 rounded-lg border border-brand-200 bg-brand-50 p-6">
                <div className="flex items-start">
                  <div className="mr-3 mt-0.5 h-6 w-6 text-brand-600">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="mb-1 font-medium text-brand-800">
                      What happens next?
                    </h3>
                    <p className="text-sm text-brand-700">
                      Our team will review your submission and may contact you
                      regarding next steps. Thank you for taking the time to
                      complete this assessment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <Link
                href="/"
                className="inline-flex transform items-center rounded-lg bg-brand-500 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-brand-600"
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Return to Homepage
              </Link>

              <p className="mt-4 text-sm text-gray-500">
                If you have any questions, please contact the administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
