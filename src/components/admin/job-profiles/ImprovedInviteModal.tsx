'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  ExternalLink,
  Clock,
  User,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
  Users,
} from 'lucide-react';

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
  startDateTime: string;
  endDateTime: string;
  publicTestLinks: Array<{
    id: string;
    publicUrl: string;
    testTitle: string;
  }>;
}

interface ImprovedInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobProfileName: string;
  publicLinks: PublicLink[];
  timeSlots: TimeSlot[];
  onSendPersonalized: (data: {
    candidateEmail: string;
    candidateName: string;
    customMessage: string;
    expiresInDays: number;
  }) => void;
  onSendExistingLink: (data: {
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
  }) => void;
}

type InviteType = 'personalized' | 'public' | 'timeSlot';

export default function ImprovedInviteModal({
  isOpen,
  onClose,
  jobProfileName,
  publicLinks,
  timeSlots,
  onSendPersonalized,
  onSendExistingLink,
}: ImprovedInviteModalProps) {
  const [inviteType, setInviteType] = useState<InviteType>('personalized');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [selectedLink, setSelectedLink] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(
    null
  );
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const activePublicLinks = publicLinks.filter((link) => link.isActive);
  const activeTimeSlots = timeSlots.filter((slot) => {
    const now = new Date();
    return new Date(slot.endDateTime) > now && slot.publicTestLinks.length > 0;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const candidateName = ''; // No name required

    if (inviteType === 'personalized') {
      onSendPersonalized({
        candidateEmail,
        candidateName,
        customMessage,
        expiresInDays,
      });
    } else {
      const linkType = inviteType === 'public' ? 'public' : 'timeSlot';
      const timeSlotInfo = selectedTimeSlot
        ? {
            name: selectedTimeSlot.name,
            startDateTime: selectedTimeSlot.startDateTime,
            endDateTime: selectedTimeSlot.endDateTime,
          }
        : undefined;

      onSendExistingLink({
        candidateEmail,
        candidateName,
        linkUrl: selectedLink,
        linkType,
        customMessage,
        timeSlotInfo,
      });
    }

    // Reset form
    setCandidateEmail('');
    setCustomMessage('');
    setSelectedLink('');
    onClose();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const InviteTypeCard = ({
    type,
    title,
    description,
    icon: Icon,
    count,
  }: {
    type: InviteType;
    title: string;
    description: string;
    icon: React.ElementType;
    count?: number;
  }) => (
    <button
      type="button"
      onClick={() => setInviteType(type)}
      className={`relative flex items-start gap-3 rounded-lg border-2 p-4 transition-all duration-200 ${
        inviteType === type
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div
        className={`rounded-lg p-2 ${
          inviteType === type
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <h4
            className={`font-medium ${inviteType === type ? 'text-blue-900' : 'text-gray-900'}`}
          >
            {title}
          </h4>
          {count !== undefined && count > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {count} available
            </span>
          )}
        </div>
        <p
          className={`mt-1 text-sm ${inviteType === type ? 'text-blue-700' : 'text-gray-600'}`}
        >
          {description}
        </p>
      </div>
      {inviteType === type && (
        <div className="absolute right-4 top-4">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
            <Check className="h-3 w-3 text-white" />
          </div>
        </div>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-6 pb-4 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send Invitation - {jobProfileName}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Invitation Type Selection */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    1. Choose Invitation Type
                  </h4>
                  <div className="space-y-2">
                    <InviteTypeCard
                      type="personalized"
                      title="Personalized Invitation"
                      description="Create a unique link for this candidate"
                      icon={User}
                    />
                    <InviteTypeCard
                      type="public"
                      title="Public Link"
                      description="Send an existing shareable assessment link"
                      icon={ExternalLink}
                      count={activePublicLinks.length}
                    />
                    <InviteTypeCard
                      type="timeSlot"
                      title="Time Slot Link"
                      description="Send a link for a scheduled assessment time"
                      icon={Clock}
                      count={activeTimeSlots.length}
                    />
                  </div>
                </div>

                {/* Link Selection */}
                {inviteType === 'public' && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">
                      2. Select Public Link
                    </h4>
                    {activePublicLinks.length > 0 ? (
                      <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                        {activePublicLinks.map((link) => (
                          <label
                            key={link.id}
                            className="flex cursor-pointer items-start gap-3 rounded border border-transparent p-3 hover:border-gray-200 hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="publicLink"
                              value={link.publicUrl}
                              checked={selectedLink === link.publicUrl}
                              onChange={(e) => setSelectedLink(e.target.value)}
                              className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {link.testTitle}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                                <span>Used {link.usedCount} times</span>
                                {link.maxUses && (
                                  <span>• Max {link.maxUses} uses</span>
                                )}
                                {link.expiresAt && (
                                  <span>
                                    • Expires{' '}
                                    {new Date(
                                      link.expiresAt
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                copyToClipboard(link.publicUrl);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              {copiedLink === link.publicUrl ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 py-8 text-center">
                        <ExternalLink className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          No active public links available
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Generate a public link first
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {inviteType === 'timeSlot' && (
                  <div>
                    <h4 className="mb-3 text-sm font-medium text-gray-900">
                      2. Select Time Slot Link
                    </h4>
                    {activeTimeSlots.length > 0 ? (
                      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3">
                        {activeTimeSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="rounded-lg border border-gray-200 p-3 transition-colors hover:border-blue-300"
                          >
                            <div className="mb-2 flex items-start justify-between">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {slot.name}
                                </h5>
                                <div className="mt-1 text-xs text-gray-600">
                                  <div>
                                    Start:{' '}
                                    {new Date(
                                      slot.startDateTime
                                    ).toLocaleString()}
                                  </div>
                                  <div>
                                    End:{' '}
                                    {new Date(
                                      slot.endDateTime
                                    ).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Clock className="h-5 w-5 text-gray-400" />
                            </div>

                            {slot.publicTestLinks.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                <p className="text-xs font-medium text-gray-700">
                                  Available Links:
                                </p>
                                {slot.publicTestLinks.map((link) => (
                                  <label
                                    key={link.id}
                                    className={`flex cursor-pointer items-center gap-3 rounded p-2 transition-colors ${
                                      selectedLink === link.publicUrl
                                        ? 'border border-blue-300 bg-blue-50'
                                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name="timeSlotLink"
                                      value={link.publicUrl}
                                      checked={selectedLink === link.publicUrl}
                                      onChange={(e) => {
                                        setSelectedLink(e.target.value);
                                        setSelectedTimeSlot(slot);
                                      }}
                                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-700">
                                        {link.testTitle}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        copyToClipboard(link.publicUrl);
                                      }}
                                      className="p-1 text-gray-400 hover:text-gray-600"
                                      title="Copy link"
                                    >
                                      {copiedLink === link.publicUrl ? (
                                        <Check className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs italic text-gray-500">
                                No links generated for this time slot
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-gray-200 py-8 text-center">
                        <Clock className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          No active time slots available
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Create time slots and generate links first
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate Information */}
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    {inviteType === 'personalized' ? '2. ' : '3. '}Candidate
                    Information
                  </h4>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Email(s) *
                    </label>
                    <textarea
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email(s) - for multiple, separate with commas, semicolons, or new lines"
                      rows={3}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      For bulk invites: email1@example.com, email2@example.com
                      or use new lines
                    </p>
                  </div>
                </div>

                {/* Custom Message */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {inviteType === 'personalized' ? '3. ' : '4. '}Custom
                    Message (Optional)
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add a personal message to the invitation email..."
                  />
                </div>

                {/* Expiration for Personalized */}
                {inviteType === 'personalized' && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      4. Expires In (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={expiresInDays}
                      onChange={(e) =>
                        setExpiresInDays(parseInt(e.target.value))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Warning for non-personalized with no selection */}
                {inviteType !== 'personalized' && !selectedLink && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Please select a link to send to the candidate
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  !candidateEmail ||
                  (inviteType !== 'personalized' && !selectedLink)
                }
                className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
