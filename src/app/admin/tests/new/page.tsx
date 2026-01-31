'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateTestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    allowReview: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetchWithCSRF('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          allowReview: formData.allowReview,
        }),
      });

      if (response.ok) {
        const test = await response.json();
        router.push(`/admin/tests/${test.id}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create test');
      }
    } catch (error) {
      setError('An error occurred while creating the test');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div className="min-h-screen space-y-6 bg-parchment/90 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Create New Test</h1>
          <p className="text-ink/60">Set up a new assessment test</p>
        </div>
        <Link
          href="/admin/tests"
          className="flex items-center gap-2 text-ink/60 hover:text-ink"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Tests
        </Link>
      </div>

      <div className="rounded-lg border border-ink/10 bg-parchment/80 shadow-md transition-shadow duration-300 hover:shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div
              className="rounded-md border-l-4 border-red-500 bg-red-100 p-4 text-red-700"
              role="alert"
            >
              <div className="flex">
                <div className="py-1">
                  <svg
                    className="mr-3 h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-bold">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-ink/70"
              >
                Test Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-copper/50 focus:ring-2 focus:ring-copper/40"
                placeholder="Enter test title"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-ink/70"
              >
                Test Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-lg border border-ink/20 px-3 py-2 focus:border-copper/50 focus:ring-2 focus:ring-copper/40"
                placeholder="Enter test description (optional)"
              />
            </div>

            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="allowReview"
                name="allowReview"
                checked={formData.allowReview}
                onChange={handleChange}
                className="mt-1 h-4 w-4 rounded border-ink/20 text-copper focus:ring-copper/40"
              />
              <div className="flex-1">
                <label
                  htmlFor="allowReview"
                  className="block text-sm font-medium text-ink/70"
                >
                  Allow Review & Navigation
                </label>
                <p className="text-sm text-ink/50">
                  When enabled, candidates can bookmark questions, review their
                  answers, and navigate back to previous questions. When
                  disabled, candidates can only move forward through the test.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 border-t border-ink/10 pt-6">
            <Link
              href="/admin/tests"
              className="rounded-lg bg-parchment/90 px-4 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-2"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="rounded-lg bg-copper/100 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-ink focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>

      <div
        className="bg-slateblue/12 rounded-md border-l-4 border-slateblue/40 p-4 text-slateblue"
        role="alert"
      >
        <div className="flex">
          <div className="py-1">
            <svg
              className="mr-3 h-6 w-6 text-slateblue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <p className="font-bold">Next Steps</p>
            <p className="text-sm">
              After creating the test, you&apos;ll be able to add questions and
              configure settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
