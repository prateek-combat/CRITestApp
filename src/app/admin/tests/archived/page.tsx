'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ArchivedTest {
  id: string;
  title: string;
  description: string;
  archivedAt: string;
  archivedBy?: {
    email: string;
    firstName?: string;
    lastName?: string;
  };
  _count: {
    questions: number;
    invitations: number;
    testAttempts: number;
  };
}

export default function ArchivedTestsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [archivedTests, setArchivedTests] = useState<ArchivedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoringTestId, setRestoringTestId] = useState<string | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);

  // Only SUPER_ADMIN can access this page
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN') {
      router.push('/admin/tests');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    if (session?.user.role === 'SUPER_ADMIN') {
      fetchArchivedTests();
    }
  }, [session]);

  const fetchArchivedTests = async () => {
    try {
      const response = await fetchWithCSRF('/api/tests/archived');
      if (response.ok) {
        const data = await response.json();
        setArchivedTests(data);
      } else {
        console.error('Failed to fetch archived tests');
      }
    } catch (error) {
      console.error('Error fetching archived tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreTest = async (testId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to restore this test? It will be moved back to the active tests list.'
      )
    ) {
      return;
    }

    setRestoringTestId(testId);
    try {
      const response = await fetchWithCSRF(`/api/tests/${testId}/restore`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // Remove the restored test from the archived list
        setArchivedTests((prevTests) =>
          prevTests.filter((test) => test.id !== testId)
        );
        alert(
          `✅ ${result.message} - Test "${result.testInfo?.title}" has been restored to active tests.`
        );
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to restore test'}`);
      }
    } catch (error) {
      console.error('Error restoring test:', error);
      alert('❌ Network error occurred while restoring test');
    } finally {
      setRestoringTestId(null);
    }
  };

  const handlePermanentlyDeleteTest = async (testId: string) => {
    if (
      !window.confirm(
        '⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this archived test and ALL associated data including:\n- All questions\n- All invitations\n- All test attempts and results\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to permanently delete this test?'
      )
    ) {
      return;
    }

    // Double confirmation for permanent deletion
    if (
      !window.confirm(
        'FINAL CONFIRMATION:\n\nYou are about to PERMANENTLY DELETE this archived test.\nThis action is IRREVERSIBLE.\n\nClick OK only if you are absolutely certain.'
      )
    ) {
      return;
    }

    setDeletingTestId(testId);
    try {
      const response = await fetchWithCSRF(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        // Remove the deleted test from the archived list
        setArchivedTests((prevTests) =>
          prevTests.filter((test) => test.id !== testId)
        );
        alert(
          `✅ ${result.message}\nDeleted: ${result.deletedTest?.questionsDeleted || 0} questions, ${result.deletedTest?.invitationsDeleted || 0} invitations, ${result.deletedTest?.attemptsDeleted || 0} attempts`
        );
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete test'}`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('❌ Network error occurred while deleting test');
    } finally {
      setDeletingTestId(null);
    }
  };

  // Show access denied for non-super admins
  if (session && session.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment/90">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-ink/60">
            Only Super Admins can view archived tests.
          </p>
          <Link
            href="/admin/tests"
            className="mt-4 inline-block rounded-lg bg-copper/100 px-4 py-2 text-white hover:bg-ink"
          >
            Back to Tests
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment/90">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-copper/50"></div>
      </div>
    );
  }

  const formatArchivedBy = (archivedBy?: ArchivedTest['archivedBy']) => {
    if (!archivedBy) return 'Unknown';
    const name =
      `${archivedBy.firstName || ''} ${archivedBy.lastName || ''}`.trim();
    return name || archivedBy.email;
  };

  const getDaysArchived = (archivedAt: string) => {
    const archived = new Date(archivedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - archived.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen space-y-6 bg-parchment/90 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Archived Tests</h1>
          <p className="text-ink/60">
            View and manage archived tests (Super Admin only)
          </p>
          <p className="mt-1 text-sm text-amber-600">
            ⚠️ Tests are automatically deleted permanently after 30 days of
            being archived
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/tests"
            className="bg-parchment0 rounded-lg px-4 py-2 text-white transition-colors hover:bg-ink/60"
          >
            Back to Active Tests
          </Link>
        </div>
      </div>

      {archivedTests.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-parchment/80 p-12 text-center shadow-md">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-ink/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-3m-13 0h3m-3 0v5a2 2 0 002 2h3.5m8-5V18a2 2 0 01-2 2h-3.5"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-ink">
              No archived tests
            </h3>
            <p className="mt-1 text-sm text-ink/50">
              Tests you archive will appear here and can be restored for up to
              30 days.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-ink/10 bg-parchment/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-ink/10">
              <thead className="bg-parchment">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/50">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/50">
                    Data Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/50">
                    Archived
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink/50">
                    Days Remaining
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10 bg-parchment/80">
                {archivedTests.map((test) => {
                  const daysArchived = getDaysArchived(test.archivedAt);
                  const daysRemaining = Math.max(0, 30 - daysArchived);
                  const isNearDeletion = daysRemaining <= 7;

                  return (
                    <tr
                      key={test.id}
                      className={isNearDeletion ? 'bg-red-50' : ''}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-ink">
                            {test.title}
                            {isNearDeletion && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                ⚠️ Expires Soon
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-ink/50">
                            {test.description || 'No description'}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-ink">
                        <div className="space-y-1">
                          <div>📝 {test._count.questions} questions</div>
                          <div>📧 {test._count.invitations} invitations</div>
                          <div>📊 {test._count.testAttempts} attempts</div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-ink/50">
                        <div>
                          <div>
                            {new Date(test.archivedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            by {formatArchivedBy(test.archivedBy)}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <div
                          className={`font-medium ${isNearDeletion ? 'text-red-600' : 'text-ink'}`}
                        >
                          {daysRemaining} days
                        </div>
                        <div className="text-xs text-ink/50">
                          (archived {daysArchived} days ago)
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => handleRestoreTest(test.id)}
                            disabled={restoringTestId === test.id}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                              restoringTestId === test.id
                                ? 'cursor-not-allowed bg-ink/10 text-ink/50'
                                : 'bg-moss/12 text-moss hover:bg-green-200 hover:text-green-800'
                            }`}
                            title="Restore test to active list"
                          >
                            {restoringTestId === test.id
                              ? 'Restoring...'
                              : 'Restore'}
                          </button>
                          <button
                            onClick={() => handlePermanentlyDeleteTest(test.id)}
                            disabled={deletingTestId === test.id}
                            className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                              deletingTestId === test.id
                                ? 'cursor-not-allowed bg-ink/10 text-ink/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
                            }`}
                            title="⚠️ PERMANENTLY delete test (cannot be undone!)"
                          >
                            {deletingTestId === test.id
                              ? 'Deleting...'
                              : 'Delete Forever'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
