'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, X, AlertCircle, Loader2 } from 'lucide-react';
import { parseMultipleEmails } from '@/lib/validation-utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import { designSystem } from '@/lib/design-system';
import TimeSlotModal from '@/components/ui/TimeSlotModal';

// Import new components
import JobProfileCard from '@/components/admin/job-profiles/JobProfileCard';
import JobProfileDetailsModal from '@/components/admin/job-profiles/JobProfileDetailsModal';
import LinkBuilder from '@/components/admin/job-profiles/LinkBuilder';

// Types
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
    publicUrl: string;
    usedCount: number;
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

export default function JobProfilesPageImproved() {
  // State Management
  const [jobProfiles, setJobProfiles] = useState<JobProfile[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
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
    positionIds: [] as string[],
    testIds: [] as string[],
  });

  const [invitationData, setInvitationData] = useState({
    candidateEmail: '',
    candidateName: '',
    customMessage: '',
    expiresInDays: 7,
  });

  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Confirmation Dialog
  const {
    isOpen,
    message,
    confirmAction,
    openConfirmation,
    closeConfirmation,
  } = useConfirmation();

  // Data Fetching
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

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/positions');
      if (!response.ok) throw new Error('Failed to fetch positions');
      const data = await response.json();
      setPositions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch positions'
      );
    }
  }, []);

  const fetchTests = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data.filter((test: Test) => !test.isArchived));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tests');
    }
  }, []);

  const fetchPublicLinks = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/public-links');
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
      const response = await fetch('/api/admin/time-slots');
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
      const response = await fetch('/api/admin/time-slot-links');
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
        fetchPositions(),
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
    const profile = jobProfiles.find((p) => p.id === profileId);
    if (!profile) return [];
    return publicLinks.filter((link) =>
      profile.tests.some((test) => test.title === link.testTitle)
    );
  };

  const getTimeSlotsForProfile = (profileId: string) => {
    return timeSlots.filter((slot) => slot.jobProfile.id === profileId);
  };

  const getTimeSlotLinksForProfile = (profileId: string) => {
    const profileTimeSlots = getTimeSlotsForProfile(profileId);
    return allTimeSlotLinks.filter((link) =>
      profileTimeSlots.some((slot) => slot.id === link.timeSlot.id)
    );
  };

  // Action Handlers
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
    openConfirmation(
      `Are you sure you want to delete "${profile.name}"? This will also delete all associated invitations and public links.`,
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
      const response = await fetch('/api/admin/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...invitationData,
          jobProfileId: selectedProfile.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send invitation');
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

  const handleGeneratePublicLink = async (profileId: string) => {
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
    }
  };

  const handleCreateTimeSlot = async (timeSlotData: any) => {
    if (!selectedProfile) return;

    try {
      const response = await fetch('/api/admin/time-slots', {
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

      await Promise.all([fetchTimeSlots(), fetchJobProfiles()]);
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
          ? `/api/admin/public-links/${linkId}`
          : `/api/admin/time-slot-links?linkId=${linkId}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${type} link`);
      }

      await Promise.all([
        fetchPublicLinks(),
        fetchTimeSlots(),
        fetchAllTimeSlotLinks(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete ${type} link`
      );
    }
  };

  // Form Reset Functions
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
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading job profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Job Profiles</h1>
        <p className="text-gray-600">
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
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
            <input
              type="text"
              placeholder="Search profiles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:w-64"
            />
          </div>
          <button
            onClick={() => setShowActiveOnly(!showActiveOnly)}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
              showActiveOnly
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Active Only
          </button>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Profile
        </button>
      </div>

      {/* Job Profile Cards Grid */}
      {filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                  positionIds: profile.positions.map((p) => p.id),
                  testIds: profile.tests.map((t) => t.id),
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
          <Building2 className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            {searchTerm ? 'No profiles found' : 'No job profiles yet'}
          </h3>
          <p className="mb-4 text-gray-600">
            {searchTerm
              ? 'Try adjusting your search criteria'
              : 'Create your first job profile to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
              positionIds: profile.positions.map((p) => p.id),
              testIds: profile.tests.map((t) => t.id),
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
            // Generate time slot link
          }}
          onCreateTimeSlot={(profile) => {
            setShowDetailsModal(false);
            setSelectedProfile(profile);
            setShowTimeSlotModal(true);
          }}
          onDeleteLink={handleDeleteLink}
          onCopyLink={copyToClipboard}
          copiedLinkId={copiedLink}
        />
      )}

      {/* Link Builder Modal */}
      {showLinkBuilder && selectedProfile && (
        <LinkBuilder
          jobProfileId={selectedProfile.id}
          jobProfileName={selectedProfile.name}
          tests={selectedProfile.tests}
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
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <form
              onSubmit={
                showCreateModal ? handleCreateProfile : handleUpdateProfile
              }
            >
              <div className="p-6">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">
                  {showCreateModal ? 'Create Job Profile' : 'Edit Job Profile'}
                </h2>

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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Positions *
                      </label>
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3">
                        {positions.map((position) => (
                          <label
                            key={position.id}
                            className="flex cursor-pointer items-center gap-2 py-1 hover:bg-gray-50"
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
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
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
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3">
                        {tests.map((test) => (
                          <label
                            key={test.id}
                            className="flex cursor-pointer items-center gap-2 py-1 hover:bg-gray-50"
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
                              className="h-4 w-4 rounded border-gray-300 text-blue-600"
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

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-medium text-gray-700"
                    >
                      Active Profile
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedProfile(null);
                    resetForm();
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <form onSubmit={handleSendInvitation}>
              <div className="p-6">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  Send Invitation - {selectedProfile.name}
                </h2>

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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedProfile(null);
                    resetInvitationForm();
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
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
          jobProfileName={selectedProfile.name}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isOpen}
        message={message}
        onConfirm={confirmAction}
        onCancel={closeConfirmation}
      />
    </div>
  );
}
