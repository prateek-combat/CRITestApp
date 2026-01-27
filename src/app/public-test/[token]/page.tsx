'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface PublicTestLink {
  id: string;
  testId: string;
  testTitle: string;
  title: string;
  description: string;
  isActive: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  isTimeRestricted?: boolean;
  timeSlot?: {
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
    timezone: string;
    maxParticipants?: number;
    currentParticipants: number;
    isActive: boolean;
  };
}

export default function PublicTestPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [publicLink, setPublicLink] = useState<PublicTestLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeSlotInfo, setTimeSlotInfo] = useState<any>(null);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPublicLink();
  }, [token]);

  const fetchPublicLink = async () => {
    try {
      const response = await fetchWithCSRF(`/api/public-test/${token}`);

      if (response.ok) {
        const data = await response.json();
        setPublicLink(data);
      } else {
        const error = await response.json();
        setError(error.error || 'Invalid or expired link');
        if (error.timeSlotInfo) {
          setTimeSlotInfo(error.timeSlotInfo);
        }
      }
    } catch (error) {
      console.error('Error fetching public link:', error);
      setError('Failed to load test link');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Please provide both name and email');
      return;
    }

    if (!candidateEmail.includes('@')) {
      setError('Please provide a valid email address');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetchWithCSRF(`/api/public-test/${token}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateName: candidateName.trim(),
          candidateEmail: candidateEmail.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to the test page with public attempt indicator
        router.push(`/test/attempt/${data.attemptId}?type=public`);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError('Failed to start test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600"></div>
          <p className="mt-4 text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isTimeSlotError =
      error.includes('Time slot') || error.includes('time slot');
    const errorIcon = isTimeSlotError ? '⏰' : '❌';
    const errorColor = isTimeSlotError ? 'text-amber-500' : 'text-red-500';

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className={`mb-4 text-6xl ${errorColor}`}>{errorIcon}</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {isTimeSlotError ? 'Time Slot Restriction' : 'Access Denied'}
          </h1>
          <p className="mb-4 text-gray-600">{error}</p>

          {timeSlotInfo && (
            <div className="mb-6 rounded-lg bg-amber-50 p-4 text-left">
              <h3 className="mb-2 font-semibold text-amber-900">
                {timeSlotInfo.name}
              </h3>
              <p className="text-sm text-amber-700">{timeSlotInfo.message}</p>
              {timeSlotInfo.maxParticipants && (
                <p className="mt-2 text-xs text-amber-600">
                  Participants: {timeSlotInfo.currentParticipants}/
                  {timeSlotInfo.maxParticipants}
                </p>
              )}
            </div>
          )}

          <p className="text-sm text-gray-500">
            Please contact the test administrator if you believe this is an
            error.
          </p>
        </div>
      </div>
    );
  }

  if (!publicLink) {
    return null;
  }

  const isExpired =
    publicLink.expiresAt && new Date(publicLink.expiresAt) < new Date();
  const isMaxUsesReached =
    publicLink.maxUses && publicLink.usedCount >= publicLink.maxUses;

  if (!publicLink.isActive || isExpired || isMaxUsesReached) {
    let errorMessage = 'This test link is no longer available.';
    if (isExpired) errorMessage = 'This test link has expired.';
    if (isMaxUsesReached)
      errorMessage = 'This test link has reached its maximum usage limit.';

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl text-yellow-500">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Link Unavailable
          </h1>
          <p className="mb-6 text-gray-600">{errorMessage}</p>
          <p className="text-sm text-gray-500">
            Please contact the test administrator for a new link.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mb-4 text-6xl text-brand-600">📝</div>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            {publicLink.testTitle}
          </h1>

          {publicLink.isTimeRestricted && publicLink.timeSlot && (
            <div className="mb-4 rounded-md bg-amber-100 p-3 text-amber-800">
              <p className="font-medium">
                ⏰ Time Slot: {publicLink.timeSlot.name}
              </p>
              <p className="text-xs">
                Available:{' '}
                {new Date(publicLink.timeSlot.startDateTime).toLocaleString()} -{' '}
                {new Date(publicLink.timeSlot.endDateTime).toLocaleString()} (
                {publicLink.timeSlot.timezone})
              </p>
              {publicLink.timeSlot.maxParticipants && (
                <p className="text-xs">
                  Participants: {publicLink.timeSlot.currentParticipants}/
                  {publicLink.timeSlot.maxParticipants}
                </p>
              )}
            </div>
          )}

          {(publicLink.expiresAt || publicLink.maxUses) && (
            <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {publicLink.expiresAt && (
                <p>
                  Expires: {new Date(publicLink.expiresAt).toLocaleDateString()}
                </p>
              )}
              {publicLink.maxUses && (
                <p>
                  Uses: {publicLink.usedCount} / {publicLink.maxUses}
                </p>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleStartTest} className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={candidateEmail}
              onChange={(e) => setCandidateEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
              placeholder="Enter your email address"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting || !candidateName.trim() || !candidateEmail.trim()
            }
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting Test...
              </span>
            ) : (
              'Start Test'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            By starting this test, you agree to follow all instructions and
            complete it honestly.
          </p>
        </div>
      </div>
    </div>
  );
}
