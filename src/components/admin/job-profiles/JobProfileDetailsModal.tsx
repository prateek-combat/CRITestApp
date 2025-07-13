'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  TestTube,
  Users,
  BarChart,
  ExternalLink,
  Clock,
  Send,
  Plus,
  Edit2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import LinkManagementSection from './LinkManagementSection';
import TimeSlotCalendar from './TimeSlotCalendar';

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
  positions?: Position[];
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

interface JobProfileDetailsModalProps {
  profile: JobProfile;
  publicLinks: PublicLink[];
  timeSlots: TimeSlot[];
  timeSlotLinks: TimeSlotLink[];
  onClose: () => void;
  onEdit: (profile: JobProfile) => void;
  onSendInvitation: (profile: JobProfile) => void;
  onGeneratePublicLink: (profileId: string) => void;
  onGenerateTimeSlotLink: (timeSlotId: string) => void;
  onCreateTimeSlot: (profile: JobProfile) => void;
  onDeleteLink: (linkId: string, type: 'public' | 'timeSlot') => void;
  onCopyLink: (url: string, linkId: string) => void;
  onToggleLink?: (linkId: string) => void;
  copiedLinkId: string | null;
}

export default function JobProfileDetailsModal({
  profile,
  publicLinks,
  timeSlots,
  timeSlotLinks,
  onClose,
  onEdit,
  onSendInvitation,
  onGeneratePublicLink,
  onGenerateTimeSlotLink,
  onCreateTimeSlot,
  onDeleteLink,
  onCopyLink,
  onToggleLink,
  copiedLinkId,
}: JobProfileDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'links' | 'calendar'>(
    'overview'
  );

  const tests =
    profile.testWeights?.map((tw) => tw.test) || profile.tests || [];
  const profilePublicLinks = publicLinks.filter((link) =>
    tests.some((test) => test.title === link.testTitle)
  );

  const profileTimeSlots = timeSlots;

  const completionRate =
    profile._count.invitations > 0 && profile._count.completedInvitations
      ? Math.round(
          (profile._count.completedInvitations / profile._count.invitations) *
            100
        )
      : 0;

  const tabClasses = (isActive: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:align-middle">
          <div className="bg-white">
            <div className="sticky top-0 z-10 border-b border-gray-200 bg-white">
              <div className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.name}
                    </h2>
                    {profile.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {profile.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(profile)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={onClose}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={tabClasses(activeTab === 'overview')}
                  >
                    <BarChart className="mr-2 inline h-4 w-4" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('links')}
                    className={tabClasses(activeTab === 'links')}
                  >
                    <ExternalLink className="mr-2 inline h-4 w-4" />
                    Links & Invitations
                  </button>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={tabClasses(activeTab === 'calendar')}
                  >
                    <Clock className="mr-2 inline h-4 w-4" />
                    Time Slots
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto px-6 py-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Building2 className="h-8 w-8 text-blue-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {tests.length}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Tests</p>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <TestTube className="h-8 w-8 text-purple-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {tests.length}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Tests</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {completionRate}%
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Completion Rate
                      </p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <Users className="h-8 w-8 text-yellow-600" />
                        <span className="text-2xl font-bold text-gray-900">
                          {profile._count.invitations}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        Total Invitations
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Positions
                      </h3>
                      <div className="space-y-3">
                        {(profile.positions || []).map((position) => (
                          <div
                            key={position.id}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {position.name}
                                </h4>
                                <p className="mt-1 text-sm text-gray-600">
                                  Code: {position.code} | Department:{' '}
                                  {position.department}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-6">
                      <h3 className="mb-4 text-lg font-semibold text-gray-900">
                        Tests
                      </h3>
                      <div className="space-y-3">
                        {tests.map((test) => (
                          <div
                            key={test.id}
                            className="rounded-lg border border-gray-200 bg-white p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {test.title}
                                </h4>
                                <p className="mt-1 text-sm text-gray-600">
                                  {test.questionsCount} questions
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSendInvitation(profile)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Send className="h-5 w-5" />
                      Send Invitation
                    </button>
                    <button
                      onClick={() => onGeneratePublicLink(profile.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Generate Public Link
                    </button>
                    <button
                      onClick={() => onCreateTimeSlot(profile)}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Clock className="h-5 w-5" />
                      Create Time Slot
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'links' && (
                <LinkManagementSection
                  jobProfileId={profile.id}
                  jobProfileName={profile.name}
                  publicLinks={profilePublicLinks}
                  timeSlotLinks={timeSlotLinks}
                  onGeneratePublicLink={() => onGeneratePublicLink(profile.id)}
                  onGenerateTimeSlotLink={onGenerateTimeSlotLink}
                  onDeleteLink={onDeleteLink}
                  onCopyLink={onCopyLink}
                  onToggleLink={onToggleLink}
                  copiedLinkId={copiedLinkId}
                />
              )}

              {activeTab === 'calendar' && (
                <TimeSlotCalendar
                  timeSlots={profileTimeSlots}
                  onCreateTimeSlot={() => onCreateTimeSlot(profile)}
                  onEditTimeSlot={() => {}}
                  onDeleteTimeSlot={() => {}}
                  onGenerateLink={onGenerateTimeSlotLink}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
