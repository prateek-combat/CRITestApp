'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  TestTube,
  Building2,
  Target,
  Search,
  Filter,
  MoreVertical,
} from 'lucide-react';

interface Position {
  id: string;
  name: string;
  code: string;
  description: string | null;
  department: string | null;
  level: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  testCount: number;
  activeTestCount: number;
  archivedTestCount: number;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  positionId: string | null;
}

export default function PositionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [positions, setPositions] = useState<Position[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignTestModal, setShowAssignTestModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(
    null
  );
  const [processing, setProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    department: '',
    level: '',
    isActive: true,
  });

  // Test assignment state
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);

  // Auth check
  useEffect(() => {
    if (status === 'loading') return;
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch data
  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/admin/positions?includeTestCount=true'
      );
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
      const response = await fetch('/api/tests');
      if (!response.ok) throw new Error('Failed to fetch tests');
      const data = await response.json();
      setTests(data);
    } catch (err) {
      console.error('Failed to fetch tests:', err);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPositions(), fetchTests()]);
      setLoading(false);
    };

    if (session?.user) {
      loadData();
    }
  }, [session, fetchPositions, fetchTests]);

  // Handlers
  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const response = await fetch('/api/admin/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create position');
      }

      await fetchPositions();
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create position'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPosition) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `/api/admin/positions/${selectedPosition.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update position');
      }

      await fetchPositions();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update position'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePosition = async (position: Position) => {
    if (
      !confirm(
        `Are you sure you want to delete the position "${position.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/positions/${position.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete position');
      }

      await fetchPositions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete position'
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignTests = async () => {
    if (!selectedPosition) return;

    setProcessing(true);

    try {
      // Update each selected test
      await Promise.all(
        selectedTestIds.map((testId) =>
          fetch(`/api/tests/${testId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ positionId: selectedPosition.id }),
          })
        )
      );

      await Promise.all([fetchPositions(), fetchTests()]);
      setShowAssignTestModal(false);
      setSelectedTestIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign tests');
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      department: '',
      level: '',
      isActive: true,
    });
    setSelectedPosition(null);
  };

  const openEditModal = (position: Position) => {
    setSelectedPosition(position);
    setFormData({
      name: position.name,
      code: position.code,
      description: position.description || '',
      department: position.department || '',
      level: position.level || '',
      isActive: position.isActive,
    });
    setShowEditModal(true);
  };

  const openAssignTestModal = (position: Position) => {
    setSelectedPosition(position);
    // Pre-select tests already assigned to this position
    const assignedTestIds = tests
      .filter((test) => test.positionId === position.id)
      .map((test) => test.id);
    setSelectedTestIds(assignedTestIds);
    setShowAssignTestModal(true);
  };

  // Filters
  const filteredPositions = positions.filter((position) => {
    const matchesSearch =
      position.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.description &&
        position.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDepartment =
      departmentFilter === 'all' || position.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const departments = [
    ...new Set(positions.map((p) => p.department).filter(Boolean)),
  ];

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading positions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Position Management
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Manage job positions and assign tests to them
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Position
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
              <button
                onClick={() => setError(null)}
                className="-mx-1.5 -my-1.5 ml-auto rounded-md p-1.5 text-red-500 hover:bg-red-100"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Positions Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPositions.map((position) => (
            <div
              key={position.id}
              className="relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Status Badge */}
              <div className="absolute right-4 top-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    position.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {position.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Position Info */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {position.name}
                </h3>
                <p className="font-mono text-sm text-gray-500">
                  {position.code}
                </p>
                {position.description && (
                  <p className="mt-2 text-sm text-gray-600">
                    {position.description}
                  </p>
                )}
              </div>

              {/* Department & Level */}
              <div className="mb-4 flex flex-wrap gap-2">
                {position.department && (
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    <Building2 className="mr-1 h-3 w-3" />
                    {position.department}
                  </span>
                )}
                {position.level && (
                  <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                    <Target className="mr-1 h-3 w-3" />
                    {position.level}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="mb-4 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {position.activeTestCount}
                  </div>
                  <div className="text-xs text-gray-500">Active Tests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-600">
                    {position.testCount}
                  </div>
                  <div className="text-xs text-gray-500">Total Tests</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => openAssignTestModal(position)}
                  className="inline-flex items-center rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                >
                  <TestTube className="mr-1 h-3 w-3" />
                  Assign Tests
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(position)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePosition(position)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600"
                    disabled={position.testCount > 0}
                    title={
                      position.testCount > 0
                        ? 'Cannot delete position with assigned tests'
                        : 'Delete position'
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPositions.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No positions found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || departmentFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Get started by creating your first position.'}
            </p>
          </div>
        )}
      </div>

      {/* Create Position Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowCreateModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleCreatePosition}>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Create New Position
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add a new job position to the system.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. SWE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Engineering"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Level
                    </label>
                    <input
                      type="text"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Senior, Junior, Lead"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Brief description of the position..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active position
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {processing ? 'Creating...' : 'Create Position'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Position Modal */}
      {showEditModal && selectedPosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowEditModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
              <form onSubmit={handleUpdatePosition}>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Edit Position
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Update position details.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Position Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Level
                    </label>
                    <input
                      type="text"
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({ ...formData, level: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
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
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="editIsActive"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Active position
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                  >
                    {processing ? 'Updating...' : 'Update Position'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tests Modal */}
      {showAssignTestModal && selectedPosition && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-end justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowAssignTestModal(false)}
            />

            <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Assign Tests to {selectedPosition.name}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select which tests should be associated with this position.
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className={`flex items-center justify-between rounded-lg border p-4 ${
                        test.isArchived
                          ? 'border-gray-200 bg-gray-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`test-${test.id}`}
                          checked={selectedTestIds.includes(test.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestIds([...selectedTestIds, test.id]);
                            } else {
                              setSelectedTestIds(
                                selectedTestIds.filter((id) => id !== test.id)
                              );
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={test.isArchived}
                        />
                        <div className="ml-3">
                          <label
                            htmlFor={`test-${test.id}`}
                            className={`text-sm font-medium ${
                              test.isArchived
                                ? 'text-gray-500'
                                : 'text-gray-900'
                            }`}
                          >
                            {test.title}
                          </label>
                          {test.description && (
                            <p
                              className={`text-xs ${
                                test.isArchived
                                  ? 'text-gray-400'
                                  : 'text-gray-500'
                              }`}
                            >
                              {test.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {test.isArchived && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            Archived
                          </span>
                        )}
                        {test.positionId &&
                          test.positionId !== selectedPosition.id && (
                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                              Assigned to other position
                            </span>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignTestModal(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTests}
                  disabled={processing}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {processing ? 'Assigning...' : 'Assign Tests'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
