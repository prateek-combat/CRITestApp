'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LegacyRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const checkAndRedirect = async () => {
      try {
        // First, check if it's an invitation ID
        const invitationRes = await fetchWithCSRF(`/api/invitations/${id}`);
        if (invitationRes.ok) {
          // It's an invitation, redirect to the test page
          router.replace(`/test/${id}`);
          return;
        }

        // Next, check if it's a public test link token
        const publicTestRes = await fetchWithCSRF(`/api/public-test/${id}`);
        if (publicTestRes.ok) {
          // It's a public test link, redirect to the public test page
          router.replace(`/public-test/${id}`);
          return;
        }

        // If neither, show error
        setError('Invalid or expired link');
      } catch (err) {
        console.error('Error checking link:', err);
        setError('Error checking link');
      } finally {
        setLoading(false);
      }
    };

    checkAndRedirect();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-600"></div>
          <p className="mt-4 text-gray-600">Checking link...</p>
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
            Invalid Link
          </h1>
          <p className="mb-6 text-gray-600">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact the test administrator for a valid link.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
