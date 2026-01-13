'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function TestCompletionPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate brief loading for cleanup processes
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mb-6">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <h2 className="mb-2 text-xl font-semibold text-gray-900">
              Finalizing Your Submission...
            </h2>
            <p className="text-gray-600">
              Stopping camera and uploading data securely...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="max-w-lg rounded-lg bg-white p-8 text-center shadow-md">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-800">Thank You!</h1>
          <p className="mb-6 text-lg text-gray-600">
            Your test has been completed successfully and all data has been
            securely uploaded.
          </p>

          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-2 flex items-center justify-center">
              <svg
                className="mr-2 h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-green-800">
                Submission Complete
              </span>
            </div>
            <p className="text-sm text-green-700">
              Camera access has been released and your responses have been
              recorded.
            </p>
          </div>

          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h3 className="mb-2 font-medium text-blue-800">
              What happens next?
            </h3>
            <p className="text-sm text-blue-700">
              Our team will review your submission and may contact you regarding
              next steps. We appreciate your patience while we evaluate your
              performance.
            </p>
          </div>

          <p className="text-sm text-gray-500">
            You may now close this window safely.
          </p>
        </div>
      </div>
    </div>
  );
}
