'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  X,
  AlertCircle,
  Loader2,
  Building2,
} from 'lucide-react';
import { parseMultipleEmails } from '@/lib/validation-utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { designSystem } from '@/lib/design-system';
import TimeSlotModal from '@/components/ui/TimeSlotModal';

// Import new components
import JobProfileCard from '@/components/admin/job-profiles/JobProfileCard';
import JobProfileDetailsModal from '@/components/admin/job-profiles/JobProfileDetailsModal';
import LinkBuilder from '@/components/admin/job-profiles/LinkBuilder';
import ImprovedInviteModal from '@/components/admin/job-profiles/ImprovedInviteModal';
import SuccessNotification from '@/components/ui/SuccessNotification';

// Types
interface Test {
  id: string;
  title: string;
  questionsCount: number;
  description?: string;
  isArchived?: boolean;
  weight?: number;
}

interface TestWeight {
  testId: string;
  weight: number;
  test: Test;
}

interface JobProfile {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  tests?: Test[];
  testWeights?: TestWeight[];
  _count: {
    invitations: number;
    completedInvitations?: number;
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
  linkToken?: string;
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
    publicUrl: string;
    testTitle: string;
  }>;
  _count?: {
    publicTestLinks: number;
  };
}

interface TimeSlotLink {
  id: string;
  testTitle: string;
  publicUrl: string;
  usedCount: number;
  timeSlot: {
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
  };
}

export default function JobProfilesPage() {
  // State Management
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [publicLinks, setPublicLinks] = useState<PublicLink[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [allTimeSlotLinks, setAllTimeSlotLinks] = useState<TimeSlotLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  // Modal States
  const [selectedProfile, setSelectedProfile] = useState<JobProfile | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [showLinkBuilder, setShowLinkBuilder] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    testIds: [] as string[],
    notificationEmails: '',
  });

  const [invitationData, setInvitationData] = useState({
    candidateEmail: '',
    candidateName: '',
    customMessage: '',
    expiresInDays: 7,
  });

  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalKey, setModalKey] = useState(0); // Force modal refresh

  // Confirmation Dialog
  const { confirmationState, showConfirmation, hideConfirmation } =
    useConfirmation();

  // Data Fetching
  const fetchJobProfiles = useCallback(async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/job-profiles');
      if (!response.ok) throw new Error('Failed to fetch job profiles');
      const data = await response.json();
      setJobProfiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch job profiles'
      );
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data.filter((test: Test) => !test.isArchived));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    }
  }, []);

  const fetchPublicLinks = useCallback(async () => {
    try {
      const response = await fetchWithCSRF('/api/public-test-links');
      if (!response.ok) throw new Error('Failed to fetch public links');
      const data = await response.json();
      setPublicLinks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch public links'
      );
    }
  }, []);

  const fetchTimeSlots = useCallback(async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/time-slots');
      if (!response.ok) throw new Error('Failed to fetch time slots');
      const data = await response.json();
      setTimeSlots(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch time slots'
      );
    }
  }, []);

  const fetchAllTimeSlotLinks = useCallback(async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/time-slot-links');
      if (!response.ok) throw new Error('Failed to fetch time slot links');
      const data = await response.json();
      setAllTimeSlotLinks(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch time slot links'
      );
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchJobProfiles(),
        fetchTests(),
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Utility Functions
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
  };

  const copyToClipboard = async (text: string, linkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkId);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const getPublicLinksForProfile = (profileId: string) => {
    // Filter public links by job profile ID to ensure each job profile has its own links
    return publicLinks.filter((link: any) => link.jobProfileId === profileId);
  };

  const getTimeSlotsForProfile = (profileId: string) => {
    return timeSlots.filter(
      (slot) => slot.jobProfile && slot.jobProfile.id === profileId
    );
  };

  const getTimeSlotLinksForProfile = (profileId: string) => {
    const profileTimeSlots = getTimeSlotsForProfile(profileId);
    return allTimeSlotLinks.filter(
      (link) =>
        link.timeSlot &&
        profileTimeSlots.some((slot) => slot.id === link.timeSlot.id)
    );
  };

  // Action Handlers
  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetchWithCSRF('/api/admin/job-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create job profile');
      }

      await fetchJobProfiles();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create job profile'
      );
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    try {
      const response = await fetchWithCSRF(
        `/api/admin/job-profiles/${selectedProfile.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update job profile');
      }

      await fetchJobProfiles();
      setShowEditModal(false);
      setSelectedProfile(null);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update job profile'
      );
    }
  };

  const handleDeleteProfile = (profile: JobProfile) => {
    showConfirmation(
      {
        title: 'Delete Job Profile',
        message: `Are you sure you want to delete "${profile.name}"? This will also delete all associated invitations and public links.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
      async () => {
        try {
          const response = await fetchWithCSRF(
            `/api/admin/job-profiles/${profile.id}`,
            {
              method: 'DELETE',
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete job profile');
          }

          await Promise.all([fetchJobProfiles(), fetchPublicLinks()]);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to delete job profile'
          );
        }
      }
    );
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    try {
      const response = await fetchWithCSRF('/api/admin/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invitationData,
          jobProfileId: selectedProfile.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || errorData.message || 'Failed to send invitation'
        );
      }

      await fetchJobProfiles();
      setShowInviteModal(false);
      setSelectedProfile(null);
      resetInvitationForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send invitation'
      );
    }
  };

  const handleSendPersonalizedInvitation = async (data: {
    candidateEmail: string;
    candidateName: string;
    customMessage: string;
    expiresInDays: number;
  }) => {
    if (!selectedProfile) return;

    // Parse multiple emails separated by comma, semicolon, or newline
    const emailDelimiters = /[,;\n]+/;
    const emails = data.candidateEmail
      .split(emailDelimiters)
      .map((e) => e.trim())
      .filter((e) => e);

    if (emails.length === 1) {
      // Single invitation
      try {
        const response = await fetchWithCSRF('/api/admin/invitations/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            jobProfileId: selectedProfile.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || errorData.message || 'Failed to send invitation'
          );
        }

        await fetchJobProfiles();
        setShowInviteModal(false);
        setSelectedProfile(null);
        showSuccessNotification('Personalized invitation sent successfully!');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to send invitation'
        );
      }
    } else {
      // Bulk invitations
      const candidates = emails.map((email, index) => ({
        email,
        name: data.candidateName.includes(',')
          ? data.candidateName.split(',')[index]?.trim() ||
            `Candidate ${index + 1}`
          : `${data.candidateName} ${index + 1}`,
      }));

      try {
        const response = await fetchWithCSRF('/api/admin/invitations/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobProfileId: selectedProfile.id,
            candidates,
            customMessage: data.customMessage,
            expiresInDays: data.expiresInDays,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send bulk invitations');
        }

        const result = await response.json();
        await fetchJobProfiles();
        setShowInviteModal(false);
        setSelectedProfile(null);
        showSuccessNotification(
          `Successfully sent ${result.successCount} invitations!`
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to send invitations'
        );
      }
    }
  };

  const handleSendExistingLink = async (data: {
    candidateEmail: string;
    candidateName: string;
    linkUrl: string;
    linkType: 'public' | 'timeSlot';
    customMessage: string;
    timeSlotInfo?: {
      name: string;
      startDateTime: string;
      endDateTime: string;
    };
  }) => {
    if (!selectedProfile) return;

    // Parse multiple emails separated by comma, semicolon, or newline
    const emailDelimiters = /[,;\n]+/;
    const emails = data.candidateEmail
      .split(emailDelimiters)
      .map((e) => e.trim())
      .filter((e) => e);

    if (emails.length === 1) {
      // Single invitation
      try {
        const response = await fetchWithCSRF(
          '/api/admin/invitations/send-link',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...data,
              jobProfileName: selectedProfile.name,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send invitation');
        }

        const result = await response.json();

        setShowInviteModal(false);
        setSelectedProfile(null);

        // Show success message
        showSuccessNotification(
          result.message ||
            `${data.linkType === 'timeSlot' ? 'Time slot' : 'Public'} link sent successfully to ${data.candidateName}!`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send link');
      }
    } else {
      // Bulk invitations
      const candidates = emails.map((email, index) => ({
        email,
        name: data.candidateName.includes(',')
          ? data.candidateName.split(',')[index]?.trim() ||
            `Candidate ${index + 1}`
          : `${data.candidateName} ${index + 1}`,
      }));

      try {
        const response = await fetchWithCSRF(
          '/api/admin/invitations/bulk-link',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jobProfileName: selectedProfile.name,
              candidates,
              linkUrl: data.linkUrl,
              linkType: data.linkType,
              customMessage: data.customMessage,
              timeSlotInfo: data.timeSlotInfo,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to send bulk invitations');
        }

        const result = await response.json();

        setShowInviteModal(false);
        setSelectedProfile(null);

        showSuccessNotification(
          `Successfully sent ${data.linkType === 'timeSlot' ? 'time slot' : 'public'} link to ${result.successCount} candidates!`
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to send invitations'
        );
      }
    }
  };

  const handleGeneratePublicLink = async (profileId: string) => {
    try {
      const response = await fetchWithCSRF(
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

      const result = await response.json();

      await fetchPublicLinks();

      // Force modal refresh to show new links
      setModalKey((prev) => prev + 1);

      // Show success message
      const profile = jobProfiles.find((p) => p.id === profileId);
      if (profile) {
        const newLinksCount =
          result.links?.filter((link: any) => !link.isExisting).length || 0;
        const existingLinksCount =
          result.links?.filter((link: any) => link.isExisting).length || 0;

        let message = `Generated ${newLinksCount} new public link${newLinksCount !== 1 ? 's' : ''}`;
        if (existingLinksCount > 0) {
          message += ` and found ${existingLinksCount} existing link${existingLinksCount !== 1 ? 's' : ''}`;
        }
        message += ` for ${profile.name}! Check the Links & Invitations tab to copy and share.`;

        showSuccessNotification(message);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate public link'
      );
    }
  };

  const handleGenerateTimeSlotLink = async (
    profileId: string,
    timeSlotId: string
  ) => {
    try {
      const response = await fetchWithCSRF(
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

      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);

      // Force modal refresh to show new links
      setModalKey((prev) => prev + 1);

      // Show success message
      showSuccessNotification(
        'Time slot link generated successfully! Check the details view to copy and share the link.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate time-restricted link'
      );
    }
  };

  const handleCreateTimeSlot = async (timeSlotData: any) => {
    if (!selectedProfile) return;

    try {
      const response = await fetchWithCSRF('/api/admin/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobProfileId: selectedProfile.id,
          ...timeSlotData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create time slot');
      }

      await Promise.all([
        fetchTimeSlots(),
        fetchJobProfiles(),
        fetchAllTimeSlotLinks(), // Also fetch the newly created links
      ]);

      // Force modal refresh to show new time slot and links
      setModalKey((prev) => prev + 1);

      // Show success message
      showSuccessNotification(
        'Time slot created successfully with assessment links!'
      );
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteLink = async (
    linkId: string,
    type: 'public' | 'timeSlot'
  ) => {
    try {
      const endpoint =
        type === 'public'
          ? `/api/public-test-links/admin/${linkId}`
          : `/api/admin/time-slot-links?linkId=${linkId}`;

      const response = await fetchWithCSRF(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${type} link`);
      }

      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);

      // Force modal refresh to show updated links
      setModalKey((prev) => prev + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete ${type} link`
      );
    }
  };

  const handleToggleLink = async (linkId: string) => {
    try {
      // Find the link to get its token
      const link = publicLinks.find((l) => l.id === linkId);
      if (!link) {
        throw new Error('Link not found');
      }

      const response = await fetchWithCSRF(
        `/api/public-test-links/${link.linkToken}/toggle`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle link status');
      }

      const result = await response.json();

      await fetchPublicLinks();

      // Force modal refresh to show updated links
      setModalKey((prev) => prev + 1);

      // Show success message
      showSuccessNotification(
        `Link ${result.isActive ? 'enabled' : 'disabled'} successfully!`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to toggle link status'
      );
    }
  };

  // Form Reset Functions
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      isActive: true,
      testIds: [],
      notificationEmails: '',
    });
  };

  const resetInvitationForm = () => {
    setInvitationData({
      candidateEmail: '',
      candidateName: '',
      customMessage: '',
      expiresInDays: 7,
    });
  };

  // Filter Profiles
  const filteredProfiles = jobProfiles.filter((profile) => {
    const matchesSearch = profile.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesActive = !showActiveOnly || profile.isActive;
    return matchesSearch && matchesActive;
  });

  // Render Loading State
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-slateblue" />
          <p className="text-ink/60">Loading job profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-ink">Job Profiles</h1>
        <p className="text-ink/60">
          Manage job profiles, assessments, and candidate invitations
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-ink/40" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-ink/20 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-slateblue/40 sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
              showActiveOnly
                ? 'border-slateblue/40 bg-slateblue/10 text-slateblue'
                : 'border-ink/20 bg-parchment/80 text-ink/70 hover:bg-parchment'
            }`}
          >
            <Filter className="h-4 w-4" />
            Active Only
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-ink/80 bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-ink/90 hover:shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Create Profile
        </button>
      </div>

      {/* Job Profile Cards Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProfiles.map((profile) => (
            <JobProfileCard
              key={profile.id}
              profile={profile}
              publicLinksCount={getPublicLinksForProfile(profile.id).length}
              timeSlotsCount={getTimeSlotsForProfile(profile.id).length}
              onEdit={(profile) => {
                setSelectedProfile(profile);
                setFormData({
                  name: profile.name,
                  description: profile.description || '',
                  isActive: profile.isActive,
                  testIds:
                    profile.testWeights?.map((tw) => tw.test.id) ||
                    profile.tests?.map((t) => t.id) ||
                    [],
                  notificationEmails:
                    (profile as any).notificationEmails?.join(', ') || '',
                });
                setShowEditModal(true);
              }}
              onDelete={handleDeleteProfile}
              onSendInvitation={(profile) => {
                setSelectedProfile(profile);
                setShowInviteModal(true);
              }}
              onGeneratePublicLink={handleGeneratePublicLink}
              onCreateTimeSlot={(profile) => {
                setSelectedProfile(profile);
                setShowTimeSlotModal(true);
              }}
              onViewDetails={(profile) => {
                setSelectedProfile(profile);
                setShowDetailsModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Building2 className="mx-auto mb-4 h-12 w-12 text-ink/30" />
          <h3 className="mb-2 text-lg font-medium text-ink">
            {searchTerm ? 'No profiles found' : 'No job profiles yet'}
          </h3>
          <p className="mb-4 text-ink/60">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Create your first job profile to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-slateblue px-4 py-2 text-sm font-medium text-white hover:bg-slateblue/80"
            >
              <Plus className="h-4 w-4" />
              Create Profile
            </button>
          )}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedProfile && (
        <JobProfileDetailsModal
          key={modalKey}
          profile={selectedProfile}
          publicLinks={getPublicLinksForProfile(selectedProfile.id)}
          timeSlots={getTimeSlotsForProfile(selectedProfile.id)}
          timeSlotLinks={getTimeSlotLinksForProfile(selectedProfile.id)}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProfile(null);
          }}
          onEdit={(profile) => {
            setShowDetailsModal(false);
            setSelectedProfile(profile);
            setFormData({
              name: profile.name,
              description: profile.description || '',
              isActive: profile.isActive,
              testIds:
                profile.testWeights?.map((tw) => tw.test.id) ||
                profile.tests?.map((t) => t.id) ||
                [],
              notificationEmails:
                (profile as any).notificationEmails?.join(', ') || '',
            });
            setShowEditModal(true);
          }}
          onSendInvitation={(profile) => {
            setShowDetailsModal(false);
            setSelectedProfile(profile);
            setShowInviteModal(true);
          }}
          onGeneratePublicLink={handleGeneratePublicLink}
          onGenerateTimeSlotLink={(timeSlotId) => {
            handleGenerateTimeSlotLink(selectedProfile.id, timeSlotId);
          }}
          onCreateTimeSlot={(profile) => {
            setSelectedProfile(profile);
            setShowTimeSlotModal(true);
          }}
          onDeleteLink={handleDeleteLink}
          onCopyLink={copyToClipboard}
          onToggleLink={handleToggleLink}
          copiedLinkId={copiedLink}
        />
      )}

      {/* Link Builder Modal */}
      {showLinkBuilder && selectedProfile && (
        <LinkBuilder
          jobProfileId={selectedProfile.id}
          jobProfileName={selectedProfile.name}
          tests={
            selectedProfile.testWeights?.map((tw) => tw.test) ||
            selectedProfile.tests ||
            []
          }
          timeSlots={getTimeSlotsForProfile(selectedProfile.id)}
          onCreatePublicLink={async (settings) => {
            // Implement public link creation with settings
            await handleGeneratePublicLink(selectedProfile.id);
          }}
          onCreateTimeSlotLink={async (timeSlotId, testIds) => {
            // Implement time slot link creation
          }}
          onClose={() => {
            setShowLinkBuilder(false);
          }}
        />
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-parchment/80 shadow-xl">
            <form
              onSubmit={
                showCreateModal ? handleCreateProfile : handleUpdateProfile
              }
            >
              <div className="p-6">
                <h2 className="mb-4 text-2xl font-bold text-ink">
                  {showCreateModal ? 'Create Job Profile' : 'Edit Job Profile'}
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink/70">
                      Profile Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slateblue/40"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink/70">
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
                      className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slateblue/40"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink/70">
                      Tests *
                    </label>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-ink/20 p-3">
                      {tests.map((test) => (
                        <label
                          key={test.id}
                          className="flex cursor-pointer items-center gap-2 py-1 hover:bg-parchment"
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
                            className="h-4 w-4 rounded border-ink/20 text-slateblue"
                          />
                          <span className="text-sm text-ink/70">
                            {test.title} ({test.questionsCount || 0} questions)
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-ink/70">
                      Notification Emails
                    </label>
                    <p className="mb-2 text-sm text-ink/50">
                      Enter email addresses (separated by commas or one per
                      line) to receive notifications when tests are completed
                      for this job profile.
                    </p>
                    <textarea
                      value={formData.notificationEmails || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationEmails: e.target.value,
                        })
                      }
                      rows={4}
                      placeholder="admin@company.com, hr@company.com&#10;manager@company.com"
                      className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slateblue/40"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-ink/20 text-slateblue"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-ink/70"
                    >
                      Active Profile
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-ink/10 bg-parchment px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedProfile(null);
                    resetForm();
                  }}
                  className="rounded-lg border border-ink/20 bg-parchment/80 px-4 py-2 text-sm font-medium text-ink/70 hover:bg-parchment"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-ink/80 bg-ink px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-ink/90 hover:shadow-xl"
                >
                  {showCreateModal ? 'Create Profile' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Improved Invitation Modal */}
      {showInviteModal && selectedProfile && (
        <ImprovedInviteModal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setSelectedProfile(null);
          }}
          jobProfileName={selectedProfile.name}
          publicLinks={getPublicLinksForProfile(selectedProfile.id)}
          timeSlots={getTimeSlotsForProfile(selectedProfile.id)}
          onSendPersonalized={handleSendPersonalizedInvitation}
          onSendExistingLink={handleSendExistingLink}
        />
      )}

      {/* Time Slot Modal */}
      {showTimeSlotModal && selectedProfile && (
        <TimeSlotModal
          isOpen={showTimeSlotModal}
          onClose={() => {
            setShowTimeSlotModal(false);
            setSelectedProfile(null);
          }}
          onSubmit={handleCreateTimeSlot}
          jobProfileId={selectedProfile.id}
          jobProfileName={selectedProfile.name}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationState.isOpen}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        onConfirm={confirmationState.onConfirm}
        onClose={hideConfirmation}
      />

      {/* Success Notification */}
      <SuccessNotification
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
