'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TestTube,
  Building2,
  Target,
  Search,
  Filter,
  MoreVertical,
  Send,
  Copy,
  Eye,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  Link,
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  code: string;
  description: string | null;
  department: string | null;
  level: string | null;
  isActive: boolean;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  questionsCount: number;
  isArchived: boolean;
}

interface JobProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  positions: Position[];
  tests: Test[];
  _count: {
    invitations: number;
    completedInvitations: number;
  };
}

interface JobProfileInvitation {
  id: string;
  candidateEmail: string;
  candidateName: string | null;
  status: 'PENDING' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
  createdAt: string;
  completedAt: string | null;
  jobProfile?: {
    id: string;
    name: string;
  } | null;
  testAttempts?: {
    id: string;
    testId: string;
    status: string;
    rawScore: number | null;
    completedAt: string | null;
    test: {
      title: string;
    };
  }[];
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
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'EXPIRED';

export default function JobProfilesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State
  const [activeTab, setActiveTab] = useState<
    'profiles' | 'invitations' | 'publicLinks'
  >('profiles');
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [invitations, setInvitations] = useState<JobProfileInvitation[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicTestLink[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openInvitationDropdown, setOpenInvitationDropdown] = useState<
    string | null
  >(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    positionIds: [] as string[],
    testIds: [] as string[],
  });

  // Invitation form state
  const [invitationData, setInvitationData] = useState({
    candidateEmail: '',
    candidateName: '',
    customMessage: '',
    expiresInDays: 7,
  });

  // Bulk invitation state
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkEmails, setBulkEmails] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [generatingPublicLink, setGeneratingPublicLink] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<
    string | null
  >(null);

  // Auth check
  useEffect(() => {
    if (status === 'loading') return;
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch data
  const fetchJobProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/job-profiles');
      if (!response.ok) throw new Error('Failed to fetch job profiles');
      const data = await response.json();
      setJobProfiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch job profiles'
      );
    }
  }, []);

  const fetchInvitations = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/job-profiles/invitations');
      if (!response.ok) throw new Error('Failed to fetch invitations');
      const data = await response.json();
      setInvitations(data);
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
    }
  }, []);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data.filter((p: Position) => p.isActive));
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data.filter((t: Test) => !t.isArchived));
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  }, []);

  const fetchPublicLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/public-links');
      if (!response.ok) throw new Error('Failed to fetch public links');
      const data = await response.json();
      setPublicLinks(data);
    } catch (err) {
      console.error('Failed to fetch public links:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchJobProfiles(),
        fetchInvitations(),
        fetchPositions(),
        fetchTests(),
        fetchPublicLinks(),
      ]);
      setLoading(false);
    };

    if (session?.user) {
      loadData();
    }
  }, [session, fetchJobProfiles, fetchInvitations, fetchPositions, fetchTests]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown) {
        setOpenDropdown(null);
      }
      if (openInvitationDropdown) {
        setOpenInvitationDropdown(null);
      }
    };

    if (openDropdown || openInvitationDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdown, openInvitationDropdown]);

  // Handlers
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await fetch('/api/admin/job-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create job profile');
      }

      await fetchJobProfiles();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create job profile'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/job-profiles/${selectedProfile.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update job profile');
      }

      await fetchJobProfiles();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update job profile'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProfile = async (profile: JobProfile) => {
    if (
      !confirm(
        `Are you sure you want to delete "${profile.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/job-profiles/${profile.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete job profile');
      }

      await fetchJobProfiles();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete job profile'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteInvitation = async (invitation: JobProfileInvitation) => {
    if (
      !confirm(
        `Are you sure you want to delete the invitation for "${invitation.candidateEmail}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/job-profiles/invitations/${invitation.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invitation');
      }

      await fetchInvitations();
      setOpenInvitationDropdown(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete invitation'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/admin/job-profiles/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobProfileId: selectedProfile.id,
          candidateEmail: invitationData.candidateEmail,
          candidateName: invitationData.candidateName,
          customMessage: invitationData.customMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      const result = await response.json();
      alert('✅ Invitation sent successfully!');
      await fetchInvitations();
      setShowInviteModal(false);
      resetInvitationForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
      alert(
        `❌ Error: ${err instanceof Error ? err.message : 'Failed to send invitation'}`
      );
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      positionIds: [],
      testIds: [],
    });
    setSelectedProfile(null);
  };

  const resetInvitationForm = () => {
    setInvitationData({
      candidateEmail: '',
      candidateName: '',
      customMessage: '',
      expiresInDays: 7,
    });
  };

  const openEditModal = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      isActive: profile.isActive,
      positionIds: profile.positions.map((p) => p.id),
      testIds: profile.tests.map((t) => t.id),
    });
    setShowEditModal(true);
  };

  const openInviteModal = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setShowInviteModal(true);
  };

  // Filter profiles
  const filteredProfiles = jobProfiles.filter((profile) => {
    const matchesSearch =
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      departmentFilter === 'all' ||
      profile.positions.some((p) => p.department === departmentFilter);

    return matchesSearch && matchesDepartment;
  });

  // Get unique departments
  const departments = Array.from(
    new Set(
      positions
        .map((p) => p.department)
        .filter((dept): dept is string => Boolean(dept))
    )
  ).sort();

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      SENT: { color: 'bg-blue-100 text-blue-800', icon: Mail },
      IN_PROGRESS: { color: 'bg-purple-100 text-purple-800', icon: TestTube },
      COMPLETED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      EXPIRED: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };

    const badge = badges[status as keyof typeof badges] || badges.PENDING;
    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${badge.color}`}
      >
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </span>
    );
  };

  // Utility functions
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('✅ Copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('❌ Failed to copy to clipboard');
    }
  };

  const generatePublicTestLink = async (profileId: string) => {
    setGeneratingPublicLink(true);
    try {
      const profile = jobProfiles.find((p) => p.id === profileId);
      if (!profile) return;

      // For now, create a public link for the first test in the profile
      // In a full implementation, you might want to create a combined test
      const firstTest = profile.tests[0];
      if (!firstTest) {
        alert('❌ No tests found in this job profile');
        return;
      }

      const response = await fetch('/api/public-test-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: firstTest.id,
          title: `${profile.name} - Public Assessment`,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const publicUrl = `${window.location.origin}/public-test/${result.linkToken}`;

        await navigator.clipboard.writeText(publicUrl);
        alert(
          `✅ Public link generated and copied to clipboard!\n\nURL: ${publicUrl}`
        );
        fetchPublicLinks();
        return result;
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-2 text-red-500">
            <XCircle className="mx-auto h-12 w-12" />
          </div>
          <h3 className="mb-1 text-lg font-medium text-gray-900">Error</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Job Profiles</h1>
        <p className="text-gray-600">
          Create and manage job profiles that combine multiple tests for
          specific positions.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'profiles'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Building2 className="mr-2 inline h-4 w-4" />
            Job Profiles ({jobProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('invitations')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'invitations'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <Mail className="mr-2 inline h-4 w-4" />
            Invitations ({invitations.length})
          </button>
          <button
            onClick={() => setActiveTab('publicLinks')}
            className={`border-b-2 px-1 py-2 text-sm font-medium ${
              activeTab === 'publicLinks'
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            <ExternalLink className="mr-2 inline h-4 w-4" />
            Public Links ({publicLinks.length})
          </button>
        </nav>
      </div>

      {activeTab === 'profiles' && (
        <>
          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <input
                  type="text"
                  placeholder="Search profiles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Create Profile
            </button>
          </div>

          {/* Job Profiles Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-1 text-lg font-semibold text-gray-900">
                      {profile.name}
                    </h3>
                    {profile.description && (
                      <p className="mb-3 text-sm text-gray-600">
                        {profile.description}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdown(
                          openDropdown === profile.id ? null : profile.id
                        );
                      }}
                      className="rounded p-1 hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-400" />
                    </button>
                    {openDropdown === profile.id && (
                      <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                        <button
                          onClick={() => {
                            openInviteModal(profile);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Send className="h-4 w-4" />
                          Send Invitation
                        </button>
                        <button
                          onClick={async () => {
                            await generatePublicTestLink(profile.id);
                            setOpenDropdown(null);
                          }}
                          disabled={generatingPublicLink}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          {generatingPublicLink
                            ? 'Creating...'
                            : 'Create Public Link'}
                        </button>
                        <button
                          onClick={() => {
                            openEditModal(profile);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Profile
                        </button>
                        <button
                          onClick={() => {
                            handleDeleteProfile(profile);
                            setOpenDropdown(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete Profile
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Positions */}
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Positions
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {profile.positions.map((position) => (
                      <span
                        key={position.id}
                        className="inline-flex items-center rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-800"
                      >
                        {position.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tests */}
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Tests ({profile.tests.length})
                  </h4>
                  <div className="space-y-1">
                    {profile.tests.slice(0, 3).map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <TestTube className="h-3 w-3" />
                        {test.title}
                      </div>
                    ))}
                    {profile.tests.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{profile.tests.length - 3} more tests
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <span>{profile._count.invitations} invitations</span>
                  <span>{profile._count.completedInvitations} completed</span>
                </div>
              </div>
            ))}
          </div>

          {filteredProfiles.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No job profiles found
              </h3>
              <p className="mb-4 text-gray-500">
                {searchTerm || departmentFilter !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : 'Create your first job profile to get started.'}
              </p>
              {!searchTerm && departmentFilter === 'all' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
                >
                  Create Job Profile
                </button>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'invitations' && (
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Job Profile
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invitation.candidateName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invitation.candidateEmail}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {invitation.jobProfile?.name || 'Unknown Profile'}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {getStatusBadge(invitation.status)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {invitation.testAttempts?.filter(
                          (a) => a.status === 'COMPLETED'
                        ).length || 0}{' '}
                        / {invitation.testAttempts?.length || 0} tests
                      </div>
                      <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{
                            width: `${invitation.testAttempts?.length ? (invitation.testAttempts.filter((a) => a.status === 'COMPLETED').length / invitation.testAttempts.length) * 100 : 0}%`,
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button className="mr-3 text-brand-600 hover:text-brand-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <div className="relative inline-block">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenInvitationDropdown(
                              openInvitationDropdown === invitation.id
                                ? null
                                : invitation.id
                            );
                          }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openInvitationDropdown === invitation.id && (
                          <div className="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
                            <button
                              onClick={() => {
                                handleDeleteInvitation(invitation);
                              }}
                              disabled={processing}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Invitation
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {invitations.length === 0 && (
            <div className="py-12 text-center">
              <Mail className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No invitations yet
              </h3>
              <p className="text-gray-500">
                Start by creating job profiles and sending invitations to
                candidates.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'publicLinks' && (
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Link Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {publicLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-sm text-gray-500">
                            {link.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {link.test.title}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          link.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {link.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {link.usedCount} / {link.maxUses || '∞'} uses
                      </div>
                      {link.expiresAt && (
                        <div className="text-sm text-gray-500">
                          Expires: {formatDate(new Date(link.expiresAt))}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(link.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `${window.location.origin}/public-test/${link.linkToken}`
                          )
                        }
                        className="mr-3 text-brand-600 hover:text-brand-900"
                        title="Copy link"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          window.open(
                            `${window.location.origin}/public-test/${link.linkToken}`,
                            '_blank'
                          )
                        }
                        className="mr-3 text-brand-600 hover:text-brand-900"
                        title="Open link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {publicLinks.length === 0 && (
            <div className="py-12 text-center">
              <ExternalLink className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No public links yet
              </h3>
              <p className="mb-4 text-gray-500">
                Create public links from job profile dropdown menus to allow
                anonymous access to tests.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Profile Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {showCreateModal ? 'Create Job Profile' : 'Edit Job Profile'}
            </h2>

            <form
              onSubmit={
                showCreateModal ? handleCreateProfile : handleUpdateProfile
              }
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Profile Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Positions *
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-3">
                    {positions.map((position) => (
                      <label
                        key={position.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.positionIds.includes(position.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                positionIds: [
                                  ...formData.positionIds,
                                  position.id,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                positionIds: formData.positionIds.filter(
                                  (id) => id !== position.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700">
                          {position.name} ({position.code})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Tests *
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-3">
                    {tests.map((test) => (
                      <label
                        key={test.id}
                        className="flex items-center space-x-2 py-1"
                      >
                        <input
                          type="checkbox"
                          checked={formData.testIds.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                testIds: [...formData.testIds, test.id],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                testIds: formData.testIds.filter(
                                  (id) => id !== test.id
                                ),
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="text-sm text-gray-700">
                          {test.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {processing
                    ? 'Saving...'
                    : showCreateModal
                      ? 'Create'
                      : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Invitation Modal */}
      {showInviteModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Send Invitation - {selectedProfile.name}
            </h2>

            <form onSubmit={handleSendInvitation}>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Candidate Email *
                  </label>
                  <input
                    type="email"
                    value={invitationData.candidateEmail}
                    onChange={(e) =>
                      setInvitationData({
                        ...invitationData,
                        candidateEmail: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={invitationData.candidateName}
                    onChange={(e) =>
                      setInvitationData({
                        ...invitationData,
                        candidateName: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Expires in (days)
                  </label>
                  <select
                    value={invitationData.expiresInDays}
                    onChange={(e) =>
                      setInvitationData({
                        ...invitationData,
                        expiresInDays: parseInt(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  >
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Custom Message
                  </label>
                  <textarea
                    value={invitationData.customMessage}
                    onChange={(e) =>
                      setInvitationData({
                        ...invitationData,
                        customMessage: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                    placeholder="Optional custom message for the candidate..."
                  />
                </div>

                {/* Profile Summary */}
                <div className="rounded-lg bg-gray-50 p-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Profile Summary
                  </h4>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Tests:</strong>{' '}
                      {selectedProfile.tests?.length || 0}
                    </p>
                    <p>
                      <strong>Positions:</strong>{' '}
                      {selectedProfile.positions
                        ?.map((p) => p.name)
                        .join(', ') || 'No positions assigned'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetInvitationForm();
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {processing ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
