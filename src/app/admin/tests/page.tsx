'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import EmailNotificationSettings from '@/components/EmailNotificationSettings';
import { Mail } from 'lucide-react';

interface Test {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionsCount: number;
  invitationsCount: number;
}

export default function TestsPage() {
  const { data: session } = useSession();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [archivingTestId, setArchivingTestId] = useState<string | null>(null);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const [selectedTestForEmail, setSelectedTestForEmail] = useState<{
    id: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchiveTest = async (testId: string) => {
    if (
      !window.confirm(
        'Are you sure you want to archive this test? This will hide it from the main list but it can be restored later.'
      )
    ) {
      return;
    }

    setArchivingTestId(testId);
    try {
      const response = await fetch(`/api/tests/${testId}/archive`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        // Remove the archived test from the local state
        setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
        alert(
          `✅ ${result.message} - Test "${result.testInfo?.title}" has been archived and can be restored if needed.`
        );
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to archive test'}`);
      }
    } catch (error) {
      console.error('Error archiving test:', error);
      alert('❌ Network error occurred while archiving test');
    } finally {
      setArchivingTestId(null);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (
      !window.confirm(
        '⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this test and ALL associated data including:\n- All questions\n- All invitations\n- All test attempts and results\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to permanently delete this test?\n\n(Consider using "Archive" instead to safely hide the test while keeping data recoverable)'
      )
    ) {
      return;
    }

    // Double confirmation for permanent deletion
    if (
      !window.confirm(
        'FINAL CONFIRMATION:\n\nYou are about to PERMANENTLY DELETE this test.\nThis action is IRREVERSIBLE.\n\nClick OK only if you are absolutely certain.'
      )
    ) {
      return;
    }

    setDeletingTestId(testId);
    try {
      const response = await fetch(`/api/tests/${testId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        // Remove the deleted test from the local state
        setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
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

  const handleEmailSettings = (test: { id: string; title: string }) => {
    setSelectedTestForEmail(test);
    setEmailSettingsOpen(true);
  };

  const handleEmailSettingsClose = () => {
    setEmailSettingsOpen(false);
    setSelectedTestForEmail(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-gray-600">
            Create and manage your assessment tests
          </p>
          {isSuperAdmin && (
            <p className="mt-1 text-sm text-blue-600">
              🛡️ Super Admin: You can archive tests (recoverable) or permanently
              delete them
            </p>
          )}
        </div>
        <div className="flex gap-3">
          {isSuperAdmin && (
            <Link
              href="/admin/tests/archived"
              className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
            >
              View Archived Tests
            </Link>
          )}
          <Link
            href="/admin/tests/new"
            className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
          >
            Create New Test
          </Link>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="mx-auto max-w-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tests</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first test.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/tests/new"
                className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
              >
                Create Test
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Invitations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {test.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.description}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {test.questionsCount || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {test.invitationsCount || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <Link
                          href={`/admin/tests/${test.id}`}
                          className="text-brand-600 hover:text-brand-700"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/tests/${test.id}/analytics`}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Analytics
                        </Link>
                        <button
                          onClick={() =>
                            handleEmailSettings({
                              id: test.id,
                              title: test.title,
                            })
                          }
                          className="flex items-center text-purple-600 hover:text-purple-700"
                          title="Configure email notifications"
                        >
                          <Mail className="mr-1 h-4 w-4" />
                          Emails
                        </button>
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => handleArchiveTest(test.id)}
                              disabled={archivingTestId === test.id}
                              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                                archivingTestId === test.id
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:text-yellow-800'
                              }`}
                              title="Archive test (can be restored later)"
                            >
                              {archivingTestId === test.id
                                ? 'Archiving...'
                                : 'Archive'}
                            </button>
                            <button
                              onClick={() => handleDeleteTest(test.id)}
                              disabled={deletingTestId === test.id}
                              className={`rounded px-3 py-1 text-sm font-medium transition-colors ${
                                deletingTestId === test.id
                                  ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800'
                              }`}
                              title="⚠️ PERMANENTLY delete test (cannot be undone!)"
                            >
                              {deletingTestId === test.id
                                ? 'Deleting...'
                                : 'Delete Forever'}
                            </button>
                          </>
                        )}
                        {!isSuperAdmin && (
                          <span className="text-xs italic text-gray-400">
                            Super Admin only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Notification Settings Modal */}
      {selectedTestForEmail && (
        <EmailNotificationSettings
          testId={selectedTestForEmail.id}
          testTitle={selectedTestForEmail.title}
          isOpen={emailSettingsOpen}
          onClose={handleEmailSettingsClose}
          onSave={() => {
            // Optionally refresh tests or show success message
            console.log('Email settings saved successfully');
          }}
        />
      )}
    </div>
  );
}
