'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Test {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  questionsCount: number;
  invitationsCount: number;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const response = await fetch('/api/tests');
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-6 bg-gray-100 p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Tests</h1>
          <p className="text-gray-600">
            Create and manage your assessment tests
          </p>
        </div>
        <Link
          href="/admin/tests/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
        >
          Create New Test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="mx-auto max-w-md">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tests</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first test.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/tests/new"
                className="rounded-lg bg-brand-500 px-4 py-2 text-white transition-colors hover:bg-brand-600"
              >
                Create Test
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Questions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Invitations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tests.map((test) => (
                  <tr key={test.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {test.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {test.description}
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {test.questionsCount || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {test.invitationsCount || 0}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(test.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <Link
                        href={`/admin/tests/${test.id}`}
                        className="mr-4 text-brand-600 hover:text-brand-700"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/tests/${test.id}/analytics`}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        Analytics
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
