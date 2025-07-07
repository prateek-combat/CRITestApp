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
  Clock,
} from 'lucide-react';
import { parseMultipleEmails } from '@/lib/validation-utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { designSystem, componentStyles } from '@/lib/design-system';
import TimeSlotModal from '@/components/ui/TimeSlotModal';

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

interface TimeSlot {
  id: string;
  name: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  createdAt: string;
  jobProfile: {
    id: string;
    name: string;
  };
  publicTestLinks: Array<{
    id: string;
    title: string;
    isActive: boolean;
    usedCount: number;
  }>;
  _count: {
    publicTestLinks: number;
  };
}

export default function JobProfilesPage() {
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);

  // Add time slots state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [showTimeSlotLinks, setShowTimeSlotLinks] = useState(false);
  const [timeSlotLinks, setTimeSlotLinks] = useState<any[]>([]);
  // Store all time slot links for display in the UI
  const [allTimeSlotLinks, setAllTimeSlotLinks] = useState<any[]>([]);

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
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
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
  const [generatingTimeSlotLink, setGeneratingTimeSlotLink] = useState(false);

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

  // Helper function to get links for a specific time slot
  const getLinksForTimeSlot = useCallback(
    (timeSlotId: string) => {
      return allTimeSlotLinks.filter((link) => link.timeSlotId === timeSlotId);
    },
    [allTimeSlotLinks]
  );

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

  const fetchTimeSlots = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/time-slots');
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to fetch time slots' }));
        throw new Error(errorData.error || 'Failed to fetch time slots');
      }
      const data = await response.json();
      setTimeSlots(data);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch time slots';

      // Don't show error for temporary database connection issues
      if (
        errorMessage.includes('Database connection temporarily unavailable')
      ) {
        console.warn(
          'Database temporarily unavailable for time slots, will retry...'
        );
        // Optionally retry after a delay
        setTimeout(() => {
          fetchTimeSlots();
        }, 5000);
      } else {
        // Only set error for non-temporary issues
        console.error('Time slots error:', errorMessage);
      }
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

  const fetchAllTimeSlotLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/time-slot-links');
      if (!response.ok) throw new Error('Failed to fetch time slot links');
      const data = await response.json();
      setAllTimeSlotLinks(data);
    } catch (err) {
      console.error('Failed to fetch time slot links:', err);
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
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
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
    fetchTimeSlots,
    fetchAllTimeSlotLinks,
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

  const openTimeSlotModal = (profile: JobProfile) => {
    setSelectedProfile(profile);
    setShowTimeSlotModal(true);
  };

  const handleCreateTimeSlot = async (
    timeSlotData: Omit<
      TimeSlot,
      | 'id'
      | 'currentParticipants'
      | 'isActive'
      | 'createdAt'
      | 'jobProfile'
      | 'publicTestLinks'
      | '_count'
    >
  ) => {
    if (!selectedProfile) return;

    const payload = {
      jobProfileId: selectedProfile.id,
      ...timeSlotData,
    };

    try {
      const response = await fetch('/api/admin/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create time slot');
      }

      // Refresh data after creating time slot
      await fetchJobProfiles();
    } catch (err) {
      throw err; // Re-throw to be handled by the modal
    }
  };

  const generateTimeSlotLink = async (
    profileId: string,
    timeSlotId: string
  ) => {
    setGeneratingTimeSlotLink(true);
    try {
      const response = await fetch(
        `/api/admin/job-profiles/${profileId}/time-slot-link`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeSlotId }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || 'Failed to generate time-restricted link'
        );
      }

      const result = await response.json();

      // Store the generated links and show them
      setTimeSlotLinks(result.links);
      setSelectedTimeSlot(timeSlots.find((ts) => ts.id === timeSlotId) || null);
      setShowTimeSlotLinks(true);

      // Refresh data
      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate time-restricted link'
      );
    } finally {
      setGeneratingTimeSlotLink(false);
    }
  };

  const deleteTimeSlotLink = async (linkId: string) => {
    try {
      const response = await fetch(
        `/api/admin/time-slot-links?linkId=${linkId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete time-restricted link');
      }

      // Remove the deleted link from the current view
      setTimeSlotLinks((prev) => prev.filter((link) => link.id !== linkId));
      setAllTimeSlotLinks((prev) => prev.filter((link) => link.id !== linkId));

      // Refresh data
      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete time-restricted link'
      );
    }
  };

  const deleteAllTimeSlotLinks = async (timeSlotId: string) => {
    try {
      const response = await fetch(
        `/api/admin/time-slot-links?timeSlotId=${timeSlotId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || 'Failed to delete time-restricted links'
        );
      }

      const result = await response.json();

      // Clear the current view
      setTimeSlotLinks([]);
      setShowTimeSlotLinks(false);

      // Refresh data
      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);

      // Show success message
      alert(
        `Successfully deleted ${result.deletedCount} time-restricted links`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete time-restricted links'
      );
    }
  };

  const deleteTimeSlot = async (timeSlot: TimeSlot) => {
    const hasLinks = timeSlot._count.publicTestLinks > 0;
    const hasUsage = timeSlot.publicTestLinks.some(
      (link) => link.usedCount > 0
    );

    let warningMessage = `Are you sure you want to delete the time slot "${timeSlot.name}"?`;

    if (hasUsage) {
      warningMessage +=
        '\n\n⚠️ This time slot has test attempts and cannot be deleted. Please contact an administrator if you need to remove it.';
    } else if (hasLinks) {
      warningMessage += `\n\nThis will also delete ${timeSlot._count.publicTestLinks} associated test links.`;
    }

    warningMessage += '\n\nThis action cannot be undone.';

    showConfirmation(
      {
        title: 'Delete Time Slot',
        message: warningMessage,
        confirmText: hasUsage ? 'Cannot Delete' : 'Delete Time Slot',
        type: 'danger',
      },
      async () => {
        if (hasUsage) {
          setError('Cannot delete time slot with existing test attempts');
          return;
        }

        try {
          const response = await fetch(
            `/api/admin/time-slots?timeSlotId=${timeSlot.id}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete time slot');
          }

          const result = await response.json();

          // Refresh data
          await Promise.all([
            fetchJobProfiles(),
            fetchTimeSlots(),
            fetchAllTimeSlotLinks(),
          ]);

          // Time slot deleted successfully
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to delete time slot'
          );
          throw err; // Re-throw to keep the dialog open on error
        }
      }
    );
  };

  const handleTimeSlotCreated = async () => {
    await fetchTimeSlots();
    setShowTimeSlotModal(false);
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
                          onClick={() => openTimeSlotModal(profile)}
                          className={designSystem.button.iconButton}
                          title="Create Time Slot"
                        >
                          <Clock className="h-4 w-4" />
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
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              🔗 Public Links
                            </h4>
                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800">
                              {
                                publicLinks.filter((link) =>
                                  (profile.tests || []).some(
                                    (test) => test.title === link.testTitle
                                  )
                                ).length
                              }
                            </span>
                          </div>
                          <div className="space-y-1">
                            {publicLinks
                              .filter((link) =>
                                (profile.tests || []).some(
                                  (test) => test.title === link.testTitle
                                )
                              )
                              .map((link) => (
                                <div
                                  key={link.id}
                                  className="rounded border border-blue-200 bg-blue-50/30 p-2 text-xs"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <div
                                          className={`h-2 w-2 rounded-full ${link.isActive ? 'animate-pulse bg-green-500' : 'bg-gray-400'}`}
                                        ></div>
                                        <span className="truncate text-xs font-medium text-gray-900">
                                          {link.testTitle}
                                        </span>
                                        <span
                                          className={`rounded px-1 py-0.5 text-xs ${link.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                          {link.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                        </span>
                                      </div>
                                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-600">
                                        <span className="flex items-center gap-1">
                                          <span className="font-medium">
                                            {link.usedCount}
                                          </span>
                                          {link.maxUses && (
                                            <span>/{link.maxUses}</span>
                                          )}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          {link.expiresAt
                                            ? 'Expires'
                                            : 'No expiry'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <input
                                          type="text"
                                          value={link.publicUrl}
                                          readOnly
                                          className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 font-mono text-xs text-gray-700"
                                        />
                                        <button
                                          onClick={() =>
                                            copyToClipboard(
                                              link.publicUrl,
                                              link.id
                                            )
                                          }
                                          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                        >
                                          {copiedLink === link.id ? (
                                            <Check className="h-3 w-3" />
                                          ) : (
                                            <Copy className="h-3 w-3" />
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
                              <div className="rounded border-dashed border-gray-300 bg-gray-50 py-2 text-center text-gray-500">
                                <ExternalLink className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                                <p className="text-xs">No links yet</p>
                                <p className="text-xs">
                                  Click "Generate Public Link"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Time Slots Section */}
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-900">
                              ⏰ Time Slots
                            </h4>
                            <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-800">
                              {
                                timeSlots.filter(
                                  (slot) => slot.jobProfile.id === profile.id
                                ).length
                              }
                            </span>
                          </div>
                          <div className="space-y-1">
                            {timeSlots
                              .filter(
                                (slot) => slot.jobProfile.id === profile.id
                              )
                              .map((slot) => (
                                <div
                                  key={slot.id}
                                  className="rounded border border-purple-200 bg-purple-50/30 p-2 text-xs"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="min-w-0 flex-1">
                                      <div className="mb-1 flex items-center gap-2">
                                        <div
                                          className={`h-2 w-2 rounded-full ${
                                            slot.isActive &&
                                            new Date(slot.startDateTime) <=
                                              new Date() &&
                                            new Date() <=
                                              new Date(slot.endDateTime)
                                              ? 'animate-pulse bg-green-500'
                                              : slot.isActive
                                                ? 'bg-yellow-500'
                                                : 'bg-gray-400'
                                          }`}
                                        ></div>
                                        <span className="truncate text-xs font-medium text-gray-900">
                                          {slot.name}
                                        </span>
                                        <span
                                          className={`rounded px-1 py-0.5 text-xs ${
                                            slot.isActive
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {slot.isActive
                                            ? 'Active'
                                            : 'Inactive'}
                                        </span>
                                      </div>
                                      {slot.description && (
                                        <p className="mb-1 truncate text-xs text-gray-600">
                                          {slot.description}
                                        </p>
                                      )}
                                      <div className="mb-1 text-xs text-gray-600">
                                        <div className="mb-0.5 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          <span className="truncate">
                                            {new Date(
                                              slot.startDateTime
                                            ).toLocaleDateString()}{' '}
                                            {new Date(
                                              slot.startDateTime
                                            ).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                            {' → '}
                                            {new Date(
                                              slot.endDateTime
                                            ).toLocaleDateString()}{' '}
                                            {new Date(
                                              slot.endDateTime
                                            ).toLocaleTimeString([], {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {slot.currentParticipants}
                                            {slot.maxParticipants &&
                                              `/${slot.maxParticipants}`}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <ExternalLink className="h-3 w-3" />
                                            {slot._count?.publicTestLinks || 0}
                                          </span>
                                        </div>
                                      </div>
                                      {/* Time Slot Links */}
                                      {(() => {
                                        const slotLinks = getLinksForTimeSlot(
                                          slot.id
                                        );
                                        return (
                                          <div className="mt-1">
                                            {slotLinks.length > 0 ? (
                                              <div className="space-y-1">
                                                <h5 className="text-xs font-medium text-gray-700">
                                                  Links:
                                                </h5>
                                                {slotLinks.map((link) => (
                                                  <div
                                                    key={link.id}
                                                    className="flex items-center justify-between rounded border border-purple-200 bg-white/70 p-1.5"
                                                  >
                                                    <div className="min-w-0 flex-1">
                                                      <p className="truncate text-xs font-medium text-gray-900">
                                                        {link.testTitle}
                                                      </p>
                                                      <p className="text-xs text-gray-600">
                                                        Used {link.usedCount}x
                                                      </p>
                                                    </div>
                                                    <div className="ml-2 flex items-center gap-1">
                                                      <button
                                                        onClick={() =>
                                                          copyToClipboard(
                                                            link.publicUrl,
                                                            link.id
                                                          )
                                                        }
                                                        className="inline-flex items-center gap-1 rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-50"
                                                      >
                                                        {copiedLink ===
                                                        link.id ? (
                                                          <Check className="h-3 w-3 text-green-600" />
                                                        ) : (
                                                          <Copy className="h-3 w-3" />
                                                        )}
                                                      </button>
                                                      <button
                                                        onClick={() => {
                                                          if (
                                                            confirm(
                                                              'Delete this link?'
                                                            )
                                                          ) {
                                                            deleteTimeSlotLink(
                                                              link.id
                                                            );
                                                          }
                                                        }}
                                                        className="inline-flex items-center gap-1 rounded bg-red-600 px-1.5 py-0.5 text-xs text-white hover:bg-red-700"
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="mt-1 rounded border-dashed border-purple-300 bg-purple-50/50 py-1 text-center">
                                                <p className="text-xs text-gray-600">
                                                  No links yet
                                                </p>
                                              </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="mt-1 flex items-center gap-1">
                                              <button
                                                onClick={() =>
                                                  generateTimeSlotLink(
                                                    profile.id,
                                                    slot.id
                                                  )
                                                }
                                                disabled={
                                                  generatingTimeSlotLink
                                                }
                                                className="inline-flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-xs text-white hover:bg-purple-700 disabled:opacity-50"
                                              >
                                                {generatingTimeSlotLink ? (
                                                  <>
                                                    <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                                                    Gen...
                                                  </>
                                                ) : (
                                                  <>
                                                    <ExternalLink className="h-3 w-3" />
                                                    Generate
                                                  </>
                                                )}
                                              </button>
                                              {slotLinks.length > 0 && (
                                                <button
                                                  onClick={() => {
                                                    if (
                                                      confirm(
                                                        `Delete all ${slotLinks.length} links for "${slot.name}"?`
                                                      )
                                                    ) {
                                                      deleteAllTimeSlotLinks(
                                                        slot.id
                                                      );
                                                    }
                                                  }}
                                                  className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                  All
                                                </button>
                                              )}
                                              <button
                                                onClick={() =>
                                                  deleteTimeSlot(slot)
                                                }
                                                className="inline-flex items-center gap-1 rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                                Slot
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            {timeSlots.filter(
                              (slot) => slot.jobProfile.id === profile.id
                            ).length === 0 && (
                              <div className="rounded border-dashed border-gray-300 bg-gray-50 py-2 text-center text-gray-500">
                                <Clock className="mx-auto mb-1 h-4 w-4 text-gray-400" />
                                <p className="text-xs">No time slots yet</p>
                                <p className="text-xs">
                                  Click clock icon to create
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

        {/* Time Slot Modal */}
        <TimeSlotModal
          isOpen={showTimeSlotModal}
          onClose={() => {
            setShowTimeSlotModal(false);
            setSelectedProfile(null);
          }}
          onSubmit={handleCreateTimeSlot}
          jobProfileId={selectedProfile?.id || ''}
          jobProfileName={selectedProfile?.name || ''}
        />

        {/* Time Slot Links Modal */}
        {showTimeSlotLinks && selectedTimeSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Time-Restricted Test Links
                  </h2>
                  <p className="text-sm text-gray-600">
                    Links for "{selectedTimeSlot.name}" -{' '}
                    {selectedTimeSlot.jobProfile.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Active:{' '}
                    {new Date(selectedTimeSlot.startDateTime).toLocaleString()}{' '}
                    - {new Date(selectedTimeSlot.endDateTime).toLocaleString()}{' '}
                    ({selectedTimeSlot.timezone})
                  </p>
                </div>
                <button
                  onClick={() => setShowTimeSlotLinks(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                {timeSlotLinks.map((link, index) => (
                  <div
                    key={link.id}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {link.testTitle}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {link.title}
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                          <span>Used: {link.usedCount} times</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                              link.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {link.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {link.isExisting && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                              Existing Link
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            copyToClipboard(link.publicUrl, link.id)
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {copiedLink === link.id ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copy Link
                            </>
                          )}
                        </button>
                        <a
                          href={link.publicUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </a>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                'Are you sure you want to delete this time-restricted link?'
                              )
                            ) {
                              deleteTimeSlotLink(link.id);
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border-2 border-red-700/50 bg-gradient-to-r from-red-600 to-red-700 px-3 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-xl"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 rounded bg-gray-50 p-2">
                      <p className="break-all font-mono text-xs text-gray-600">
                        {link.publicUrl}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-600">
                  <p>
                    <strong>Share these links:</strong> Send to candidates who
                    should take the test during the specified time window.
                  </p>
                  <p className="mt-1">
                    <strong>Note:</strong> Links will only work during the
                    active time slot ({selectedTimeSlot.timezone}).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {timeSlotLinks.length > 0 && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to delete all ${timeSlotLinks.length} time-restricted links for this time slot?`
                          )
                        ) {
                          deleteAllTimeSlotLinks(selectedTimeSlot.id);
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border-2 border-red-700/50 bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-red-700 hover:to-red-800 hover:shadow-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete All Links
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowTimeSlotLinks(false);
                      deleteTimeSlot(selectedTimeSlot);
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-gray-700/50 bg-gradient-to-r from-gray-600 to-gray-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-gray-700 hover:to-gray-800 hover:shadow-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Time Slot
                  </button>
                  <button
                    onClick={() => setShowTimeSlotLinks(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
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
