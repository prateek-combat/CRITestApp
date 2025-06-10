'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Mail, Settings, Users, BarChart3 } from 'lucide-react';

interface EmailNotificationSettingsProps {
  testId: string;
  testTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

interface NotificationSettings {
  emailNotificationsEnabled: boolean;
  notificationEmails: string[];
  includeAnalytics: boolean;
}

export default function EmailNotificationSettings({
  testId,
  testTitle,
  isOpen,
  onClose,
  onSave,
}: EmailNotificationSettingsProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotificationsEnabled: true,
    notificationEmails: [
      'prateek@combatrobotics.in',
      'gaurav@combatrobotics.in',
    ],
    includeAnalytics: true,
  });
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && testId) {
      fetchSettings();
    }
  }, [isOpen, testId]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tests/${testId}/notifications`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        throw new Error('Failed to fetch notification settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/tests/${testId}/notifications`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onSave?.();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addEmail = () => {
    if (newEmail && !settings.notificationEmails.includes(newEmail)) {
      setSettings((prev) => ({
        ...prev,
        notificationEmails: [...prev.notificationEmails, newEmail],
      }));
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setSettings((prev) => ({
      ...prev,
      notificationEmails: prev.notificationEmails.filter(
        (email) => email !== emailToRemove
      ),
    }));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500">{testTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 rounded-md border-l-4 border-red-500 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Enable/Disable Notifications */}
                <div className="flex items-start space-x-3">
                  <Settings className="mt-1 h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.emailNotificationsEnabled}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            emailNotificationsEnabled: e.target.checked,
                          }))
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        Enable email notifications for test completions
                      </span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Send emails when candidates complete this test
                    </p>
                  </div>
                </div>

                {/* Analytics Option */}
                <div className="flex items-start space-x-3">
                  <BarChart3 className="mt-1 h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.includeAnalytics}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            includeAnalytics: e.target.checked,
                          }))
                        }
                        disabled={!settings.emailNotificationsEnabled}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        Include detailed analytics and ranking
                      </span>
                    </label>
                    <p className="mt-1 text-sm text-gray-500">
                      Include score, rank, and performance analysis in emails
                    </p>
                  </div>
                </div>

                {/* Email Recipients */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900">
                      Email Recipients
                    </h4>
                  </div>

                  {/* Current Recipients */}
                  <div className="space-y-2">
                    {settings.notificationEmails.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2"
                      >
                        <span className="text-sm text-gray-900">{email}</span>
                        <button
                          onClick={() => removeEmail(email)}
                          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add New Email */}
                  <div className="flex space-x-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && addEmail()}
                    />
                    <button
                      onClick={addEmail}
                      disabled={
                        !newEmail ||
                        !isValidEmail(newEmail) ||
                        settings.notificationEmails.includes(newEmail)
                      }
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {newEmail && !isValidEmail(newEmail) && (
                    <p className="text-sm text-red-600">
                      Please enter a valid email address
                    </p>
                  )}
                </div>

                {/* Preview */}
                {settings.emailNotificationsEnabled && (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <h5 className="mb-2 text-sm font-medium text-gray-900">
                      Email Preview
                    </h5>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Subject:</strong> Test Completion: {testTitle}
                      </p>
                      <p>
                        <strong>Recipients:</strong>{' '}
                        {settings.notificationEmails.length} email(s)
                      </p>
                      <p>
                        <strong>Content:</strong> Candidate details, score
                        {settings.includeAnalytics
                          ? ', ranking, and performance analysis'
                          : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 border-t border-gray-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
