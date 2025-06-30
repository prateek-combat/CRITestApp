'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Info, X } from 'lucide-react';

interface InfoPanelProps {
  title: string;
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'neutral';
  defaultOpen?: boolean;
  dismissible?: boolean;
  className?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  title,
  children,
  variant = 'info',
  defaultOpen = false,
  dismissible = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const variantStyles = {
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: 'text-blue-600',
      button: 'text-blue-700 hover:text-blue-900 hover:bg-blue-100',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: 'text-amber-600',
      button: 'text-amber-700 hover:text-amber-900 hover:bg-amber-100',
    },
    success: {
      container: 'bg-green-50 border-green-200 text-green-900',
      icon: 'text-green-600',
      button: 'text-green-700 hover:text-green-900 hover:bg-green-100',
    },
    neutral: {
      container: 'bg-gray-50 border-gray-200 text-gray-900',
      icon: 'text-gray-600',
      button: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
    },
  };

  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`overflow-hidden rounded-lg border-2 shadow-sm ${styles.container} ${className}`}
    >
      <div
        className={`flex cursor-pointer items-center justify-between p-3 transition-all duration-200 ${styles.button}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Info className={`h-4 w-4 ${styles.icon}`} />
          <span className="text-sm font-medium">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {dismissible && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
              }}
              className={`rounded-md p-1 transition-colors ${styles.button}`}
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-current border-opacity-20 px-3 pb-3 pt-1 text-sm">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InfoPanel;
