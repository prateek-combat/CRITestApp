'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/ui/button/Button';

interface TestTerminationPageProps {
  reason: string;
  strikeCount: number;
  maxAllowed: number;
  onClose?: () => void;
}

export default function TestTerminationPage({
  reason,
  strikeCount,
  maxAllowed,
  onClose,
}: TestTerminationPageProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Prevent user from navigating away or refreshing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F5, Ctrl+R, Ctrl+F5
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCloseWindow = () => {
    setIsClosing(true);

    if (onClose) {
      onClose();
      return;
    }

    // Try multiple methods to close the window/tab
    try {
      // Method 1: Try to close the window (works if opened via JavaScript)
      window.close();

      // Method 2: If window.close() doesn't work, try to navigate to a blank page
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = 'about:blank';
        }
      }, 100);

      // Method 3: If still doesn't work, try to go back in history
      setTimeout(() => {
        if (!window.closed && window.location.href !== 'about:blank') {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            // Method 4: Navigate to root or show message
            window.location.href = '/';
          }
        }
      }, 200);
    } catch (e) {
      console.error('Error closing window:', e);
      // Fallback: Navigate to root
      window.location.href = '/';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mb-6">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-10 w-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-red-800">
            Test Terminated
          </h1>

          <p className="mb-4 text-red-700">
            Your test session has been terminated due to policy violations.
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 font-semibold text-red-800">
            Termination Details:
          </h3>
          <p className="mb-3 text-sm text-red-700">{reason}</p>

          <div className="rounded bg-red-100 p-3 text-sm">
            <p className="font-medium text-red-800">
              Copy Violations: {strikeCount}/{maxAllowed}
            </p>
            <p className="mt-1 text-red-700">
              You exceeded the maximum allowed copy attempts during the test.
            </p>
          </div>
        </div>

        <div className="mb-6 text-left text-sm text-gray-600">
          <h4 className="mb-2 font-medium">What happened:</h4>
          <ul className="space-y-1">
            <li>• Our system detected {strikeCount} copy attempts</li>
            <li>• The maximum allowed is {maxAllowed} copy attempts</li>
            <li>• Your test session was automatically terminated</li>
            <li>• This action cannot be reversed</li>
          </ul>
        </div>

        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h4 className="mb-2 font-semibold text-yellow-800">
            Important Notes:
          </h4>
          <ul className="space-y-1 text-left text-sm text-yellow-700">
            <li>• Your test progress has been saved</li>
            <li>• This incident has been logged</li>
            <li>• Contact support if you believe this is an error</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <div className="text-center">
            <p className="mb-2 text-sm text-gray-600">For support, email:</p>
            <p className="font-medium text-blue-600">
              support@combatrobotics.in
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleCloseWindow}
              disabled={isClosing}
              className="bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
            >
              {isClosing ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Closing...
                </div>
              ) : (
                'Close Window/Tab'
              )}
            </Button>

            <button
              onClick={() => (window.location.href = '/')}
              className="text-sm text-gray-500 underline hover:text-gray-700"
            >
              Go to Home Page
            </button>
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          Session ID: {new Date().toISOString()}
        </p>
      </div>
    </div>
  );
}
