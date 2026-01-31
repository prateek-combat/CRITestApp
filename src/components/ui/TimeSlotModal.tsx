'use client';

import React, { useState } from 'react';
import { X, Clock, Users, Calendar, Globe } from 'lucide-react';

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
}

interface TimeSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    timeSlotData: Omit<TimeSlot, 'id' | 'currentParticipants' | 'isActive'>
  ) => Promise<void>;
  jobProfileId: string;
  jobProfileName: string;
}

// Helper functions for default times (moved to top level)
const formatDateTimeLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const getDefaultStartTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return formatDateTimeLocal(now);
};

const getDefaultEndTime = () => {
  const now = new Date();
  now.setHours(now.getHours() + 3, 0, 0, 0);
  return formatDateTimeLocal(now);
};

export default function TimeSlotModal({
  isOpen,
  onClose,
  onSubmit,
  jobProfileId,
  jobProfileName,
}: TimeSlotModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDateTime: getDefaultStartTime(),
    endDateTime: getDefaultEndTime(),
    timezone: 'Asia/Kolkata',
    maxParticipants: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate dates
      const startDate = new Date(formData.startDateTime);
      const endDate = new Date(formData.endDateTime);

      if (startDate >= endDate) {
        throw new Error('End time must be after start time');
      }

      if (startDate < new Date()) {
        throw new Error('Start time must be in the future');
      }

      await onSubmit({
        name: formData.name,
        description: formData.description || undefined,
        startDateTime: formData.startDateTime,
        endDateTime: formData.endDateTime,
        timezone: formData.timezone,
        maxParticipants: formData.maxParticipants
          ? parseInt(formData.maxParticipants)
          : undefined,
      });

      // Reset form with fresh default times
      setFormData({
        name: '',
        description: '',
        startDateTime: getDefaultStartTime(),
        endDateTime: getDefaultEndTime(),
        timezone: 'Asia/Kolkata',
        maxParticipants: '',
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create time slot'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded bg-parchment/80 p-3 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">Create Time Slot</h2>
            <p className="text-xs text-ink/60">For {jobProfileName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink/40 hover:bg-parchment/90 hover:text-ink/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-2 rounded bg-red-50 p-2 text-red-700">
            <p className="text-xs">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-ink/70">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Morning Session, Batch A"
              className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink/70">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description"
              rows={2}
              className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-ink/70">
                <Calendar className="mr-1 inline h-3 w-3" />
                Start *
              </label>
              <input
                type="datetime-local"
                value={formData.startDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, startDateTime: e.target.value })
                }
                className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/70">
                <Clock className="mr-1 inline h-3 w-3" />
                End *
              </label>
              <input
                type="datetime-local"
                value={formData.endDateTime}
                onChange={(e) =>
                  setFormData({ ...formData, endDateTime: e.target.value })
                }
                className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-ink/70">
                <Globe className="mr-1 inline h-3 w-3" />
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink/70">
                <Users className="mr-1 inline h-3 w-3" />
                Max Participants
              </label>
              <input
                type="number"
                value={formData.maxParticipants}
                onChange={(e) =>
                  setFormData({ ...formData, maxParticipants: e.target.value })
                }
                placeholder="Unlimited"
                min="1"
                className="mt-1 block w-full rounded border border-ink/20 px-2 py-1 text-sm focus:border-copper/50 focus:outline-none focus:ring-1 focus:ring-copper/40"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-ink/20 bg-parchment/80 px-3 py-1 text-xs font-medium text-ink/70 hover:bg-ink/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-ink px-3 py-1 text-xs font-medium text-parchment hover:bg-ink/90 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
