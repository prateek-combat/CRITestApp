'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import LinkButton from '@/components/ui/LinkButton';
import InfoPanel from '@/components/ui/InfoPanel';
import EmailNotificationSettings from '@/components/EmailNotificationSettings';
import {
  Mail,
  Users,
  Plus,
  Archive,
  Trash2,
  Settings,
  Send,
  Copy,
  ExternalLink,
  MoreVertical,
  Edit,
  Bell,
  Eye,
} from 'lucide-react';
import { designSystem, componentStyles } from '@/lib/design-system';

interface Test {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionsCount: number;
  invitationsCount: number;
}

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

interface PublicTestLink {
  id: string;
  testId: string;
  linkToken: string;
  title: string;
  description: string | null;
  isActive: boolean;
  expiresAt: Date | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
  test: {
    id: string;
    title: string;
  };
  _count: {
    attempts: number;
  };
}

type FilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'SENT'
  | 'OPENED'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED';

export default function TestsPage() {
  const { data: session, status } = useSession();

  // Tests state
  const [tests, setTests] = useState<Test[]>([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [archivingTestId, setArchivingTestId] = useState<string | null>(null);
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);
  const [selectedTestForEmail, setSelectedTestForEmail] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Invitations state
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [selectedTestId, setSelectedTestId] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendingBulk, setSendingBulk] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingPublicLink, setGeneratingPublicLink] = useState(false);

  // Public Links state
  const [publicLinks, setPublicLinks] = useState<PublicTestLink[]>([]);
  const [publicLinksLoading, setPublicLinksLoading] = useState(true);
  const [publicLinksError, setPublicLinksError] = useState<string | null>(null);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [processingInvitation, setProcessingInvitation] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchTests();
    fetchInvitations();
    fetchPublicLinks();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown]);

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
      setTestsLoading(false);
    }
  };

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
      setInvitationsLoading(false);
    }
  };

  const fetchPublicLinks = async () => {
    try {
      setPublicLinksLoading(true);
      const response = await fetch('/api/public-test-links');
      if (!response.ok) {
        throw new Error('Failed to fetch public links');
      }
      const data = await response.json();
      setPublicLinks(data);
      setPublicLinksError(null);
    } catch (err) {
      setPublicLinksError(
        err instanceof Error ? err.message : 'An error occurred'
      );
    } finally {
      setPublicLinksLoading(false);
    }
  };

  const toggleLinkStatus = async (linkId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/public-test-links/admin/${linkId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update link status');
      }

      // Refresh the list
      fetchPublicLinks();
    } catch (err) {
      setPublicLinksError(
        err instanceof Error ? err.message : 'Failed to update link'
      );
    }
  };

  const deletePublicLink = async (linkId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this public link? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/public-test-links/admin/${linkId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete link');
      }

      // Refresh the list
      fetchPublicLinks();
      alert('✅ Public link deleted successfully');
    } catch (err) {
      alert(
        `❌ Error: ${err instanceof Error ? err.message : 'Failed to delete link'}`
      );
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('✅ URL copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('❌ Failed to copy URL to clipboard');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (link: PublicTestLink) => {
    if (!link.isActive) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Inactive
        </span>
      );
    }

    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          Expired
        </span>
      );
    }

    if (link.maxUses && link.usedCount >= link.maxUses) {
      return (
        <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800">
          Limit Reached
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        Active
      </span>
    );
  };

  const handleArchiveTest = async (testId: string) => {
    if (!window.confirm('Are you sure you want to archive this test?')) {
      return;
    }

    setArchivingTestId(testId);
    try {
      const response = await fetch(`/api/tests/${testId}/archive`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
        alert(`✅ Test "${result.testInfo?.title}" has been archived`);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to archive test'}`);
      }
    } catch (error) {
      console.error('Error archiving test:', error);
      alert('❌ Network error occurred');
    } finally {
      setArchivingTestId(null);
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (
      !window.confirm(
        '⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this test and ALL associated data. This action CANNOT be undone!\n\nAre you absolutely sure?'
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
        setTests((prevTests) => prevTests.filter((test) => test.id !== testId));
        alert(`✅ ${result.message}`);
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete test'}`);
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('❌ Network error occurred');
    } finally {
      setDeletingTestId(null);
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

        const { summary } = result;
        alert(
          `📊 Bulk Invitation Results:\n• Created: ${summary.totalCreated}\n• Failed: ${summary.totalFailed}`
        );
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
          title:
            tests.find((t) => t.id === selectedTestId)?.title +
            ' - Public Link',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const publicUrl = `${window.location.origin}/public-test/${result.linkToken}`;

        await navigator.clipboard.writeText(publicUrl);
        alert(
          `✅ Public link generated and copied to clipboard!\n\nURL: ${publicUrl}`
        );
        fetchInvitations();
        fetchPublicLinks(); // Also refresh public links list
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to generate public link'}`);
      }
    } catch (error) {
      console.error('Error generating public link:', error);
      alert('❌ Network error occurred');
    } finally {
      setGeneratingPublicLink(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'OPENED':
        return 'text-blue-600 bg-blue-100';
      case 'SENT':
        return 'text-yellow-600 bg-yellow-100';
      case 'PENDING':
        return 'text-gray-600 bg-gray-100';
      case 'EXPIRED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredInvitations = useMemo(() => {
    return invitations.filter((invitation) => {
      const matchesSearch =
        searchTerm === '' ||
        invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invitation.test.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || invitation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invitations, searchTerm, statusFilter]);

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  const handleEmailNotifications = (test: { id: string; title: string }) => {
    setSelectedTestForEmail(test);
    setEmailSettingsOpen(true);
    setOpenDropdown(null);
  };

  const revokeInvitation = async (invitationId: string) => {
    if (
      !confirm(
        '⚠️ Are you sure you want to revoke this invitation?\n\nThe candidate will no longer be able to access the test using this invitation.'
      )
    ) {
      return;
    }

    setProcessingInvitation(invitationId);
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
        alert('✅ Invitation revoked successfully');
        fetchInvitations();
      } else {
        const error = await response.json();
        alert(
          `❌ Error revoking invitation: ${error.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error revoking invitation:', error);
      alert('❌ Network error occurred while revoking invitation');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (
      !confirm(
        '⚠️ PERMANENT DELETION WARNING ⚠️\n\nThis will PERMANENTLY delete this invitation from the database.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure you want to delete this invitation?'
      )
    ) {
      return;
    }

    setProcessingInvitation(invitationId);
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('✅ Invitation deleted successfully');
        fetchInvitations();
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(
            `❌ Cannot delete invitation: ${error.message}\n\nTip: You can revoke the invitation instead to prevent further access.`
          );
        } else {
          alert(
            `❌ Error deleting invitation: ${error.message || 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      console.error('Error deleting invitation:', error);
      alert('❌ Network error occurred while deleting invitation');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const canRevokeInvitation = (invitation: Invitation) => {
    return (
      invitation.status !== 'COMPLETED' && invitation.status !== 'CANCELLED'
    );
  };

  const canDeleteInvitation = (invitation: Invitation) => {
    return !invitation.testAttempt?.id;
  };

  return (
    <div className={componentStyles.pageContainer}>
      <div
        className={`${componentStyles.contentWrapper} ${designSystem.gaps.page}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={designSystem.text.pageTitle}>Manage Tests</h1>
            <p className={designSystem.text.pageSubtitle}>
              Create and manage test questions and configurations
            </p>
          </div>
        </div>

        {/* Info Panel */}
        <InfoPanel
          title="💡 Need to send invitations or create public links?"
          variant="info"
          dismissible={true}
        >
          <p className="mb-2">
            <strong>
              For sending test invitations and creating public links:
            </strong>
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              Go to{' '}
              <Link
                href="/admin/job-profiles"
                className="font-medium text-blue-600 underline hover:text-blue-800"
              >
                Job Profiles
              </Link>{' '}
              to create assessment profiles
            </li>
            <li>
              Send individual or bulk invitations from the job profiles page
            </li>
            <li>
              Generate public test links that can be shared with candidates
            </li>
            <li>
              View all test attempts and analytics in one centralized location
            </li>
          </ul>
        </InfoPanel>

        {/* Tests Management */}
        <div className="page-transition-staggered space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {session?.user?.role === 'SUPER_ADMIN' && (
                <Link
                  href="/admin/tests/archived"
                  className={componentStyles.button.secondary}
                >
                  <Archive className="mr-1.5 inline h-4 w-4" />
                  View Archived
                </Link>
              )}
              <Link
                href="/admin/tests/new"
                className={componentStyles.button.primary}
              >
                <Plus className="mr-1.5 inline h-4 w-4" />
                Create New Test
              </Link>
            </div>
          </div>

          {testsLoading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-500"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className={`${componentStyles.card} text-center`}>
              <Settings className="mx-auto h-10 w-10 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first test.
              </p>
              <div className="mt-4">
                <Link
                  href="/admin/tests/new"
                  className={componentStyles.button.primary}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Link>
              </div>
            </div>
          ) : (
            <div className={componentStyles.table}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={designSystem.table.header}>
                  <tr>
                    <th className={designSystem.table.headerCell}>
                      Test Details
                    </th>
                    <th
                      className={`${designSystem.table.headerCell} text-center`}
                    >
                      Questions
                    </th>
                    <th
                      className={`${designSystem.table.headerCell} text-center`}
                    >
                      Invitations
                    </th>
                    <th className={designSystem.table.headerCell}>Created</th>
                    <th
                      className={`${designSystem.table.headerCell} text-right`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tests.map((test) => (
                    <tr key={test.id} className={designSystem.table.row}>
                      <td className={designSystem.table.cell}>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {test.title}
                          </h3>
                          {test.description && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {test.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className={`${designSystem.table.cell} text-center`}>
                        <span className="text-sm font-medium text-gray-900">
                          {test.questionsCount}
                        </span>
                      </td>
                      <td className={`${designSystem.table.cell} text-center`}>
                        <span className="text-sm font-medium text-gray-900">
                          {test.invitationsCount}
                        </span>
                      </td>
                      <td className={designSystem.table.cell}>
                        <span className="text-sm text-gray-500">
                          {new Date(test.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className={designSystem.table.cell}>
                        <div className="flex items-center justify-end space-x-1">
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="Edit Test"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={async () => {
                              try {
                                const response = await fetch(
                                  `/api/admin/tests/${test.id}/preview`,
                                  {
                                    method: 'POST',
                                  }
                                );

                                if (response.ok) {
                                  const data = await response.json();
                                  window.open(data.previewUrl, '_blank');
                                } else {
                                  const error = await response.json();
                                  alert(
                                    `Failed to create preview: ${error.error}`
                                  );
                                }
                              } catch (error) {
                                console.error('Error creating preview:', error);
                                alert('Failed to create preview link');
                              }
                            }}
                            className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="Preview Test"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              handleEmailNotifications({
                                id: test.id,
                                title: test.title,
                              });
                            }}
                            className="rounded p-1 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                            title="Email Notifications"
                          >
                            <Bell className="h-4 w-4" />
                          </button>
                          {session?.user?.role === 'SUPER_ADMIN' && (
                            <>
                              <button
                                onClick={() => handleArchiveTest(test.id)}
                                disabled={archivingTestId === test.id}
                                className="rounded p-1 text-yellow-600 transition-colors hover:bg-yellow-50 hover:text-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Archive Test"
                              >
                                <Archive className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTest(test.id)}
                                disabled={deletingTestId === test.id}
                                className="rounded p-1 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete Test"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Legacy invitation content - keeping for reference but hiding */}
        {false && (
          <div className="page-transition-slide-up space-y-3">
            {/* Send Invitation Form */}
            <div className="micro-lift rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Send Invitation
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Test
                  </label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="">Select a test</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Custom Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Additional message..."
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div className="flex items-end space-x-1.5">
                  <button
                    onClick={sendInvitationEmail}
                    disabled={!newEmail || !selectedTestId || sendingInvite}
                    className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {sendingInvite ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    onClick={() => setShowBulkForm(!showBulkForm)}
                    className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                  >
                    Bulk
                  </button>
                  <button
                    onClick={generatePublicTestLink}
                    disabled={!selectedTestId || generatingPublicLink}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {generatingPublicLink ? 'Creating...' : 'Public Link'}
                  </button>
                </div>
              </div>

              {showBulkForm && (
                <div className="mt-3 border-t pt-3">
                  <label className="block text-xs font-medium text-gray-700">
                    Bulk Email Addresses
                  </label>
                  <textarea
                    value={bulkEmails}
                    onChange={(e) => setBulkEmails(e.target.value)}
                    placeholder="Enter email addresses (one per line or comma-separated)"
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  />
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={sendBulkInvitations}
                      disabled={
                        !bulkEmails.trim() || !selectedTestId || sendingBulk
                      }
                      className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {sendingBulk ? 'Sending...' : 'Send Bulk Invitations'}
                    </button>
                    <button
                      onClick={() => setShowBulkForm(false)}
                      className="rounded-md bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="micro-scale rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search emails or tests..."
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as FilterStatus)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="OPENED">Opened</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="EXPIRED">Expired</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">
                    Test
                  </label>
                  <select
                    value={selectedTestId}
                    onChange={(e) => setSelectedTestId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-brand-500 focus:ring-brand-500"
                  >
                    <option value="">All Tests</option>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>
                        {test.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Invitations List */}
            {invitationsLoading ? (
              <div className="flex justify-center py-6">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-brand-500"></div>
              </div>
            ) : (
              <div className="micro-lift overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Candidate
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Test
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Score
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredInvitations.map((invitation) => (
                        <tr key={invitation.id}>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {invitation.candidateName || invitation.email}
                              </div>
                              {invitation.candidateName && (
                                <div className="text-xs text-gray-500">
                                  {invitation.email}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <div className="text-sm text-gray-900">
                              {invitation.test.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {invitation.type === 'public'
                                ? 'Public Link'
                                : 'Invitation'}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(invitation.status)}`}
                            >
                              {invitation.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-gray-900">
                            {invitation.testAttempt?.rawScore !== undefined
                              ? `${invitation.testAttempt.rawScore}%`
                              : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {invitation.testAttempt?.id && (
                                <LinkButton
                                  href={`/admin/analytics/analysis/${invitation.testAttempt.id}`}
                                  variant="outline"
                                  size="xs"
                                  className="border-brand-600 text-brand-600 hover:bg-brand-50"
                                >
                                  View Analysis
                                </LinkButton>
                              )}
                              {canRevokeInvitation(invitation) && (
                                <button
                                  onClick={() =>
                                    revokeInvitation(invitation.id)
                                  }
                                  disabled={
                                    processingInvitation === invitation.id
                                  }
                                  className="text-orange-600 hover:text-orange-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {processingInvitation === invitation.id
                                    ? 'Revoking...'
                                    : 'Revoke'}
                                </button>
                              )}
                              {canDeleteInvitation(invitation) && (
                                <button
                                  onClick={() =>
                                    deleteInvitation(invitation.id)
                                  }
                                  disabled={
                                    processingInvitation === invitation.id
                                  }
                                  className="text-red-600 hover:text-red-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {processingInvitation === invitation.id
                                    ? 'Deleting...'
                                    : 'Delete'}
                                </button>
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
          </div>
        )}

        {/* Email Settings Modal */}
        {emailSettingsOpen && selectedTestForEmail && (
          <EmailNotificationSettings
            testId={selectedTestForEmail.id}
            testTitle={selectedTestForEmail.title}
            isOpen={emailSettingsOpen}
            onClose={() => {
              setEmailSettingsOpen(false);
              setSelectedTestForEmail(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
