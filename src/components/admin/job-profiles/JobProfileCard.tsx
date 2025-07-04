'use client';

import React, { useState } from 'react';
import {
  Building2,
  Users,
  TestTube,
  Send,
  ExternalLink,
  Clock,
  Edit2,
  Trash2,
  ChevronRight,
  BarChart,
  Eye,
  EyeOff,
} from 'lucide-react';

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

interface JobProfileCardProps {
  profile: JobProfile;
  publicLinksCount: number;
  timeSlotsCount: number;
  onEdit: (profile: JobProfile) => void;
  onDelete: (profile: JobProfile) => void;
  onSendInvitation: (profile: JobProfile) => void;
  onGeneratePublicLink: (profileId: string) => void;
  onCreateTimeSlot: (profile: JobProfile) => void;
  onViewDetails: (profile: JobProfile) => void;
}

export default function JobProfileCard({
  profile,
  publicLinksCount,
  timeSlotsCount,
  onEdit,
  onDelete,
  onSendInvitation,
  onGeneratePublicLink,
  onCreateTimeSlot,
  onViewDetails,
}: JobProfileCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900">
                {profile.name}
              </h3>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  profile.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {profile.isActive ? (
                  <Eye className="h-3 w-3" />
                ) : (
                  <EyeOff className="h-3 w-3" />
                )}
                {profile.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {profile.description && (
              <p className="line-clamp-1 text-xs text-gray-600">
                {profile.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(profile)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="Edit"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(profile)}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-gray-500">
              <Building2 className="h-3 w-3" />
              <span>Positions</span>
            </div>
            <p className="font-semibold text-gray-900">
              {profile.positions.length}
            </p>
          </div>
          <div className="text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-gray-500">
              <TestTube className="h-3 w-3" />
              <span>Tests</span>
            </div>
            <p className="font-semibold text-gray-900">
              {profile.tests.length}
            </p>
          </div>
          <div className="text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-gray-500">
              <ExternalLink className="h-3 w-3" />
              <span>Links</span>
            </div>
            <p className="font-semibold text-gray-900">{publicLinksCount}</p>
          </div>
          <div className="text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Slots</span>
            </div>
            <p className="font-semibold text-gray-900">{timeSlotsCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSendInvitation(profile)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-md"
            title="Send invitation"
          >
            <Send className="h-3.5 w-3.5" />
            Invite
          </button>
          <button
            onClick={() => onViewDetails(profile)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md"
            title="Manage profile"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            Manage
          </button>
        </div>
      </div>
    </div>
  );
}
