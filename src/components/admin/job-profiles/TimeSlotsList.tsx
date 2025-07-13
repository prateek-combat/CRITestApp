'use client';

import React from 'react';
import { Clock, Trash2, Plus, Users, Calendar } from 'lucide-react';

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

interface TimeSlotsListProps {
  timeSlots: TimeSlot[];
  onCreateTimeSlot: () => void;
  onDeleteTimeSlot: (timeSlotId: string) => void;
  onGenerateLink: (timeSlotId: string) => void;
}

export default function TimeSlotsList({
  timeSlots,
  onCreateTimeSlot,
  onDeleteTimeSlot,
  onGenerateLink,
}: TimeSlotsListProps) {
  const formatDateTime = (dateString: string, timezone: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone,
    });
  };

  const isExpired = (endDateTime: string) => {
    return new Date(endDateTime) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Time Slots</h3>
          <p className="text-sm text-gray-600">
            Manage time-restricted test sessions
          </p>
        </div>
        <button
          onClick={onCreateTimeSlot}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Time Slot
        </button>
      </div>

      {/* Time Slots List */}
      {timeSlots.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-sm font-medium text-gray-900">
            No time slots created
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Create time slots to schedule test sessions for specific time
            periods
          </p>
          <button
            onClick={onCreateTimeSlot}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Create First Time Slot
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {timeSlots.map((slot) => {
            const expired = isExpired(slot.endDateTime);
            return (
              <div
                key={slot.id}
                className={`rounded-lg border ${
                  expired
                    ? 'border-gray-200 bg-gray-50'
                    : slot.isActive
                      ? 'border-gray-200 bg-white'
                      : 'border-gray-200 bg-gray-50 opacity-75'
                } p-4 transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`font-medium ${
                          expired ? 'text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {slot.name}
                      </h4>
                      {expired && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          Expired
                        </span>
                      )}
                      {!expired && !slot.isActive && (
                        <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    {slot.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {slot.description}
                      </p>
                    )}

                    {/* Time Details */}
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">Start:</span>
                        <span>
                          {formatDateTime(slot.startDateTime, slot.timezone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">End:</span>
                        <span>
                          {formatDateTime(slot.endDateTime, slot.timezone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>
                          {slot.currentParticipants}
                          {slot.maxParticipants &&
                            ` / ${slot.maxParticipants}`}{' '}
                          participants
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Timezone:</span>{' '}
                        {slot.timezone}
                      </div>
                    </div>

                    {/* Stats */}
                    {slot._count && slot._count.publicTestLinks > 0 && (
                      <div className="mt-2 text-sm text-gray-600">
                        {slot._count.publicTestLinks} public link
                        {slot._count.publicTestLinks > 1 ? 's' : ''} created
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-4 flex items-center gap-2">
                    {!expired && (
                      <button
                        onClick={() => onGenerateLink(slot.id)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        Generate Link
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteTimeSlot(slot.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Delete time slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
