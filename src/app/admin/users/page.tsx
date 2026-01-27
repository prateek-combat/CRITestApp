'use client';

import { fetchWithCSRF } from '@/lib/csrf';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import InfoPanel from '@/components/ui/InfoPanel';
import { Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'ADMIN',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );

  // Only SUPER_ADMIN can access this page
  useEffect(() => {
    if (session && session.user.role !== 'SUPER_ADMIN') {
      router.push('/admin/dashboard');
    }
  }, [session, router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchWithCSRF('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      logger.error(
        'Error fetching users',
        {
          component: 'AdminUsersPage',
          operation: 'fetch_users',
          userRole: session?.user?.role,
        },
        error as Error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const response = await fetchWithCSRF('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Admin user added successfully!');
        setNewUser({ email: '', firstName: '', lastName: '', role: 'ADMIN' });
        setShowAddForm(false);
        fetchUsers();
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error adding user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetchWithCSRF(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        setMessage('✅ User role updated successfully!');
        fetchUsers();
      } else {
        const data = await response.json();
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error updating user role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const response = await fetchWithCSRF(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Admin user deleted successfully!');
        fetchUsers();
      } else {
        if (data.hasContent) {
          setMessage(`⚠️ ${data.message}`);
        } else {
          setMessage(`❌ Error: ${data.message}`);
        }
      }
    } catch (error) {
      setMessage('❌ Error deleting user');
    } finally {
      setDeletingUserId(null);
      setShowDeleteConfirm(null);
    }
  };

  if (session?.user.role !== 'SUPER_ADMIN') {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2 text-gray-600">
          Only Super Admins can manage users.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Admin User Management
        </h1>
        <p className="text-sm text-gray-600">
          Manage admin users who can access the admin panel via Google sign-in
        </p>
      </div>

      {/* Info Panel */}
      <InfoPanel
        title="🔐 User Management Guide"
        variant="warning"
        dismissible={true}
      >
        <div className="space-y-2">
          <p>
            <strong>Important Notes:</strong>
          </p>
          <ul className="ml-4 list-disc space-y-1 text-sm">
            <li>Only Super Admins can add, modify, or delete admin users</li>
            <li>Users sign in with their Google account (OAuth)</li>
            <li>ADMIN role: Access to all features except user management</li>
            <li>SUPER_ADMIN role: Full access including user management</li>
          </ul>
          <p className="text-sm font-medium text-amber-700">
            ⚠️ Warning: Be careful when deleting users with existing content!
          </p>
        </div>
      </InfoPanel>

      {message && (
        <div
          className={`mb-4 rounded-lg p-3 ${
            message.includes('✅')
              ? 'bg-green-100 text-green-800'
              : message.includes('⚠️')
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}
        >
          {message}
        </div>
      )}

      {/* Add User Button */}
      <div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-700/50 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
        >
          {showAddForm ? 'Cancel' : '+ Add New Admin'}
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold">Add New Admin User</h2>
          <form onSubmit={handleAddUser} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Email (Google Account) *
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Role *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={newUser.firstName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, firstName: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newUser.lastName}
                  onChange={(e) =>
                    setNewUser({ ...newUser, lastName: e.target.value })
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Admin User'}
              </button>
            </div>
          </form>
          <div className="mt-3 space-y-2">
            <div className="rounded-md bg-blue-50 p-2">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> The user must sign in with their Google
                account first. Only pre-registered admin emails can access the
                admin panel.
              </p>
            </div>
            <div className="rounded-md bg-amber-50 p-2">
              <p className="text-xs text-amber-800">
                <strong>Delete Policy:</strong> Users who have created tests,
                invitations, or public links cannot be deleted to preserve data
                integrity. Change their role instead if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName || user.lastName
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : 'No name set'}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {user.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    disabled={user.id === session?.user.id} // Can't change own role
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {user.id === session?.user.id ? (
                    <span className="font-medium text-brand-600">
                      Current User
                    </span>
                  ) : (
                    <div className="flex justify-end gap-1">
                      {showDeleteConfirm === user.id ? (
                        <>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                            className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {deletingUserId === user.id
                              ? 'Deleting...'
                              : 'Confirm'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowDeleteConfirm(user.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
