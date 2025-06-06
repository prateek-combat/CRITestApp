'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Invitation {
  id: string;
  email: string;
  status: 'PENDING' | 'SENT' | 'OPENED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  test: {
    id: string;
    title: string;
  };
  testAttempt?: {
    id?: string;
    videoRecordingUrl?: string | null;
  } | null;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [revokingInvites, setRevokingInvites] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchInvitations();
    fetchTests();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations');
      if (response.ok) {
        const data = await response.json();
        setInvitations(data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    }
  };

  const sendInvitation = async () => {
    if (!newEmail || !selectedTestId) return;

    setSendingInvite(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newEmail,
          testId: selectedTestId,
        }),
      });

      if (response.ok) {
        setNewEmail('');
        setSelectedTestId('');
        fetchInvitations();
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    } finally {
      setSendingInvite(false);
    }
  };

  const revokeInvitation = async (invitationId: string) => {
    setRevokingInvites((prev) => new Set(prev).add(invitationId));

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'CANCELLED',
        }),
      });

      if (response.ok) {
        // Refresh the invitations list
        fetchInvitations();
      } else {
        console.error('Failed to revoke invitation');
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
    } finally {
      setRevokingInvites((prev) => {
        const newSet = new Set(prev);
        newSet.delete(invitationId);
        return newSet;
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'OPENED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canRevoke = (status: string) => {
    return ['PENDING', 'SENT', 'OPENED'].includes(status);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invitations</h1>
          <p className="text-gray-600">
            Send test invitations and track responses
          </p>
        </div>
      </div>

      {/* Send New Invitation */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-lg">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Send New Invitation
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
              placeholder="candidate@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="test"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select Test
            </label>
            <select
              id="test"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Choose a test...</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={sendInvitation}
              disabled={!newEmail || !selectedTestId || sendingInvite}
              className="w-full rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendingInvite ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>

      {/* Invitations List */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Invitations
          </h2>
        </div>

        {invitations.length === 0 ? (
          <div className="p-12 text-center">
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No invitations
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Send your first test invitation using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Sent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Proctoring
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {invitation.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      <Link
                        href={`/admin/tests/${invitation.test.id}`}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {invitation.test.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(invitation.status)}`}
                      >
                        {invitation.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {invitation.completedAt
                        ? new Date(invitation.completedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {invitation.status === 'COMPLETED' &&
                      invitation.testAttempt?.id ? (
                        <Link
                          href={`/admin/proctor/${invitation.testAttempt.id}`}
                          className="inline-flex items-center rounded-md bg-military-green px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-military-green focus:ring-offset-2"
                        >
                          🎥 View Analysis
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        {canRevoke(invitation.status) && (
                          <button
                            onClick={() => revokeInvitation(invitation.id)}
                            disabled={revokingInvites.has(invitation.id)}
                            className="font-medium text-red-600 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {revokingInvites.has(invitation.id)
                              ? 'Revoking...'
                              : 'Revoke'}
                          </button>
                        )}

                        <Link
                          href={`/test/${invitation.id}`}
                          className="inline-flex items-center rounded-md border border-brand-300 bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700 transition-colors duration-200 hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                          target="_blank"
                        >
                          <svg
                            className="mr-1 h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Link
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
