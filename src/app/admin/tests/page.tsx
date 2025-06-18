'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<
    'tests' | 'invitations' | 'publicLinks'
  >('tests');

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
      const response = await fetch('/api/admin/public-links');
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
      const response = await fetch(`/api/admin/public-links/${linkId}`, {
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
      const response = await fetch(`/api/admin/public-links/${linkId}`, {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tests & Invitations
          </h1>
          <p className="text-gray-600">
            Create tests, manage questions, and send invitations
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tests')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'tests'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Manage Tests</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'invitations'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Send Invitations</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('publicLinks')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'publicLinks'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <ExternalLink className="h-4 w-4" />
              <span>Public Links</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Tests Tab */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              {isSuperAdmin && (
                <Link
                  href="/admin/tests/archived"
                  className="rounded-lg bg-gray-500 px-4 py-2 text-white transition-colors hover:bg-gray-600"
                >
                  <Archive className="mr-2 inline h-4 w-4" />
                  View Archived
                </Link>
              )}
              <Link
                href="/admin/tests/new"
                className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
              >
                <Plus className="mr-2 inline h-4 w-4" />
                Create New Test
              </Link>
            </div>
          </div>

          {testsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No tests
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first test.
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/tests/new"
                  className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Test
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {test.title}
                      </h3>
                      {test.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {test.description}
                        </p>
                      )}
                    </div>

                    {/* Three-dots menu */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenDropdown(
                            openDropdown === test.id ? null : test.id
                          );
                        }}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>

                      {openDropdown === test.id && (
                        <div className="absolute right-0 top-10 z-10 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                          <Link
                            href={`/admin/tests/${test.id}`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(null);
                            }}
                          >
                            <Edit className="mr-3 h-4 w-4" />
                            Edit Test
                          </Link>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmailNotifications({
                                id: test.id,
                                title: test.title,
                              });
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Bell className="mr-3 h-4 w-4" />
                            Email Notifications
                          </button>

                          {isSuperAdmin && (
                            <>
                              <div className="my-1 border-t border-gray-100"></div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleArchiveTest(test.id);
                                  setOpenDropdown(null);
                                }}
                                disabled={archivingTestId === test.id}
                                className="flex w-full items-center px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 disabled:opacity-50"
                              >
                                <Archive className="mr-3 h-4 w-4" />
                                {archivingTestId === test.id
                                  ? 'Archiving...'
                                  : 'Archive Test'}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTest(test.id);
                                  setOpenDropdown(null);
                                }}
                                disabled={deletingTestId === test.id}
                                className="flex w-full items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="mr-3 h-4 w-4" />
                                {deletingTestId === test.id
                                  ? 'Deleting...'
                                  : 'Delete Test'}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 space-y-1 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Questions:</span>
                      <span className="font-medium">{test.questionsCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Invitations:</span>
                      <span className="font-medium">
                        {test.invitationsCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Click ⋮ for options</span>
                    <Link
                      href={`/admin/tests/${test.id}`}
                      className="inline-flex items-center font-medium text-blue-600 hover:text-blue-800"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Send Invitation Form */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-medium text-gray-900">
              Send Invitation
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Test
                </label>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
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
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Custom Message (Optional)
                </label>
                <input
                  type="text"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Additional message..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={sendInvitationEmail}
                  disabled={!newEmail || !selectedTestId || sendingInvite}
                  className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {sendingInvite ? 'Sending...' : 'Send'}
                </button>
                <button
                  onClick={() => setShowBulkForm(!showBulkForm)}
                  className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                >
                  Bulk
                </button>
                <button
                  onClick={generatePublicTestLink}
                  disabled={!selectedTestId || generatingPublicLink}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {generatingPublicLink ? 'Creating...' : 'Public Link'}
                </button>
              </div>
            </div>

            {showBulkForm && (
              <div className="mt-4 border-t pt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Bulk Email Addresses
                </label>
                <textarea
                  value={bulkEmails}
                  onChange={(e) => setBulkEmails(e.target.value)}
                  placeholder="Enter email addresses (one per line or comma-separated)"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={sendBulkInvitations}
                    disabled={
                      !bulkEmails.trim() || !selectedTestId || sendingBulk
                    }
                    className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                  >
                    {sendingBulk ? 'Sending...' : 'Send Bulk Invitations'}
                  </button>
                  <button
                    onClick={() => setShowBulkForm(false)}
                    className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search emails or tests..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as FilterStatus)
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500"
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
            </div>
          </div>

          {/* Invitations List */}
          {invitationsLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Candidate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Test
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Score
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredInvitations.map((invitation) => (
                      <tr key={invitation.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {invitation.candidateName || invitation.email}
                            </div>
                            {invitation.candidateName && (
                              <div className="text-sm text-gray-500">
                                {invitation.email}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {invitation.test.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invitation.type === 'public'
                              ? 'Public Link'
                              : 'Invitation'}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(invitation.status)}`}
                          >
                            {invitation.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {invitation.testAttempt?.rawScore !== undefined
                            ? `${invitation.testAttempt.rawScore}%`
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          {invitation.testAttempt?.id && (
                            <Link
                              href={`/admin/analytics/analysis/${invitation.testAttempt.id}`}
                              className="text-brand-600 hover:text-brand-900"
                            >
                              View Analysis
                            </Link>
                          )}
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

      {/* Public Links Tab */}
      {activeTab === 'publicLinks' && (
        <div className="space-y-6">
          {/* Error Message */}
          {publicLinksError && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{publicLinksError}</div>
            </div>
          )}

          {/* Public Links List */}
          {publicLinksLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
              {publicLinks.length === 0 ? (
                <div className="py-12 text-center">
                  <ExternalLink className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No public links
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new public test link from the
                    invitations tab.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveTab('invitations')}
                      className="inline-flex items-center rounded-md border border-transparent bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                    >
                      Create Public Link
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {publicLinks.map((link) => {
                    const publicUrl = `${window.location.origin}/public-test/${link.linkToken}`;

                    return (
                      <li key={link.id} className="px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h3 className="truncate text-lg font-medium text-gray-900">
                                    {link.title}
                                  </h3>
                                  {getStatusBadge(link)}
                                </div>
                                <p className="mt-1 text-sm text-gray-500">
                                  Test: {link.test.title}
                                </p>
                                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                                  <span>
                                    Used: {link.usedCount}
                                    {link.maxUses ? ` / ${link.maxUses}` : ''}
                                  </span>
                                  <span>•</span>
                                  <span>
                                    Created: {formatDate(link.createdAt)}
                                  </span>
                                  {link.expiresAt && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Expires: {formatDate(link.expiresAt)}
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="mt-2 flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={publicUrl}
                                    readOnly
                                    className="flex-1 rounded border border-gray-300 bg-gray-50 px-3 py-1 font-mono text-sm"
                                  />
                                  <button
                                    onClick={() => copyToClipboard(publicUrl)}
                                    className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                  >
                                    <Copy className="mr-1 h-4 w-4" />
                                    Copy
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex items-center space-x-2">
                            <Link
                              href={`/admin/analytics/analysis?publicLinkId=${link.id}`}
                              className="inline-flex items-center rounded border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              📊 View Attempts
                            </Link>

                            <button
                              onClick={() =>
                                toggleLinkStatus(link.id, link.isActive)
                              }
                              className={`inline-flex items-center rounded border px-3 py-1 text-sm font-medium shadow-sm ${
                                link.isActive
                                  ? 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100'
                                  : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                              }`}
                            >
                              {link.isActive ? 'Deactivate' : 'Activate'}
                            </button>

                            <button
                              onClick={() => deletePublicLink(link.id)}
                              className="inline-flex items-center rounded border border-red-300 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
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
  );
}
