'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PublicTestLink {
  id: string;
  testId: string;
  testTitle: string;
  linkToken: string;
  title: string;
  description?: string;
  isActive: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  attemptsCount: number;
  createdAt: string;
  publicUrl: string;
}

export default function PublicLinksPage() {
  const [publicLinks, setPublicLinks] = useState<PublicTestLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicLinks();
  }, []);

  const fetchPublicLinks = async () => {
    try {
      const response = await fetch('/api/public-test-links');
      if (response.ok) {
        const data = await response.json();
        setPublicLinks(data);
      } else {
        console.error('Failed to fetch public links');
      }
    } catch (error) {
      console.error('Error fetching public links:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkStatus = async (linkId: string, currentStatus: boolean) => {
    setUpdating(linkId);
    try {
      const response = await fetch(`/api/public-test-links/admin/${linkId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchPublicLinks();
        alert(
          `✅ Link ${!currentStatus ? 'activated' : 'deactivated'} successfully!`
        );
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to update link'}`);
      }
    } catch (error) {
      console.error('Error updating link:', error);
      alert('❌ Network error occurred');
    } finally {
      setUpdating(null);
    }
  };

  const deleteLink = async (linkId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this public test link? This action cannot be undone.'
      )
    ) {
      return;
    }

    setDeleting(linkId);
    try {
      const response = await fetch(`/api/public-test-links/admin/${linkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPublicLinks();
        alert('✅ Link deleted successfully!');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error || 'Failed to delete link'}`);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      alert('❌ Network error occurred');
    } finally {
      setDeleting(null);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert('✅ Link copied to clipboard!');
    } catch (error) {
      alert('❌ Failed to copy link to clipboard');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
          <p className="text-gray-600">Loading public test links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Public Test Links
          </h1>
          <p className="mt-1 text-gray-600">
            Manage public test links that allow multiple candidates to access
            tests
          </p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <span className="text-2xl">🔗</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {publicLinks.length}
              </h3>
              <p className="text-sm text-gray-600">Total Links</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {publicLinks.filter((link) => link.isActive).length}
              </h3>
              <p className="text-sm text-gray-600">Active Links</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <span className="text-2xl">👥</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {publicLinks.reduce((sum, link) => sum + link.usedCount, 0)}
              </h3>
              <p className="text-sm text-gray-600">Total Uses</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                <span className="text-2xl">📝</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {publicLinks.reduce((sum, link) => sum + link.attemptsCount, 0)}
              </h3>
              <p className="text-sm text-gray-600">Test Attempts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Public Links List */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Public Test Links ({publicLinks.length})
          </h2>
        </div>

        {publicLinks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">🔗</div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              No Public Links Yet
            </h3>
            <p className="mb-6 text-gray-600">
              Create public test links from the Invitations page to allow
              multiple candidates to access tests.
            </p>
            <Link
              href="/admin/invitations"
              className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go to Invitations
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Test & Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {publicLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {link.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            Test: {link.testTitle}
                          </div>
                          {link.description && (
                            <div className="mt-1 text-xs text-gray-400">
                              {link.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            link.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {link.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          {link.usedCount} uses
                          {link.maxUses && ` / ${link.maxUses}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {link.attemptsCount} attempts
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {link.expiresAt ? (
                          <div>
                            {formatDate(link.expiresAt)}
                            {new Date(link.expiresAt) < new Date() && (
                              <div className="text-xs text-red-500">
                                Expired
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(link.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(link.publicUrl)}
                            className="text-brand-600 hover:text-brand-900"
                            title="Copy Link"
                          >
                            📋
                          </button>
                          <button
                            onClick={() =>
                              toggleLinkStatus(link.id, link.isActive)
                            }
                            disabled={updating === link.id}
                            className={`${
                              link.isActive
                                ? 'text-red-600 hover:text-red-900'
                                : 'text-green-600 hover:text-green-900'
                            } disabled:opacity-50`}
                            title={link.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {updating === link.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : link.isActive ? (
                              '🔴'
                            ) : (
                              '🟢'
                            )}
                          </button>
                          <button
                            onClick={() => deleteLink(link.id)}
                            disabled={deleting === link.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete"
                          >
                            {deleting === link.id ? (
                              <span className="animate-spin">⏳</span>
                            ) : (
                              '🗑️'
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
