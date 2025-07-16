'use client';

import { useEffect } from 'react';
import Button from '@/components/ui/button/Button';

interface FocusWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  blurCount: number;
  isReturning: boolean;
}

export default function FocusWarningModal({
  isOpen,
  onClose,
  blurCount,
  isReturning,
}: FocusWarningModalProps) {
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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.598 0L4.216 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>

        <h3 className="mb-4 text-center text-lg font-bold leading-6 text-orange-900">
          {isReturning ? 'Welcome Back - Focus Required' : 'Focus Warning'}
        </h3>

        <div className="mb-6 text-center">
          <p className="mb-4 text-gray-700">
            {isReturning
              ? 'You have returned to the test window. Please keep your focus on the test.'
              : 'We detected that you switched away from the test window. Please keep your focus on the test at all times.'}
          </p>

          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <p className="text-sm font-medium text-orange-800">
              Window Switch Count: {blurCount}
            </p>
            <p className="mt-1 text-xs text-orange-700">
              Multiple window switches may affect your test evaluation
            </p>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="mb-2 font-medium">Please remember:</p>
            <ul className="space-y-1 text-left text-xs">
              <li>• Keep the test window in focus at all times</li>
              <li>• Do not switch to other applications or windows</li>
              <li>• Do not use multiple windows side by side</li>
              <li>• Your activity is being monitored</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className="bg-orange-600 px-6 py-2 text-white hover:bg-orange-700"
          >
            I Understand - Continue Test
          </Button>
        </div>
      </div>
    </div>
  );
}
