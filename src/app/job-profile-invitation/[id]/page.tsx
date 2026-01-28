'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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

interface JobProfileInvitation {
  id: string;
  candidateEmail: string;
  candidateName: string;
  status: string;
  expiresAt: string;
  jobProfile: {
    id: string;
    name: string;
    description: string;
    positions: Array<{
      id: string;
      name: string;
      department: string;
    }>;
    tests: Array<{
      id: string;
      title: string;
      description: string;
      weight: number;
    }>;
  };
}

export default function JobProfileInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.id as string;

  const [invitation, setInvitation] = useState<JobProfileInvitation | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    if (invitationId) {
      fetchInvitation();
    }
  }, [invitationId]);

  const fetchInvitation = async () => {
    try {
      const response = await fetchWithCSRF(
        `/api/job-profile-invitations/${invitationId}`
      );

      if (response.ok) {
        const data = await response.json();
        setInvitation(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load invitation');
      }
    } catch (error) {
      console.error('Error fetching invitation:', error);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    if (!invitation) return;

    setStarting(true);
    setError('');
    setIsMaintenance(false);

    try {
      const response = await fetchWithCSRF('/api/test-attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobProfileInvitationId: invitation.id,
          type: 'job-profile',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/test/attempt/${data.id}?type=job_profile`);
      } else {
        let errorMessage = 'Failed to start assessment';
        let maintenanceMode = false;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          maintenanceMode = errorData.code === 'MAINTENANCE';
        } catch {}
        setIsMaintenance(maintenanceMode);
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Error starting assessment:', error);
      setIsMaintenance(false);
      setError('Failed to start assessment');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600"></div>
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl text-red-500">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Invitation Error
          </h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact the administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  const isExpired = new Date(invitation.expiresAt) < new Date();

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl text-yellow-500">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Invitation Expired
          </h1>
          <p className="mb-6 text-gray-600">
            This invitation has expired and is no longer valid.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the administrator for a new invitation.
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
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {invitation.jobProfile.name}
          </h1>
          <p className="mb-4 text-gray-600">
            You are invited to complete this assessment
          </p>
          <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">
            <p className="font-semibold">{invitation.candidateName}</p>
            <p className="text-brand-600">{invitation.candidateEmail}</p>
          </div>
        </div>

        {/* Before you begin section */}
        <div className="mb-8 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Before you begin
          </h2>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Shield className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="font-medium text-gray-900">Secure Environment</p>
                <p className="text-sm text-gray-600">
                  Ensure you&apos;re in a quiet, private space with stable
                  internet
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="font-medium text-gray-900">Time Commitment</p>
                <p className="text-sm text-gray-600">
                  Plan for uninterrupted time to complete the assessment
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Monitor className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="font-medium text-gray-900">
                  Technical Requirements
                </p>
                <p className="text-sm text-gray-600">
                  Use a desktop or laptop with a webcam and microphone
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Info className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="font-medium text-gray-900">Assessment Rules</p>
                <p className="text-sm text-gray-600">
                  Complete honestly and follow all instructions provided
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            className={`mb-4 rounded-lg border p-4 ${
              isMaintenance
                ? 'border-amber-200 bg-amber-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <p
              className={`text-sm ${
                isMaintenance ? 'text-amber-700' : 'text-red-700'
              }`}
            >
              {isMaintenance ? 'Under maintenance: ' : ''}
              {error}
            </p>
          </div>
        )}

        <button
          onClick={handleStartAssessment}
          disabled={starting}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? (
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
              Starting Assessment...
            </span>
          ) : (
            'Start Assessment'
          )}
        </button>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Expires: {new Date(invitation.expiresAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
