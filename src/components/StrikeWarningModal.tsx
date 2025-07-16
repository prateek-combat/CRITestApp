'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/button/Button';

interface StrikeWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  strikeCount: number;
  maxAllowed: number;
  strikeLevel: 'first' | 'second';
}

export default function StrikeWarningModal({
  isOpen,
  onClose,
  strikeCount,
  maxAllowed,
  strikeLevel,
}: StrikeWarningModalProps) {
  const isFirstStrike = strikeLevel === 'first';

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="animate-in fade-in zoom-in w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl duration-300">
        <div className="mb-6 flex items-center justify-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${isFirstStrike ? 'bg-yellow-100' : 'bg-orange-100'}`}
          >
            {isFirstStrike ? (
              <svg
                className="h-8 w-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.598 0L4.216 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            ) : (
              <svg
                className="h-8 w-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>
        </div>

        <h3
          className={`mb-4 text-center text-lg font-bold leading-6 ${isFirstStrike ? 'text-yellow-900' : 'text-orange-900'}`}
        >
          {isFirstStrike
            ? 'Copy Detected - Warning'
            : 'Copy Detected - Final Warning'}
        </h3>

        <div className="mb-6 text-center">
          <p className="mb-4 text-gray-700">
            {isFirstStrike
              ? 'We detected that you copied text from the question. This is your first warning.'
              : 'We detected that you copied text from the question again. This is your final warning.'}
          </p>

          <div
            className={`rounded-lg p-4 ${isFirstStrike ? 'border border-yellow-200 bg-yellow-50' : 'border border-orange-200 bg-orange-50'}`}
          >
            <p
              className={`text-sm font-medium ${isFirstStrike ? 'text-yellow-800' : 'text-orange-800'}`}
            >
              Strike {strikeCount} of {maxAllowed}
            </p>
            <p
              className={`mt-1 text-xs ${isFirstStrike ? 'text-yellow-700' : 'text-orange-700'}`}
            >
              {isFirstStrike
                ? `${maxAllowed - strikeCount} warnings remaining before test termination`
                : `${maxAllowed - strikeCount} warning remaining before test termination`}
            </p>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2 font-medium">Please remember:</p>
            <ul className="space-y-1 text-left text-xs">
              <li>• Copying questions or content is not allowed</li>
              <li>• Your test session is being monitored</li>
              <li>• One more copy violation will terminate your test</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className={`${isFirstStrike ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-orange-600 hover:bg-orange-700'} px-6 py-2 text-white`}
          >
            I Understand - Continue Test
          </Button>
        </div>
      </div>
    </div>
  );
}
