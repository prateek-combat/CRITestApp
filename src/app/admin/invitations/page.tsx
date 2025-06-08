'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Invitation {
  id: string;
  type: 'invitation' | 'public';
  email: string;
  candidateName?: string;
  status: 'PENDING' | 'SENT' | 'OPENED' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  createdAt: string;
  completedAt?: string;
  test: {
    id: string;
    title: string;
  };
  testAttempt?: {
    id?: string;
    status?: string;
    completedAt?: string;
    rawScore?: number;
    percentile?: number;
    videoRecordingUrl?: string | null;
  } | null;
  publicLinkTitle?: string | null;
}

type FilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'SENT'
  | 'OPENED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';
type SortField = 'createdAt' | 'email' | 'status' | 'completedAt';
type SortOrder = 'asc' | 'desc';

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [tests, setTests] = useState<{ id: string; title: string }[]>([]);
  const [sendingInvite, setSendingInvite] = useState(false);

  const [customMessage, setCustomMessage] = useState('');
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [revokingInvites, setRevokingInvites] = useState<Set<string>>(
    new Set()
  );

  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [testFilter, setTestFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(
    new Set()
  );
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [generatingPublicLink, setGeneratingPublicLink] = useState(false);

  useEffect(() => {
    fetchInvitations();
    fetchTests();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/invitations/combined');
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

  const sendInvitationEmail = async () => {
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
          sendEmail: true,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setNewEmail('');
        setSelectedTestId('');
        setCustomMessage('');
        fetchInvitations();

        if (result.emailResult?.success) {
          alert(
            `✅ Invitation sent successfully! Email delivered to ${newEmail}`
          );
        } else {
          alert(
            `⚠️ Invitation created but email failed: ${result.emailResult?.error || 'Unknown error'}`
          );
        }
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to send invitation'}`);
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('❌ Network error occurred');
    } finally {
      setSendingInvite(false);
    }
  };

  const sendBulkInvitations = async () => {
    if (!bulkEmails.trim() || !selectedTestId) return;

    setSendingBulk(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailText: bulkEmails,
          testId: selectedTestId,
          sendEmail: true,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setBulkEmails('');
        setCustomMessage('');
        setShowBulkForm(false);
        fetchInvitations();

        // Show detailed results
        const { summary, emailResults } = result;
        let message = `📊 Bulk Invitation Results:\n\n`;
        message += `• Total Processed: ${summary.totalProcessed}\n`;
        message += `• Successfully Created: ${summary.totalCreated}\n`;
        message += `• Failed: ${summary.totalFailed}\n`;

        if (emailResults) {
          message += `• Emails Sent: ${emailResults.totalSent}\n`;
          message += `• Email Failures: ${emailResults.totalFailed}\n`;
        }

        alert(message);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to send bulk invitations'}`);
      }
    } catch (error) {
      console.error('Error sending bulk invitations:', error);
      alert('❌ Network error occurred');
    } finally {
      setSendingBulk(false);
    }
  };

  const generatePublicTestLink = async () => {
    if (!selectedTestId) return;

    setGeneratingPublicLink(true);
    try {
      const response = await fetch('/api/public-test-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testId: selectedTestId,
          title: customMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Copy link to clipboard
        try {
          await navigator.clipboard.writeText(result.publicUrl);
          alert(
            `✅ Public test link generated and copied to clipboard!\n\nLink: ${result.publicUrl}\n\nShare this link with multiple candidates. They can enter their details and start the test directly.`
          );
        } catch (clipboardError) {
          // Fallback if clipboard API fails
          alert(
            `✅ Public test link generated!\n\nLink: ${result.publicUrl}\n\nPlease copy this link manually and share it with candidates.`
          );
        }
      } else {
        const error = await response.json();
        alert(
          `❌ Error: ${error.error || 'Failed to generate public test link'}`
        );
      }
    } catch (error) {
      console.error('Error generating public test link:', error);
      alert('❌ Network error occurred');
    } finally {
      setGeneratingPublicLink(false);
    }
  };

  const sendBulkReminders = async () => {
    if (selectedInvitations.size === 0) return;

    setSendingReminders(true);
    try {
      const response = await fetch('/api/invitations/send-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationIds: Array.from(selectedInvitations),
          reminderType: 'first',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedInvitations(new Set());

        const { summary } = result;
        let message = `📧 Reminder Results:\n\n`;
        message += `• Total Processed: ${summary.totalProcessed}\n`;
        message += `• Emails Sent: ${summary.totalSent}\n`;
        message += `• Failed: ${summary.totalFailed}\n`;

        alert(message);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to send reminders'}`);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('❌ Network error occurred');
    } finally {
      setSendingReminders(false);
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

  const bulkRevoke = async () => {
    const promises = Array.from(selectedInvitations).map((id) =>
      revokeInvitation(id)
    );
    await Promise.all(promises);
    setSelectedInvitations(new Set());
    setShowBulkActions(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'OPENED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '✅';
      case 'PENDING':
        return '⏳';
      case 'SENT':
        return '📧';
      case 'OPENED':
        return '👀';
      case 'CANCELLED':
        return '❌';
      case 'EXPIRED':
        return '⏰';
      default:
        return '❓';
    }
  };

  const canRevoke = (status: string) => {
    return ['PENDING', 'SENT', 'OPENED'].includes(status);
  };

  // Statistics calculations
  const statistics = useMemo(() => {
    const total = invitations.length;
    const completed = invitations.filter(
      (i) => i.status === 'COMPLETED'
    ).length;
    const pending = invitations.filter((i) => i.status === 'PENDING').length;
    const sent = invitations.filter((i) => i.status === 'SENT').length;
    const opened = invitations.filter((i) => i.status === 'OPENED').length;
    const cancelled = invitations.filter(
      (i) => i.status === 'CANCELLED'
    ).length;
    const expired = invitations.filter((i) => i.status === 'EXPIRED').length;

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;
    const openRate =
      total > 0 ? Math.round(((opened + completed) / total) * 100) : 0;

    // Recent activity (last 7 days)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentInvitations = invitations.filter(
      (i) => new Date(i.createdAt) > oneWeekAgo
    ).length;

    return {
      total,
      completed,
      pending,
      sent,
      opened,
      cancelled,
      expired,
      completionRate,
      openRate,
      recentInvitations,
    };
  }, [invitations]);

  // Filtered and sorted invitations
  const filteredInvitations = useMemo(() => {
    let filtered = invitations.filter((invitation) => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.test.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (invitation.candidateName &&
          invitation.candidateName
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (invitation.publicLinkTitle &&
          invitation.publicLinkTitle
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus =
        statusFilter === 'ALL' || invitation.status === statusFilter;

      // Test filter
      const matchesTest =
        testFilter === 'ALL' || invitation.test.id === testFilter;

      // Date range filter
      let matchesDate = true;
      if (dateRange !== 'ALL') {
        const invitationDate = new Date(invitation.createdAt);
        const now = new Date();

        switch (dateRange) {
          case 'TODAY':
            matchesDate = invitationDate.toDateString() === now.toDateString();
            break;
          case 'WEEK':
            const oneWeekAgo = new Date(
              now.getTime() - 7 * 24 * 60 * 60 * 1000
            );
            matchesDate = invitationDate >= oneWeekAgo;
            break;
          case 'MONTH':
            const oneMonthAgo = new Date(
              now.getTime() - 30 * 24 * 60 * 60 * 1000
            );
            matchesDate = invitationDate >= oneMonthAgo;
            break;
        }
      }

      return matchesSearch && matchesStatus && matchesTest && matchesDate;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'email':
          aValue = a.email;
          bValue = b.email;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'completedAt':
          aValue = a.completedAt ? new Date(a.completedAt) : new Date(0);
          bValue = b.completedAt ? new Date(b.completedAt) : new Date(0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    invitations,
    searchTerm,
    statusFilter,
    testFilter,
    dateRange,
    sortField,
    sortOrder,
  ]);

  const handleSelectAll = () => {
    if (selectedInvitations.size === filteredInvitations.length) {
      setSelectedInvitations(new Set());
    } else {
      setSelectedInvitations(new Set(filteredInvitations.map((i) => i.id)));
    }
  };

  const handleSelectInvitation = (id: string) => {
    const newSelected = new Set(selectedInvitations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedInvitations(newSelected);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setTestFilter('ALL');
    setDateRange('ALL');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="text-gray-600">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invitations</h1>
          <p className="mt-1 text-gray-600">
            Send test invitations and track candidate responses
          </p>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {statistics.total}
              </h3>
              <p className="text-sm text-gray-600">Total Invitations</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {statistics.recentInvitations} sent this week
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {statistics.completionRate}%
              </h3>
              <p className="text-sm text-gray-600">Completion Rate</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {statistics.completed} of {statistics.total} completed
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <span className="text-2xl">👀</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {statistics.openRate}%
              </h3>
              <p className="text-sm text-gray-600">Open Rate</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              {statistics.opened + statistics.completed} opened
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {statistics.pending}
              </h3>
              <p className="text-sm text-gray-600">Pending</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-500">
              Awaiting candidate action
            </span>
          </div>
        </div>
      </div>

      {/* Send New Invitation */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Send Invitations
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowBulkForm(!showBulkForm)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                showBulkForm
                  ? 'bg-brand-500 text-white'
                  : 'border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100'
              }`}
            >
              {showBulkForm ? '📧 Single' : '📨 Bulk'}
            </button>
          </div>
        </div>

        {/* Custom Message */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div>
            <label
              htmlFor="customMessage"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Custom Message (Optional)
            </label>
            <textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to the invitation..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
              rows={2}
            />
          </div>
        </div>

        {showBulkForm ? (
          /* Bulk Invitation Form */
          <div className="space-y-4">
            <div>
              <label
                htmlFor="bulkEmails"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Addresses (comma or newline separated)
              </label>
              <textarea
                id="bulkEmails"
                value={bulkEmails}
                onChange={(e) => setBulkEmails(e.target.value)}
                placeholder="user1@example.com, user2@example.com
user3@example.com
user4@example.com"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
                rows={4}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter multiple email addresses separated by commas or new lines
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="bulkTest"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Select Test
                </label>
                <select
                  id="bulkTest"
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
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
                  onClick={sendBulkInvitations}
                  disabled={
                    !bulkEmails.trim() || !selectedTestId || sendingBulk
                  }
                  className="w-full rounded-lg bg-brand-500 px-6 py-3 font-medium text-white transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingBulk ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
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
                      Sending Bulk...
                    </span>
                  ) : (
                    `📨 Send Bulk Invitations`
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Single Invitation Form */
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
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
                onClick={sendInvitationEmail}
                disabled={!newEmail || !selectedTestId || sendingInvite}
                className="w-full rounded-lg bg-brand-500 px-4 py-3 font-medium text-white transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendingInvite ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="mr-2 h-4 w-4 animate-spin"
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
                        d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending&hellip;
                  </span>
                ) : (
                  '📧 Send Invitation Email'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-blue-50 p-3">
          <div className="text-sm text-blue-800">
            <p>
              <strong>📧 Send Invitation Email:</strong> Sends the invitation
              directly to the candidate's email address with a personalized test
              link.
            </p>
          </div>
        </div>
      </div>

      {/* Generate Public Test Link - Separate Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            🌐 Generate Public Test Link
          </h2>
          <Link
            href="/admin/public-links"
            className="inline-flex items-center rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200"
          >
            📋 Manage Public Links
          </Link>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Create a public link that multiple candidates can use to enter their
            details and start the test directly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="publicTestId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select Test
            </label>
            <select
              id="publicTestId"
              value={selectedTestId}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
            >
              <option value="">Choose a test...</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="publicLinkTitle"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Link Title (Optional)
            </label>
            <input
              id="publicLinkTitle"
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g., Software Developer Assessment"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generatePublicTestLink}
              disabled={!selectedTestId || generatingPublicLink}
              className="w-full rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-all hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingPublicLink ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
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
                      d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating&hellip;
                </span>
              ) : (
                '🌐 Generate Public Link'
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          <p>
            This creates a public link that anyone can use to access the test
            after entering their name and email. Use &quot;Manage Public
            Links&quot; to view, activate/deactivate, or delete existing public
            links.
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Filter & Search
          </h2>
          {(searchTerm ||
            statusFilter !== 'ALL' ||
            testFilter !== 'ALL' ||
            dateRange !== 'ALL') && (
            <button
              onClick={clearFilters}
              className="text-sm text-brand-600 hover:text-brand-700"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by email or test..."
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
            >
              <option value="ALL">All Status ({statistics.total})</option>
              <option value="PENDING">Pending ({statistics.pending})</option>
              <option value="SENT">Sent ({statistics.sent})</option>
              <option value="OPENED">Opened ({statistics.opened})</option>
              <option value="COMPLETED">
                Completed ({statistics.completed})
              </option>
              <option value="CANCELLED">
                Cancelled ({statistics.cancelled})
              </option>
              <option value="EXPIRED">Expired ({statistics.expired})</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Test
            </label>
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
            >
              <option value="ALL">All Tests</option>
              {tests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 days</option>
              <option value="MONTH">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedInvitations.size > 0 && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-brand-900">
                {selectedInvitations.size} invitation
                {selectedInvitations.size > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={sendBulkReminders}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  sendingReminders ||
                  !Array.from(selectedInvitations).some((id) => {
                    const inv = invitations.find((i) => i.id === id);
                    return (
                      inv && ['PENDING', 'SENT', 'OPENED'].includes(inv.status)
                    );
                  })
                }
              >
                {sendingReminders ? (
                  <span className="flex items-center">
                    <svg
                      className="mr-1 h-3 w-3 animate-spin"
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
                    Sending&hellip;
                  </span>
                ) : (
                  '📧 Send Reminders'
                )}
              </button>
              <button
                onClick={bulkRevoke}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={
                  !Array.from(selectedInvitations).some((id) => {
                    const inv = invitations.find((i) => i.id === id);
                    return inv && canRevoke(inv.status);
                  })
                }
              >
                ❌ Bulk Revoke
              </button>
              <button
                onClick={() => setSelectedInvitations(new Set())}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Invitations ({filteredInvitations.length})
            </h2>
            <div className="flex items-center space-x-4">
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field as SortField);
                  setSortOrder(order as SortOrder);
                }}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
                <option value="status-asc">Status A-Z</option>
                <option value="completedAt-desc">Recently Completed</option>
              </select>
            </div>
          </div>
        </div>

        {filteredInvitations.length === 0 ? (
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
              {invitations.length === 0
                ? 'No invitations yet'
                : 'No matching invitations'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {invitations.length === 0
                ? 'Send your first test invitation using the form above.'
                : 'Try adjusting your search criteria or clear the filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3">
                    <input
                      type="checkbox"
                      checked={
                        selectedInvitations.size ===
                          filteredInvitations.length &&
                        filteredInvitations.length > 0
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Email & Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Timeline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Proctoring
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedInvitations.has(invitation.id)}
                        onChange={() => handleSelectInvitation(invitation.id)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {invitation.candidateName || invitation.email}
                          </div>
                          {invitation.type === 'public' && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                              🌐 Public
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invitation.candidateName && (
                            <div>{invitation.email}</div>
                          )}
                          <Link
                            href={`/admin/tests/${invitation.test.id}`}
                            className="text-brand-600 hover:text-brand-700"
                          >
                            {invitation.test.title}
                          </Link>
                          {invitation.publicLinkTitle && (
                            <div className="text-xs text-purple-600">
                              via: {invitation.publicLinkTitle}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(invitation.status)}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(invitation.status)}
                        </span>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>
                          {invitation.type === 'public' ? 'Started' : 'Sent'}:{' '}
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </div>
                        {invitation.completedAt &&
                          invitation.status === 'COMPLETED' && (
                            <div className="text-green-600">
                              <div>
                                Done:{' '}
                                {new Date(
                                  invitation.completedAt
                                ).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-green-500">
                                {new Date(
                                  invitation.completedAt
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </div>
                            </div>
                          )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {invitation.status === 'COMPLETED' &&
                      invitation.testAttempt?.id ? (
                        <Link
                          href={`/admin/proctor/${invitation.testAttempt.id}`}
                          className="inline-flex items-center rounded-lg bg-military-green px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-military-green focus:ring-offset-2"
                        >
                          🎥 View Analysis
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
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
