'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

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
  jobProfile?: {
    id: string;
    name: string;
  };
  _count?: {
    publicTestLinks: number;
  };
}

interface TimeSlotCalendarProps {
  timeSlots: TimeSlot[];
  onCreateTimeSlot: () => void;
  onEditTimeSlot: (slot: TimeSlot) => void;
  onDeleteTimeSlot: (slot: TimeSlot) => void;
  onGenerateLink: (slotId: string) => void;
}

export default function TimeSlotCalendar({
  timeSlots,
  onCreateTimeSlot,
  onEditTimeSlot,
  onDeleteTimeSlot,
  onGenerateLink,
}: TimeSlotCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const monthStart = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const monthEnd = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const calendarDays = useMemo(() => {
    const days = [];
    const start = viewMode === 'month' ? monthStart : weekStart;
    const end = viewMode === 'month' ? monthEnd : weekEnd;

    const startPadding = start.getDay();
    const totalDays = Math.ceil((end.getDate() + startPadding) / 7) * 7;

    for (let i = -startPadding; i < totalDays - startPadding; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      days.push(date);
    }

    return days;
  }, [currentDate, viewMode]);

  const getTimeSlotsForDate = (date: Date) => {
    return timeSlots.filter((slot) => {
      const slotDate = new Date(slot.startDateTime);
      return (
        slotDate.getFullYear() === date.getFullYear() &&
        slotDate.getMonth() === date.getMonth() &&
        slotDate.getDate() === date.getDate()
      );
    });
  };

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatWeekRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const endStr = end.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${startStr} - ${endStr}`;
  };

  const TimeSlotCard = ({ slot }: { slot: TimeSlot }) => {
    const startTime = new Date(slot.startDateTime);
    const endTime = new Date(slot.endDateTime);
    const isActive =
      slot.isActive && startTime <= new Date() && new Date() <= endTime;
    const isPast = endTime < new Date();

    return (
      <div
        className={`rounded-md border p-2 text-xs ${
          isActive
            ? 'border-green-300 bg-green-50'
            : isPast
              ? 'border-gray-200 bg-gray-50'
              : 'border-blue-200 bg-blue-50'
        }`}
      >
        <div className="mb-1 flex items-start justify-between">
          <p className="truncate pr-1 font-medium text-gray-900">{slot.name}</p>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditTimeSlot(slot);
              }}
              className="rounded p-0.5 text-gray-400 hover:text-gray-600"
            >
              <Edit2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteTimeSlot(slot);
              }}
              className="rounded p-0.5 text-gray-400 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="space-y-0.5 text-gray-600">
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {startTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            -
            {endTime.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {slot.currentParticipants}
              {slot.maxParticipants && `/${slot.maxParticipants}`}
            </span>
            {slot._count?.publicTestLinks &&
              slot._count.publicTestLinks > 0 && (
                <span className="flex items-center gap-0.5 text-gray-600">
                  <ExternalLink className="h-3 w-3" />
                  <span>{slot._count.publicTestLinks}</span>
                </span>
              )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Time Slot Calendar
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Visualize and manage assessment time slots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setViewMode('week')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
            <button
              onClick={onCreateTimeSlot}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              New Time Slot
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={navigatePrevious}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h4 className="text-lg font-medium text-gray-900">
            {viewMode === 'month'
              ? formatMonthYear(currentDate)
              : formatWeekRange(weekStart, weekEnd)}
          </h4>
          <button
            onClick={navigateNext}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 px-2 py-3 text-center text-xs font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth();
            const isToday = date.toDateString() === new Date().toDateString();
            const daySlots = getTimeSlotsForDate(date);

            return (
              <div
                key={index}
                className={`min-h-[100px] bg-white p-2 ${
                  !isCurrentMonth ? 'bg-gray-50' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      !isCurrentMonth ? 'text-gray-400' : 'text-gray-900'
                    } ${isToday ? 'text-blue-600' : ''}`}
                  >
                    {date.getDate()}
                  </span>
                  {daySlots.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {daySlots.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1">
                  {daySlots.slice(0, 2).map((slot) => (
                    <TimeSlotCard key={slot.id} slot={slot} />
                  ))}
                  {daySlots.length > 2 && (
                    <p className="text-center text-xs text-gray-500">
                      +{daySlots.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
