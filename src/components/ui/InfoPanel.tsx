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
      container: 'bg-slateblue/10 border-slateblue/20 text-ink',
      icon: 'text-slateblue',
      button: 'text-ink/70 hover:text-ink hover:bg-slateblue/10',
    },
    warning: {
      container: 'bg-copper/10 border-copper/20 text-ink',
      icon: 'text-copper',
      button: 'text-ink/70 hover:text-ink hover:bg-copper/10',
    },
    success: {
      container: 'bg-moss/10 border-moss/20 text-ink',
      icon: 'text-moss',
      button: 'text-ink/70 hover:text-ink hover:bg-moss/10',
    },
    neutral: {
      container: 'bg-parchment/80 border-ink/10 text-ink',
      icon: 'text-ink/50',
      button: 'text-ink/70 hover:text-ink hover:bg-ink/5',
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
