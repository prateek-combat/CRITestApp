'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  X,
  Mail,
  Send,
  CheckCircle,
  AlertCircle,
  User,
  Users,
  Settings,
} from 'lucide-react';

interface EmailNotificationSettings {
  id?: string;
  emails: string[];
  isEnabled: boolean;
  subject: string;
  template: string;
}

interface EmailNotificationsSectionProps {
  jobProfileId: string;
  jobProfileName: string;
}

export default function EmailNotificationsSection({
  jobProfileId,
  jobProfileName,
}: EmailNotificationsSectionProps) {
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    emails: [],
    isEnabled: false,
    subject: 'Test Completion Notification - {{candidateName}}',
    template: `Hello,

This is to notify you that {{candidateName}} has completed the test for the position: {{jobProfileTitle}}.

Test Details:
- Position: {{jobProfileTitle}}
- Candidate: {{candidateName}}
- Email: {{candidateEmail}}
- Completion Time: {{completionTime}}
- Total Score: {{totalScore}}%

You can view the detailed results in the admin dashboard.

Best regards,
CRI Test Platform`,
  });

  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [jobProfileId]);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/job-profiles/${jobProfileId}/email-notifications`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            id: data.settings.id,
            emails: data.settings.emails || [],
            isEnabled: data.settings.isEnabled,
            subject: data.settings.subject,
            template: data.settings.template,
          });
        }
      } else if (response.status !== 404) {
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
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/job-profiles/${jobProfileId}/email-notifications`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(settings),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, id: data.settings.id }));
        setSuccess('Email notification settings saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
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

  const handleTestEmail = async () => {
    if (settings.emails.length === 0) {
      setError(
        'Please add at least one email address before sending a test email'
      );
      return;
    }

    setSendingTest(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/admin/job-profiles/${jobProfileId}/email-notifications/test`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emails: settings.emails,
            subject: settings.subject,
            template: settings.template,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSuccess(data.message || 'Test email sent successfully!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to send test email'
      );
    } finally {
      setSendingTest(false);
    }
  };

  const addEmail = () => {
    if (
      newEmail &&
      isValidEmail(newEmail) &&
      !settings.emails.includes(newEmail)
    ) {
      setSettings((prev) => ({
        ...prev,
        emails: [...prev.emails, newEmail],
      }));
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setSettings((prev) => ({
      ...prev,
      emails: prev.emails.filter((email) => email !== emailToRemove),
    }));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Email Notifications
          </h3>
          <p className="text-sm text-gray-600">
            Configure email notifications for test completions for this job
            profile
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTestEmail}
            disabled={sendingTest || settings.emails.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendingTest ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600"></div>
            ) : (
              <Send className="h-4 w-4" />
            )}
            Send Test Email
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Save Settings
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-md border-l-4 border-red-500 bg-red-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md border-l-4 border-green-500 bg-green-50 p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-start space-x-3">
              <Settings className="mt-1 h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.isEnabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        isEnabled: e.target.checked,
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900">
                    Enable email notifications for test completions
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  Send emails when candidates complete tests for{' '}
                  {jobProfileName}
                </p>
              </div>
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
              {settings.emails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900">{email}</span>
                  </div>
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
                  settings.emails.includes(newEmail)
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
        </div>

        {/* Right Column - Template Configuration */}
        <div className="space-y-6">
          {/* Email Subject */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Subject
            </label>
            <input
              type="text"
              value={settings.subject}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, subject: e.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Email subject line"
            />
          </div>

          {/* Email Template */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Template
            </label>
            <textarea
              value={settings.template}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, template: e.target.value }))
              }
              rows={12}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Email template content"
            />
          </div>

          {/* Available Placeholders */}
          <div className="rounded-lg bg-blue-50 p-4">
            <h5 className="mb-2 text-sm font-medium text-blue-900">
              Available Placeholders
            </h5>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <code>{'{{candidateName}}'}</code> - Candidate's name
              </p>
              <p>
                <code>{'{{candidateEmail}}'}</code> - Candidate's email
              </p>
              <p>
                <code>{'{{jobProfileTitle}}'}</code> - Job profile name
              </p>
              <p>
                <code>{'{{completionTime}}'}</code> - Test completion time
              </p>
              <p>
                <code>{'{{totalScore}}'}</code> - Overall test score
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preview */}
      {settings.isEnabled && settings.emails.length > 0 && (
        <div className="rounded-lg bg-gray-50 p-4">
          <h5 className="mb-3 text-sm font-medium text-gray-900">
            Email Preview
          </h5>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>Recipients:</strong> {settings.emails.length} email(s) (
              {settings.emails.join(', ')})
            </p>
            <p>
              <strong>Subject:</strong> {settings.subject}
            </p>
            <p>
              <strong>Triggered on:</strong> Test completion for candidates
              applying to {jobProfileName}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
