'use client';

import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Send, Mail } from 'lucide-react';

interface QuickLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: string;
  linkType: 'public' | 'timeSlot';
  profileName: string;
  timeSlotName?: string;
}

export default function QuickLinkModal({
  isOpen,
  onClose,
  link,
  linkType,
  profileName,
  timeSlotName,
}: QuickLinkModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState(
    `Assessment Link for ${profileName}${timeSlotName ? ` - ${timeSlotName}` : ''}`
  );
  const [emailBody, setEmailBody] = useState(
    `Hello,\n\nPlease use the following link to complete your assessment:\n\n${link}\n\n${
      linkType === 'timeSlot'
        ? `This link is only valid during the scheduled time slot: ${timeSlotName}.\n\n`
        : ''
    }Best regards`
  );

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const sendEmail = () => {
    const mailto = `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailto;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {linkType === 'public'
                  ? 'Public Link Generated'
                  : 'Time Slot Link Generated'}
              </h3>
              <button
                onClick={onClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm text-gray-600">
                  Your assessment link for <strong>{profileName}</strong>
                  {timeSlotName && (
                    <>
                      {' '}
                      - <strong>{timeSlotName}</strong>
                    </>
                  )}{' '}
                  has been generated:
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={link}
                    readOnly
                    className="flex-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="mb-3 text-sm font-medium text-gray-900">
                  Send Link via Email
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      To:
                    </label>
                    <input
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="candidate@example.com"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Subject:
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Message:
                    </label>
                    <textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      rows={5}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="gap-2 bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
            <button
              onClick={sendEmail}
              disabled={!emailTo}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </button>
            <button
              onClick={onClose}
              className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:ml-3 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
