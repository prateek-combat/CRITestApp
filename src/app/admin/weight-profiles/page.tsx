'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/button/Button';
import {
  WeightProfile,
  CategoryWeights,
  CATEGORY_DISPLAY_NAMES,
} from '@/types/categories';

interface WeightProfilesPageProps {}

export default function WeightProfilesPage({}: WeightProfilesPageProps) {
  const [profiles, setProfiles] = useState<WeightProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProfile, setEditingProfile] = useState<WeightProfile | null>(
    null
  );

  // Fetch profiles
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetchWithCSRF('/api/admin/category-weights');
      const data = await response.json();

      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.error || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError('Network error fetching profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  // Set default profile
  const handleSetDefault = async (profileId: string) => {
    try {
      const response = await fetchWithCSRF(
        `/api/admin/category-weights/${profileId}/set-default`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();
      if (data.success) {
        await fetchProfiles(); // Refresh the list
      } else {
        setError(data.error || 'Failed to set default profile');
      }
    } catch (err) {
      setError('Network error setting default profile');
    }
  };

  // Delete profile
  const handleDelete = async (profileId: string, profileName: string) => {
    if (!confirm(`Are you sure you want to delete "${profileName}"?`)) {
      return;
    }

    try {
      const response = await fetchWithCSRF(
        `/api/admin/category-weights/${profileId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();
      if (data.success) {
        await fetchProfiles(); // Refresh the list
      } else {
        setError(data.error || 'Failed to delete profile');
      }
    } catch (err) {
      setError('Network error deleting profile');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="mb-6 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">
          Category Weight Profiles
        </h1>
        <p className="text-gray-600">
          Manage different weighting schemes for test categories to create
          customized ranking systems.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6">
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Create New Profile
        </Button>
      </div>

      {/* Profiles List */}
      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={`rounded-lg border-2 p-6 ${
              profile.isDefault
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {profile.name}
                  </h3>
                  {profile.isDefault && (
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">
                      Default
                    </span>
                  )}
                </div>
                {profile.description && (
                  <p className="text-gray-600">{profile.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                {!profile.isDefault && (
                  <Button
                    onClick={() => handleSetDefault(profile.id)}
                    variant="outline"
                    size="sm"
                  >
                    Set as Default
                  </Button>
                )}
                <Button
                  onClick={() => setEditingProfile(profile)}
                  variant="outline"
                  size="sm"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(profile.id, profile.name)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  Delete
                </Button>
              </div>
            </div>

            {/* Weight Visualization */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Object.entries(profile.weights).map(([category, weight]) => (
                <div key={category} className="text-center">
                  <div className="mb-1 text-sm font-medium text-gray-700">
                    {CATEGORY_DISPLAY_NAMES[
                      category as keyof typeof CATEGORY_DISPLAY_NAMES
                    ] || category}
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {weight}%
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${weight}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !loading && (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">No weight profiles found.</p>
          <p className="mt-2 text-gray-400">
            Create your first profile to get started.
          </p>
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingProfile) && (
        <WeightProfileForm
          profile={editingProfile}
          onClose={() => {
            setShowCreateForm(false);
            setEditingProfile(null);
          }}
          onSave={async () => {
            await fetchProfiles();
            setShowCreateForm(false);
            setEditingProfile(null);
          }}
        />
      )}
    </div>
  );
}

// Weight Profile Form Component
interface WeightProfileFormProps {
  profile?: WeightProfile | null;
  onClose: () => void;
  onSave: () => void;
}

function WeightProfileForm({
  profile,
  onClose,
  onSave,
}: WeightProfileFormProps) {
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    description: profile?.description || '',
    weights: profile?.weights || {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    const totalWeight = Object.values(formData.weights).reduce(
      (sum, w) => sum + w,
      0
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      newErrors.weights = `Weights must sum to 100%. Current total: ${totalWeight}%`;
    }

    Object.entries(formData.weights).forEach(([category, weight]) => {
      if (weight < 0) {
        newErrors[category] = 'Weight cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleWeightChange = (category: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      weights: {
        ...prev.weights,
        [category]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const url = profile
        ? `/api/admin/category-weights/${profile.id}`
        : '/api/admin/category-weights';

      const method = profile ? 'PUT' : 'POST';

      const response = await fetchWithCSRF(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        onSave();
      } else {
        setErrors({ form: data.error || 'Failed to save profile' });
      }
    } catch (err) {
      setErrors({ form: 'Network error saving profile' });
    } finally {
      setSaving(false);
    }
  };

  const totalWeight = Object.values(formData.weights).reduce(
    (sum, w) => sum + w,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white">
        <div className="p-6">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            {profile ? 'Edit Weight Profile' : 'Create New Weight Profile'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profile Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Verbal Focused"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description of when to use this profile..."
              />
            </div>

            {/* Weights */}
            <div>
              <label className="mb-4 block text-sm font-medium text-gray-700">
                Category Weights
              </label>
              <div className="space-y-4">
                {Object.entries(formData.weights).map(([category, weight]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700">
                        {CATEGORY_DISPLAY_NAMES[
                          category as keyof typeof CATEGORY_DISPLAY_NAMES
                        ] || category}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={weight}
                        onChange={(e) =>
                          handleWeightChange(
                            category,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-20 rounded border border-gray-300 px-2 py-1 text-center"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    {errors[category] && (
                      <p className="text-sm text-red-600">{errors[category]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total:</span>
                  <span
                    className={`font-bold ${Math.abs(totalWeight - 100) > 0.01 ? 'text-red-600' : 'text-green-600'}`}
                  >
                    {totalWeight.toFixed(1)}%
                  </span>
                </div>
              </div>

              {errors.weights && (
                <p className="mt-1 text-sm text-red-600">{errors.weights}</p>
              )}
            </div>

            {errors.form && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">{errors.form}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button onClick={onClose} variant="outline" disabled={saving}>
                Cancel
              </Button>
              <button
                type="submit"
                disabled={saving || Math.abs(totalWeight - 100) > 0.01}
                className="shadow-theme-xs inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : profile
                    ? 'Update Profile'
                    : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
