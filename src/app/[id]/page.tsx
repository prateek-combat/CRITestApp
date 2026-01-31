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

  const BackgroundShell = ({ children }: { children: React.ReactNode }) => (
    <div className="relative flex min-h-screen items-center justify-center bg-parchment p-4 text-ink">
      <div className="pointer-events-none absolute inset-0">
        <div className="bg-archive-wash absolute inset-0" />
        <div className="bg-archive-grid absolute inset-0 opacity-40" />
        <div className="noise-overlay absolute inset-0 opacity-20 mix-blend-multiply" />
      </div>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );

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
      <BackgroundShell>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink/60"></div>
          <p className="mt-4 text-ink/60">Checking link...</p>
        </div>
      </BackgroundShell>
    );
  }

  if (error) {
    return (
      <BackgroundShell>
        <div className="w-full rounded-lg border border-ink/10 bg-parchment/80 p-8 text-center shadow-lg">
          <div className="mb-4 text-6xl text-red-500">❌</div>
          <h1 className="mb-2 text-2xl font-bold text-ink">Invalid Link</h1>
          <p className="mb-6 text-ink/60">{error}</p>
          <p className="text-sm text-ink/50">
            Please contact the test administrator for a valid link.
          </p>
        </div>
      </BackgroundShell>
    );
  }

  return null;
}
