'use client';

import React, { useState } from 'react';
import {
  ExternalLink,
  Clock,
  Users,
  Copy,
  Check,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  EyeOff,
  Info,
  ChevronRight,
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

interface LinkManagementSectionProps {
  jobProfileId: string;
  jobProfileName: string;
  publicLinks: PublicLink[];
  timeSlotLinks: TimeSlotLink[];
  onGeneratePublicLink: () => void;
  onGenerateTimeSlotLink: (timeSlotId: string) => void;
  onDeleteLink: (linkId: string, type: 'public' | 'timeSlot') => void;
  onCopyLink: (url: string, linkId: string) => void;
  copiedLinkId: string | null;
}

export default function LinkManagementSection({
  jobProfileId,
  jobProfileName,
  publicLinks,
  timeSlotLinks,
  onGeneratePublicLink,
  onGenerateTimeSlotLink,
  onDeleteLink,
  onCopyLink,
  copiedLinkId,
}: LinkManagementSectionProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'timeSlot'>('public');
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const filteredPublicLinks = publicLinks.filter((link) => {
    const matchesSearch = link.testTitle
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesActive = !showActiveOnly || link.isActive;
    return matchesSearch && matchesActive;
  });

  const filteredTimeSlotLinks = timeSlotLinks.filter((link) => {
    const matchesSearch =
      link.testTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      link.timeSlot.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const tabClasses = (isActive: boolean) =>
    `relative px-6 py-3 text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-blue-700 bg-white border-b-2 border-blue-700'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
    }`;

  const LinkCard = ({
    link,
    type,
  }: {
    link: PublicLink | TimeSlotLink;
    type: 'public' | 'timeSlot';
  }) => {
    const isPublic = type === 'public';
    const publicLink = link as PublicLink;
    const timeSlotLink = link as TimeSlotLink;

    return (
      <div className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow duration-200 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="font-medium text-gray-900">{link.testTitle}</h4>
              {isPublic && publicLink.isActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                  Active
                </span>
              )}
              {isPublic && !publicLink.isActive && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  Inactive
                </span>
              )}
            </div>
            {!isPublic && (
              <>
                <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {timeSlotLink.timeSlot.name}
                  </span>
                </div>
                <div className="mb-2 text-xs text-gray-500">
                  <div>
                    Start:{' '}
                    {new Date(
                      timeSlotLink.timeSlot.startDateTime
                    ).toLocaleString()}
                  </div>
                  <div>
                    End:{' '}
                    {new Date(
                      timeSlotLink.timeSlot.endDateTime
                    ).toLocaleString()}
                  </div>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => onDeleteLink(link.id, type)}
            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete link"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="font-medium">{link.usedCount}</span>
              <span>uses</span>
              {isPublic && publicLink.maxUses && (
                <span className="text-gray-500">/ {publicLink.maxUses}</span>
              )}
            </div>
            {isPublic && publicLink.expiresAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>
                  Expires {new Date(publicLink.expiresAt).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={link.publicUrl}
              readOnly
              className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => onCopyLink(link.publicUrl, link.id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              {copiedLinkId === link.id ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Link Management
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Manage assessment links for {jobProfileName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {activeTab === 'public' && (
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  showActiveOnly
                    ? 'border-blue-300 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                Active Only
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={() => setActiveTab('public')}
            className={tabClasses(activeTab === 'public')}
          >
            <ExternalLink className="mr-2 inline h-4 w-4" />
            Public Links
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {publicLinks.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('timeSlot')}
            className={tabClasses(activeTab === 'timeSlot')}
          >
            <Clock className="mr-2 inline h-4 w-4" />
            Time-Restricted Links
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {timeSlotLinks.length}
            </span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'public' && (
          <>
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-blue-900">
                    Public Assessment Links
                  </h4>
                  <p className="text-sm text-blue-800">
                    Generate shareable links that candidates can use to start
                    assessments at any time. You can set usage limits and
                    expiration dates for better control.
                  </p>
                </div>
                <button
                  onClick={onGeneratePublicLink}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Generate New Link
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredPublicLinks.length > 0 ? (
                filteredPublicLinks.map((link) => (
                  <LinkCard key={link.id} link={link} type="public" />
                ))
              ) : (
                <div className="py-12 text-center">
                  <ExternalLink className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <h4 className="mb-1 text-lg font-medium text-gray-900">
                    {searchTerm ? 'No links found' : 'No public links yet'}
                  </h4>
                  <p className="mb-4 text-sm text-gray-600">
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'Generate your first public assessment link to get started'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={onGeneratePublicLink}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                      Generate Public Link
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'timeSlot' && (
          <>
            <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <h4 className="mb-1 font-medium text-purple-900">
                    Time-Restricted Assessment Links
                  </h4>
                  <p className="text-sm text-purple-800">
                    Create links that only work during specific time windows.
                    Perfect for scheduled assessments or proctored testing
                    sessions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTimeSlotLinks.length > 0 ? (
                filteredTimeSlotLinks.map((link) => (
                  <LinkCard key={link.id} link={link} type="timeSlot" />
                ))
              ) : (
                <div className="py-12 text-center">
                  <Clock className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <h4 className="mb-1 text-lg font-medium text-gray-900">
                    {searchTerm
                      ? 'No links found'
                      : 'No time-restricted links yet'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {searchTerm
                      ? 'Try adjusting your search criteria'
                      : 'Create time slots first, then generate links for them'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
