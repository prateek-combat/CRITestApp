'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Send,
  ExternalLink,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Users,
  TestTube,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseMultipleEmails } from '@/lib/validation-utils';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useConfirmation } from '@/hooks/useConfirmation';
import {
  PageContainer,
  PageHeader,
  ContentCard,
} from '@/components/ui/PageContainer';
import {
  DataTable,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  EmptyState,
} from '@/components/ui/DataTable';
import Button from '@/components/ui/button/Button';
import Card from '@/components/ui/Card';
import { motion } from 'framer-motion';

// ... (keep all the interfaces from the original file)

export default function JobProfilesPage() {
  // ... (keep all the state and logic from the original file)

  return (
    <PageContainer>
      <PageHeader
        title="Job Profiles"
        subtitle="Manage job profiles and send candidate invitations"
        actions={
          <Button
            size="sm"
            variant="primary"
            startIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Job Profile
          </Button>
        }
      />

      {error && (
        <ContentCard>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </ContentCard>
      )}

      {/* Filters */}
      <ContentCard>
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search job profiles..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-military-green focus:outline-none focus:ring-2 focus:ring-military-green/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-military-green focus:outline-none focus:ring-2 focus:ring-military-green/20"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </ContentCard>

      {/* Job Profiles Table */}
      <ContentCard noPadding>
        <DataTable>
          <TableHeader>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Positions</TableHeaderCell>
            <TableHeaderCell>Tests</TableHeaderCell>
            <TableHeaderCell>Invitations</TableHeaderCell>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center">
                  <div className="flex justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-military-green border-t-transparent" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProfiles.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-8 w-8 text-gray-300" />}
                message="No job profiles found"
              />
            ) : (
              filteredProfiles.map((profile) => (
                <React.Fragment key={profile.id}>
                  <TableRow
                    onClick={() => toggleRow(profile.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{
                            rotate: expandedRows.has(profile.id) ? 90 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </motion.div>
                        {profile.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>{profile.positions.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TestTube className="h-4 w-4 text-gray-400" />
                        <span>{profile.tests.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="text-gray-900">
                          {profile._count.completedInvitations}
                        </span>
                        <span className="text-gray-500">
                          {' '}
                          / {profile._count.invitations}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          profile.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInvite(profile);
                          }}
                          startIcon={<Send className="h-3 w-3" />}
                        >
                          Invite
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(profile);
                          }}
                          startIcon={<Edit2 className="h-3 w-3" />}
                        >
                          Edit
                        </Button>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConfirm(profile);
                          }}
                          startIcon={<Trash2 className="h-3 w-3" />}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {expandedRows.has(profile.id) && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50">
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 py-3"
                        >
                          {profile.description && (
                            <div>
                              <h4 className="mb-1 text-sm font-medium text-gray-700">
                                Description
                              </h4>
                              <p className="text-sm text-gray-600">
                                {profile.description}
                              </p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                            <div>
                              <h4 className="mb-2 text-sm font-medium text-gray-700">
                                Positions
                              </h4>
                              {profile.positions.length > 0 ? (
                                <div className="space-y-1">
                                  {profile.positions.map((position) => (
                                    <div
                                      key={position.id}
                                      className="text-sm text-gray-600"
                                    >
                                      • {position.name} ({position.department})
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No positions assigned
                                </p>
                              )}
                            </div>

                            <div>
                              <h4 className="mb-2 text-sm font-medium text-gray-700">
                                Tests
                              </h4>
                              {profile.tests.length > 0 ? (
                                <div className="space-y-1">
                                  {profile.tests.map((test) => (
                                    <div
                                      key={test.id}
                                      className="text-sm text-gray-600"
                                    >
                                      • {test.title} ({test.questionsCount}{' '}
                                      questions)
                                      {test.weight !== 1 && (
                                        <span className="ml-1 text-xs text-gray-500">
                                          - Weight: {test.weight}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  No tests assigned
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </DataTable>
      </ContentCard>

      {/* Recent Invitations */}
      <ContentCard>
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Recent Invitations
        </h2>
        {invitations.length > 0 ? (
          <div className="space-y-2">
            {invitations.slice(0, 5).map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg bg-gray-50 p-2"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {invitation.candidateName} ({invitation.candidateEmail})
                  </p>
                  <p className="text-xs text-gray-500">
                    {invitation.jobProfile.name} •{' '}
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                    invitation.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : invitation.status === 'EXPIRED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {invitation.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent invitations</p>
        )}
      </ContentCard>

      {/* Keep all modals from the original file */}
      {/* ... */}
    </PageContainer>
  );
}
