'use client';
import React from 'react';
import { Modal } from './modal';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false,
  icon,
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          defaultIcon: <Trash2 className="h-6 w-6" />,
        };
      case 'warning':
        return {
          iconBg: 'bg-yellow-100',
          iconColor: 'text-yellow-600',
          confirmButton:
            'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          defaultIcon: <AlertTriangle className="h-6 w-6" />,
        };
      case 'info':
        return {
          iconBg: 'bg-slateblue/12',
          iconColor: 'text-slateblue',
          confirmButton: 'bg-ink hover:bg-ink/90 focus:ring-copper/40',
          defaultIcon: <AlertTriangle className="h-6 w-6" />,
        };
      default:
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          defaultIcon: <Trash2 className="h-6 w-6" />,
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      showCloseButton={false}
      className="mx-4 max-w-md"
    >
      <div className="p-6">
        <div className="flex items-start">
          <div
            className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}
          >
            <div className={styles.iconColor}>{icon || styles.defaultIcon}</div>
          </div>
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            <h3 className="text-lg font-medium leading-6 text-ink">{title}</h3>
            <div className="mt-2">
              <p className="whitespace-pre-line text-sm text-ink/60">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${styles.confirmButton} ${
              isLoading ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Processing...
              </div>
            ) : (
              confirmText
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className={`mt-3 inline-flex w-full justify-center rounded-md border border-ink/20 bg-parchment/80 px-4 py-2 text-base font-medium text-ink/70 shadow-sm hover:bg-parchment focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm ${
              isLoading ? 'cursor-not-allowed opacity-50' : ''
            }`}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
