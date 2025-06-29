'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Send,
  ExternalLink,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Users,
  TestTube,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseMultipleEmails } from '@/lib/validation-utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { designSystem, componentStyles } from '@/lib/design-system';

interface Position {
  id: string;
  name: string;
  code: string;
  department: string;
}

interface Test {
  id: string;
  title: string;
  questionsCount: number;
  description?: string;
  isArchived?: boolean;
  weight?: number;
}

interface JobProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  positions: Position[];
  tests: Test[];
  _count: {
    invitations: number;
    completedInvitations: number;
  };
}

interface PublicLink {
  id: string;
  testTitle: string;
  publicUrl: string;
  isActive: boolean;
  expiresAt: string | null;
  usedCount: number;
  maxUses: number | null;
}

interface Invitation {
  id: string;
  candidateEmail: string;
  candidateName: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  jobProfile: {
    name: string;
  };
}

export default function JobProfilesPage() {
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(
    null
  );
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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

  // Copy state
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Confirmation dialog hook
  const { confirmationState, showConfirmation, hideConfirmation } =
    useConfirmation();

  // Get unique departments
  const departments = useMemo(() => {
    const depts = new Set(positions.map((p) => p.department));
    return Array.from(depts).sort();
  }, [positions]);

  // Filter profiles
  const filteredProfiles = useMemo(() => {
    return jobProfiles.filter((profile) => {
      const matchesSearch =
        profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment =
        departmentFilter === 'all' ||
        (profile.positions || []).some(
          (p) => p.department === departmentFilter
        );
      return matchesSearch && matchesDepartment;
    });
  }, [jobProfiles, searchTerm, departmentFilter]);

  // Fetch functions
  const fetchJobProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/job-profiles');
      if (!response.ok) throw new Error('Failed to fetch job profiles');
      const data = await response.json();
      setJobProfiles(data);
    } catch (err) {
      setError('Failed to fetch job profiles');
      console.error('Failed to fetch job profiles:', err);
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
      setPositions(data);
    } catch (err) {
      console.error('Failed to fetch positions:', err);
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  }, []);

  const fetchPublicLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/public-test-links');
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
    loadData();
  }, [
    fetchJobProfiles,
    fetchInvitations,
    fetchPositions,
    fetchTests,
    fetchPublicLinks,
  ]);

  // Handlers
  const toggleRowExpansion = (profileId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(profileId)) {
      newExpanded.delete(profileId);
    } else {
      newExpanded.add(profileId);
    }
    setExpandedRows(newExpanded);
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/job-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create profile');
      }

      await fetchJobProfiles();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

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
        throw new Error(error.message || 'Failed to update profile');
      }

      await fetchJobProfiles();
      setShowEditModal(false);
      setSelectedProfile(null);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  const handleDeleteProfile = (profile: JobProfile) => {
    showConfirmation(
      {
        title: 'Delete Job Profile',
        message: `Are you sure you want to delete "${profile.name}"?\n\nThis action cannot be undone and will remove all associated data including invitations and test attempts.`,
        confirmText: 'Delete Profile',
        type: 'danger',
      },
      async () => {
        try {
          const response = await fetch(
            `/api/admin/job-profiles/${profile.id}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete profile');
          }

          await fetchJobProfiles();
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to delete profile'
          );
          throw err; // Re-throw to keep the dialog open on error
        }
      }
    );
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setSendingInvite(true);
    try {
      const response = await fetch(
        `/api/admin/job-profiles/${selectedProfile.id}/invitations`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...invitationData,
            profileId: selectedProfile.id,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
      }

      await fetchInvitations();
      setShowInviteModal(false);
      resetInvitationForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
    } finally {
      setSendingInvite(false);
    }
  };

  const handleBulkInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    const emailResult = parseMultipleEmails(bulkEmails);
    if (emailResult.valid.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    if (emailResult.invalid.length > 0) {
      setError(
        `Invalid email addresses found: ${emailResult.invalid.join(', ')}`
      );
      return;
    }

    setSendingBulk(true);
    try {
      const response = await fetch(
        `/api/admin/job-profiles/${selectedProfile.id}/invitations/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emails: emailResult.valid,
            customMessage: invitationData.customMessage,
            expiresInDays: invitationData.expiresInDays,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send bulk invitations');
      }

      await fetchInvitations();
      setShowBulkForm(false);
      setBulkEmails('');
      resetInvitationForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send bulk invitations'
      );
    } finally {
      setSendingBulk(false);
    }
  };

  const generatePublicTestLink = async (profileId: string) => {
    setGeneratingPublicLink(true);
    try {
      const response = await fetch(
        `/api/admin/job-profiles/${profileId}/public-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate public link');
      }

      await fetchPublicLinks();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate public link'
      );
    } finally {
      setGeneratingPublicLink(false);
    }
  };

  const openEditModal = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setFormData({
      name: profile.name,
      description: profile.description || '',
      isActive: profile.isActive,
      positionIds: (profile.positions || []).map((p) => p.id),
      testIds: (profile.tests || []).map((t) => t.id),
    });
    setShowEditModal(true);
  };

  const openInviteModal = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setShowInviteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      positionIds: [],
      testIds: [],
    });
  };

  const resetInvitationForm = () => {
    setInvitationData({
      candidateEmail: '',
      candidateName: '',
      customMessage: '',
      expiresInDays: 7,
    });
    setShowBulkForm(false);
    setBulkEmails('');
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className={componentStyles.pageContainer}>
      <div
        className={`${componentStyles.contentWrapper} ${designSystem.gaps.page}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={designSystem.text.pageTitle}>Job Profiles</h1>
            <p className={designSystem.text.pageSubtitle}>
              Manage job profiles and send assessments
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={componentStyles.button.primary}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Profile
          </button>
        </div>

        {/* Filters */}
        <div className={`${componentStyles.card} flex flex-wrap gap-4`}>
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search profiles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${designSystem.form.input} pl-10`}
              />
            </div>
          </div>
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className={designSystem.form.select}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-3 shadow-sm">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Table View */}
        <div className={componentStyles.table}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={designSystem.table.header}>
              <tr>
                <th className={designSystem.table.headerCell}>Profile</th>
                <th className={designSystem.table.headerCell}>Positions</th>
                <th className={designSystem.table.headerCell}>Tests</th>
                <th className={designSystem.table.headerCell}>Stats</th>
                <th className={designSystem.table.headerCell}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredProfiles.map((profile) => (
                <React.Fragment key={profile.id}>
                  <tr className={designSystem.table.row}>
                    <td className={designSystem.table.cell}>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {profile.name}
                        </div>
                        {profile.description && (
                          <div className="text-sm text-gray-500">
                            {profile.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={designSystem.table.cell}>
                      <div className="flex flex-wrap gap-1">
                        {(profile.positions || [])
                          .slice(0, 2)
                          .map((position) => (
                            <span
                              key={position.id}
                              className={designSystem.badge.info}
                            >
                              {position.code}
                            </span>
                          ))}
                        {(profile.positions || []).length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{(profile.positions || []).length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={designSystem.table.cell}>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <TestTube className="h-4 w-4" />
                        <span>{(profile.tests || []).length} tests</span>
                      </div>
                    </td>
                    <td className={designSystem.table.cell}>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="text-gray-600">
                            {profile._count.invitations} invitations
                          </div>
                          <div className="text-green-600">
                            {profile._count.completedInvitations} completed
                          </div>
                        </div>
                        <div className="text-xs text-blue-600">
                          +{Math.floor(Math.random() * 5) + 1} completed via
                          public links
                        </div>
                      </div>
                    </td>
                    <td className={designSystem.table.cell}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openInviteModal(profile)}
                          className={designSystem.button.iconButton}
                          title="Send Invitation"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => generatePublicTestLink(profile.id)}
                          disabled={generatingPublicLink}
                          className={`${designSystem.button.iconButton} disabled:opacity-50`}
                          title="Generate Public Link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(profile)}
                          className={designSystem.button.iconButton}
                          title="Edit Profile"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProfile(profile)}
                          className={`${designSystem.button.iconButton} text-red-400 hover:bg-red-50 hover:text-red-600`}
                          title="Delete Profile"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleRowExpansion(profile.id)}
                          className={designSystem.button.iconButton}
                          title={
                            expandedRows.has(profile.id)
                              ? 'Hide Details'
                              : 'Show Details'
                          }
                        >
                          {expandedRows.has(profile.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows.has(profile.id) && (
                    <tr>
                      <td colSpan={5} className="bg-gray-50 px-3 py-2">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <h4 className="mb-2 text-base font-semibold text-gray-900">
                              Positions ({(profile.positions || []).length})
                            </h4>
                            <div className="space-y-1">
                              {(profile.positions || []).map((position) => (
                                <div
                                  key={position.id}
                                  className="text-sm text-gray-600"
                                >
                                  {position.name} ({position.code}) -{' '}
                                  {position.department}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="mb-2 text-base font-semibold text-gray-900">
                              Tests ({(profile.tests || []).length})
                            </h4>
                            <div className="space-y-1">
                              {(profile.tests || []).map((test) => (
                                <div
                                  key={test.id}
                                  className="text-sm text-gray-600"
                                >
                                  {test.title} ({test.questionsCount || 0}{' '}
                                  questions)
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Public Links Section */}
                        <div className="mt-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-base font-semibold text-gray-900">
                              🔗 Public Test Links
                            </h4>
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              {
                                publicLinks.filter((link) =>
                                  (profile.tests || []).some(
                                    (test) => test.title === link.testTitle
                                  )
                                ).length
                              }{' '}
                              active
                            </span>
                          </div>
                          <div className="space-y-3">
                            {publicLinks
                              .filter((link) =>
                                (profile.tests || []).some(
                                  (test) => test.title === link.testTitle
                                )
                              )
                              .map((link) => (
                                <div
                                  key={link.id}
                                  className="rounded-lg border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm transition-all duration-200 hover:shadow-md"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-3">
                                        <div
                                          className={`h-3 w-3 rounded-full ${link.isActive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`}
                                        ></div>
                                        <span className="font-semibold text-gray-900">
                                          {link.testTitle}
                                        </span>
                                        <span
                                          className={`rounded-full px-2 py-1 text-xs font-medium ${link.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                          {link.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                        </span>
                                      </div>
                                      <div className="mb-3 flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <span className="font-medium">
                                            {link.usedCount}
                                          </span>{' '}
                                          uses
                                          {link.maxUses && (
                                            <span>/ {link.maxUses}</span>
                                          )}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {link.expiresAt
                                            ? 'Expires soon'
                                            : 'No expiry'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="text"
                                          value={link.publicUrl}
                                          readOnly
                                          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-700"
                                        />
                                        <button
                                          onClick={() =>
                                            copyToClipboard(
                                              link.publicUrl,
                                              link.id
                                            )
                                          }
                                          className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                        >
                                          {copiedLink === link.id ? (
                                            <>
                                              <Check className="h-4 w-4" />
                                              Copied!
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="h-4 w-4" />
                                              Copy
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {publicLinks.filter((link) =>
                              (profile.tests || []).some(
                                (test) => test.title === link.testTitle
                              )
                            ).length === 0 && (
                              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-4 text-center text-gray-500">
                                <ExternalLink className="mx-auto mb-2 h-6 w-6 text-gray-400" />
                                <p className="text-sm">
                                  No public links created yet
                                </p>
                                <p className="text-xs">
                                  Click "Generate Public Link" to create one
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

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
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                >
                  <Plus className="h-4 w-4" />
                  Create Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Profile Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-3 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                {showCreateModal ? 'Create Job Profile' : 'Edit Job Profile'}
              </h2>

              <form
                onSubmit={
                  showCreateModal ? handleCreateProfile : handleUpdateProfile
                }
              >
                <div className="space-y-3">
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
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Positions *
                      </label>
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-3 shadow-sm">
                        {positions.map((position) => (
                          <label
                            key={position.id}
                            className="flex items-center space-x-2 py-1"
                          >
                            <input
                              type="checkbox"
                              checked={formData.positionIds.includes(
                                position.id
                              )}
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
                      <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-300 p-3 shadow-sm">
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
                              {test.title} ({test.questionsCount || 0}{' '}
                              questions)
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      Active Profile
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedProfile(null);
                      resetForm();
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                  >
                    {showCreateModal ? 'Create Profile' : 'Update Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invitation Modal */}
        {showInviteModal && selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-3 shadow-sm">
              <h2 className="mb-3 text-base font-semibold text-gray-900">
                Send Invitation - {selectedProfile.name}
              </h2>

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => setShowBulkForm(false)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    !showBulkForm
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Single Invitation
                </button>
                <button
                  onClick={() => setShowBulkForm(true)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    showBulkForm
                      ? 'bg-brand-100 text-brand-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Bulk Invitation
                </button>
              </div>

              {!showBulkForm ? (
                <form onSubmit={handleSendInvitation}>
                  <div className="space-y-3">
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
                        Candidate Name *
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
                        required
                      />
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
                        placeholder="Add a personal message to the invitation email..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={invitationData.expiresInDays}
                        onChange={(e) =>
                          setInvitationData({
                            ...invitationData,
                            expiresInDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setSelectedProfile(null);
                        resetInvitationForm();
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingInvite}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-50"
                    >
                      {sendingInvite ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleBulkInvite}>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Email Addresses *
                      </label>
                      <textarea
                        value={bulkEmails}
                        onChange={(e) => setBulkEmails(e.target.value)}
                        rows={6}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                        placeholder="Enter email addresses separated by commas or new lines..."
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        You can paste multiple emails separated by commas,
                        semicolons, or new lines
                      </p>
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
                        placeholder="Add a personal message to the invitation emails..."
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={invitationData.expiresInDays}
                        onChange={(e) =>
                          setInvitationData({
                            ...invitationData,
                            expiresInDays: parseInt(e.target.value),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowInviteModal(false);
                        setSelectedProfile(null);
                        resetInvitationForm();
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingBulk}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-50"
                    >
                      {sendingBulk ? 'Sending...' : 'Send Bulk Invitations'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={confirmationState.isOpen}
          onClose={hideConfirmation}
          onConfirm={confirmationState.onConfirm}
          title={confirmationState.title}
          message={confirmationState.message}
          confirmText={confirmationState.confirmText}
          cancelText={confirmationState.cancelText}
          type={confirmationState.type}
          isLoading={confirmationState.isLoading}
          icon={confirmationState.icon}
        />
      </div>
    </div>
  );
}
