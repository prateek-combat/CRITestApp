'use client';

import { useState, useEffect } from 'react';
import { PersonalityDimension } from '@prisma/client';

interface CreateDimensionFormData {
  name: string;
  description: string;
  code: string;
}

interface ValidationErrors {
  name?: string;
  description?: string;
  code?: string;
  general?: string;
}

export default function PersonalityDimensionsAdminPage() {
  const [dimensions, setDimensions] = useState<PersonalityDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDimension, setEditingDimension] =
    useState<PersonalityDimension | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState<CreateDimensionFormData>({
    name: '',
    description: '',
    code: '',
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      const response = await fetch('/api/personality-dimensions');
      if (!response.ok) throw new Error('Failed to fetch dimensions');
      const data = await response.json();
      setDimensions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dimensions'
      );
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (data: CreateDimensionFormData): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (!data.name.trim()) {
      errors.name = 'Name is required';
    } else if (data.name.length > 200) {
      errors.name = 'Name must be 200 characters or less';
    }

    if (!data.code.trim()) {
      errors.code = 'Code is required';
    } else if (data.code.length > 50) {
      errors.code = 'Code must be 50 characters or less';
    } else if (!/^[A-Z_]+$/.test(data.code)) {
      errors.code = 'Code must contain only uppercase letters and underscores';
    }

    // Check for duplicate codes (excluding current dimension when editing)
    const existingDimension = dimensions.find(
      (d) =>
        d.code === data.code &&
        (!editingDimension || d.id !== editingDimension.id)
    );
    if (existingDimension) {
      errors.code = 'This code is already in use';
    }

    if (data.description && data.description.length > 1000) {
      errors.description = 'Description must be 1000 characters or less';
    }

    return errors;
  };

  const handleCreateDimension = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setValidationErrors({});

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/personality-dimensions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dimension');
      }

      await fetchDimensions();
      setShowCreateForm(false);
      setFormData({ name: '', description: '', code: '' });
      setValidationErrors({});
    } catch (err) {
      setValidationErrors({
        general:
          err instanceof Error ? err.message : 'Failed to create dimension',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateDimension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDimension) return;

    setSaving(true);
    setValidationErrors({});

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/personality-dimensions/${editingDimension.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update dimension');
      }

      await fetchDimensions();
      setShowEditForm(false);
      setEditingDimension(null);
      setFormData({ name: '', description: '', code: '' });
      setValidationErrors({});
    } catch (err) {
      setValidationErrors({
        general:
          err instanceof Error ? err.message : 'Failed to update dimension',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDimension = async (dimension: PersonalityDimension) => {
    if (
      !confirm(
        `Are you sure you want to delete "${dimension.name}"? This action cannot be undone and may affect existing personality questions.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/personality-dimensions/${dimension.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete dimension');
      }

      await fetchDimensions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete dimension'
      );
    }
  };

  const handleEditClick = (dimension: PersonalityDimension) => {
    setEditingDimension(dimension);
    setFormData({
      name: dimension.name,
      description: dimension.description || '',
      code: dimension.code,
    });
    setValidationErrors({});
    setShowEditForm(true);
    setShowCreateForm(false);
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingDimension(null);
    setFormData({ name: '', description: '', code: '' });
    setValidationErrors({});
  };

  const handleCancelCreate = () => {
    setShowCreateForm(false);
    setFormData({ name: '', description: '', code: '' });
    setValidationErrors({});
  };

  const generateCodeFromName = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate code if it's empty or was previously auto-generated
      code:
        prev.code === '' || prev.code === generateCodeFromName(prev.name)
          ? generateCodeFromName(name)
          : prev.code,
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="mt-4 text-lg text-gray-700">
            Loading personality dimensions...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div
          className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchDimensions();
            }}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-md md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Personality Dimensions
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Manage personality assessment dimensions and traits used in tests
            </p>
            <p className="text-sm text-gray-500">
              {dimensions.length} dimension{dimensions.length !== 1 ? 's' : ''}{' '}
              configured
            </p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setShowEditForm(false);
              setEditingDimension(null);
              setValidationErrors({});
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              showCreateForm
                ? 'bg-gray-500 hover:bg-gray-600 focus:ring-gray-500'
                : 'bg-brand-500 hover:bg-brand-600 focus:ring-brand-500'
            }`}
          >
            {showCreateForm ? 'Cancel' : 'Add Dimension'}
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateDimension}
            className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Personality Dimension
              </h3>
              <p className="text-sm text-gray-600">
                Define a new personality trait or dimension for assessment
              </p>
            </div>

            {validationErrors.general && (
              <div className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700">
                <p className="font-bold">Error creating dimension:</p>
                <p>{validationErrors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="create-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dimension Name *
                </label>
                <input
                  type="text"
                  id="create-name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                    validationErrors.name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-brand-500'
                  }`}
                  placeholder="e.g., Leadership Potential"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="create-code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dimension Code *
                </label>
                <input
                  type="text"
                  id="create-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                    validationErrors.code
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-brand-500'
                  }`}
                  placeholder="e.g., LEADERSHIP_POTENTIAL"
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.code}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Uppercase letters and underscores only. Used for data storage
                  and analytics.
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="create-description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="create-description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                  validationErrors.description
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-brand-500'
                }`}
                placeholder="Describe what this dimension measures and how it's used in assessment..."
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional. Helps test creators understand what this dimension
                measures.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={handleCancelCreate}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Dimension'}
              </button>
            </div>
          </form>
        )}

        {/* Edit Form */}
        {showEditForm && editingDimension && (
          <form
            onSubmit={handleUpdateDimension}
            className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Personality Dimension
                </h3>
                <p className="text-sm text-gray-600">
                  Modify the details of &quot;{editingDimension.name}&quot;
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {validationErrors.general && (
              <div className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700">
                <p className="font-bold">Error updating dimension:</p>
                <p>{validationErrors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-name"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dimension Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={formData.name}
                  onChange={handleNameChange}
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                    validationErrors.name
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-brand-500'
                  }`}
                  placeholder="e.g., Leadership Potential"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="edit-code"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dimension Code *
                </label>
                <input
                  type="text"
                  id="edit-code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                    validationErrors.code
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-brand-500'
                  }`}
                  placeholder="e.g., LEADERSHIP_POTENTIAL"
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">
                    {validationErrors.code}
                  </p>
                )}
                <p className="mt-1 text-xs text-orange-600">
                  ⚠️ Changing the code may affect existing analytics and reports
                </p>
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className={`mt-1 block w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-brand-500 sm:text-sm ${
                  validationErrors.description
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300 focus:border-brand-500'
                }`}
                placeholder="Describe what this dimension measures..."
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {validationErrors.description}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Update Dimension'}
              </button>
            </div>
          </form>
        )}

        {/* Dimensions List */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-md">
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Existing Dimensions ({dimensions.length})
            </h2>
          </div>

          {dimensions.length === 0 ? (
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14-7H3a2 2 0 00-2 2v9a2 2 0 002 2h6l2 2h6a2 2 0 002-2V6a2 2 0 00-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No dimensions yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first personality dimension to start building
                personality assessments.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
              >
                Add Dimension
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {dimensions.map((dimension) => (
                <div key={dimension.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {dimension.name}
                        </h3>
                        <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-0.5 text-sm font-medium text-brand-800">
                          {dimension.code}
                        </span>
                      </div>
                      {dimension.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {dimension.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          Created:{' '}
                          {new Date(dimension.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          Updated:{' '}
                          {new Date(dimension.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(dimension)}
                        className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDimension(dimension)}
                        className="rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Info */}
        {dimensions.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start">
              <svg
                className="mr-3 h-5 w-5 text-blue-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-800">
                  How to use personality dimensions
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>
                    • Dimensions are used when creating personality assessment
                    questions in tests
                  </li>
                  <li>
                    • Each personality question must be assigned to exactly one
                    dimension
                  </li>
                  <li>
                    • Candidate responses are weighted and aggregated by
                    dimension for personality profiles
                  </li>
                  <li>
                    • Dimension codes are used in analytics and reporting -
                    avoid changing them once in use
                  </li>
                  <li>
                    • Aim for 3-5 questions per dimension for reliable
                    assessment results
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
