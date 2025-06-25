'use client';
import { useState } from 'react';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  isLoading: boolean;
  onConfirm: () => void;
}

export const useConfirmation = () => {
  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    {
      isOpen: false,
      isLoading: false,
      title: '',
      message: '',
      onConfirm: () => {},
    }
  );

  const showConfirmation = (
    options: ConfirmationOptions,
    onConfirm: () => void | Promise<void>
  ) => {
    setConfirmationState({
      ...options,
      isOpen: true,
      isLoading: false,
      onConfirm: async () => {
        setConfirmationState((prev) => ({ ...prev, isLoading: true }));
        try {
          await onConfirm();
          setConfirmationState((prev) => ({
            ...prev,
            isOpen: false,
            isLoading: false,
          }));
        } catch (error) {
          setConfirmationState((prev) => ({ ...prev, isLoading: false }));
          // Re-throw the error so the calling code can handle it
          throw error;
        }
      },
    });
  };

  const hideConfirmation = () => {
    if (!confirmationState.isLoading) {
      setConfirmationState((prev) => ({ ...prev, isOpen: false }));
    }
  };

  return {
    confirmationState,
    showConfirmation,
    hideConfirmation,
  };
};
