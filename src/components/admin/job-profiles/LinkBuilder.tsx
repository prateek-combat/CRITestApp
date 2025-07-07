'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Clock,
  Calendar,
  Users,
  AlertCircle,
  Check,
  ChevronRight,
  Settings,
  Globe,
} from 'lucide-react';

interface LinkBuilderProps {
  jobProfileId: string;
  jobProfileName: string;
  tests: Array<{ id: string; title: string }>;
  timeSlots: Array<{
    id: string;
    name: string;
    startDateTime: string;
    endDateTime: string;
    currentParticipants: number;
    maxParticipants?: number;
  }>;
  onCreatePublicLink: (settings: PublicLinkSettings) => Promise<void>;
  onCreateTimeSlotLink: (
    timeSlotId: string,
    testIds: string[]
  ) => Promise<void>;
  onClose: () => void;
}

interface PublicLinkSettings {
  testIds: string[];
  maxUses?: number;
  expiresInDays?: number;
}

type LinkType = 'public' | 'timeSlot';

export default function LinkBuilder({
  jobProfileId,
  jobProfileName,
  tests,
  timeSlots,
  onCreatePublicLink,
  onCreateTimeSlotLink,
  onClose,
}: LinkBuilderProps) {
  const [linkType, setLinkType] = useState<LinkType>('public');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresInDays, setExpiresInDays] = useState<number | ''>(7);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTestToggle = (testId: string) => {
    setSelectedTests((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const handleCreate = async () => {
    setError(null);

    if (selectedTests.length === 0) {
      setError('Please select at least one test');
      return;
    }

    if (linkType === 'timeSlot' && !selectedTimeSlot) {
      setError('Please select a time slot');
      return;
    }

    setIsCreating(true);
    try {
      if (linkType === 'public') {
        await onCreatePublicLink({
          testIds: selectedTests,
          maxUses: maxUses || undefined,
          expiresInDays: expiresInDays || undefined,
        });
      } else {
        await onCreateTimeSlotLink(selectedTimeSlot, selectedTests);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
    } finally {
      setIsCreating(false);
    }
  };

  const LinkTypeCard = ({
    type,
    title,
    description,
    icon: Icon,
    selected,
    onClick,
  }: {
    type: LinkType;
    title: string;
    description: string;
    icon: React.ElementType;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`relative flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div
        className={`rounded-lg p-3 ${
          selected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
        }`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 text-left">
        <h4
          className={`font-medium ${selected ? 'text-blue-900' : 'text-gray-900'}`}
        >
          {title}
        </h4>
        <p
          className={`mt-1 text-sm ${selected ? 'text-blue-700' : 'text-gray-600'}`}
        >
          {description}
        </p>
      </div>
      {selected && (
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:align-middle">
          <div className="bg-white px-6 pb-4 pt-6">
            <div className="mb-6">
              <h3 className="mb-1 text-lg font-semibold text-gray-900">
                Create Assessment Link
              </h3>
              <p className="text-sm text-gray-600">
                Configure and generate a new assessment link for{' '}
                {jobProfileName}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-900">
                  1. Choose Link Type
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <LinkTypeCard
                    type="public"
                    title="Public Link"
                    description="Anyone with the link can start the assessment"
                    icon={Globe}
                    selected={linkType === 'public'}
                    onClick={() => setLinkType('public')}
                  />
                  <LinkTypeCard
                    type="timeSlot"
                    title="Time-Restricted Link"
                    description="Only works during a specific time window"
                    icon={Clock}
                    selected={linkType === 'timeSlot'}
                    onClick={() => setLinkType('timeSlot')}
                  />
                </div>
              </div>

              <div>
                <h4 className="mb-3 text-sm font-medium text-gray-900">
                  2. Select Tests
                </h4>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {tests.map((test) => (
                    <label
                      key={test.id}
                      className="flex cursor-pointer items-center gap-3 rounded p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleTestToggle(test.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {test.title}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedTests.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {selectedTests.length} test
                    {selectedTests.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>

              {linkType === 'timeSlot' && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    3. Select Time Slot
                  </h4>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {timeSlots.length > 0 ? (
                      timeSlots.map((slot) => (
                        <label
                          key={slot.id}
                          className="flex cursor-pointer items-start gap-3 rounded border border-transparent p-3 hover:border-gray-200 hover:bg-gray-50"
                        >
                          <input
                            type="radio"
                            name="timeSlot"
                            value={slot.id}
                            checked={selectedTimeSlot === slot.id}
                            onChange={(e) =>
                              setSelectedTimeSlot(e.target.value)
                            }
                            className="mt-1 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {slot.name}
                            </p>
                            <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(
                                  slot.startDateTime
                                ).toLocaleString()}{' '}
                                -{new Date(slot.endDateTime).toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {slot.currentParticipants}
                                {slot.maxParticipants &&
                                  ` / ${slot.maxParticipants}`}
                              </span>
                            </div>
                          </div>
                        </label>
                      ))
                    ) : (
                      <div className="py-8 text-center text-gray-500">
                        <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm">No time slots available</p>
                        <p className="mt-1 text-xs">Create a time slot first</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {linkType === 'public' && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-900">
                    3. Configure Settings (Optional)
                  </h4>
                  <div className="space-y-4 rounded-lg border border-gray-200 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Maximum Uses
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={maxUses}
                        onChange={(e) =>
                          setMaxUses(
                            e.target.value ? parseInt(e.target.value) : ''
                          )
                        }
                        placeholder="Unlimited"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty for unlimited uses
                      </p>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Expires In (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={expiresInDays}
                        onChange={(e) =>
                          setExpiresInDays(
                            e.target.value ? parseInt(e.target.value) : ''
                          )
                        }
                        placeholder="Never expires"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Leave empty for no expiration
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={
                isCreating ||
                selectedTests.length === 0 ||
                (linkType === 'timeSlot' && !selectedTimeSlot)
              }
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating...
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Create Link
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
