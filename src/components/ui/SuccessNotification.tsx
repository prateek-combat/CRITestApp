'use client';

import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SuccessNotificationProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function SuccessNotification({
  message,
  isVisible,
  onClose,
  duration = 5000,
}: SuccessNotificationProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="animate-slide-in-right fixed right-4 top-4 z-50">
      <div className="max-w-md rounded-lg border border-moss/30 bg-parchment/90 p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-moss" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-ink">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded p-1 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
