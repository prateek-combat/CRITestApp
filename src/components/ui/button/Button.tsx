'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'outline' | 'ghost' | 'glass';
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  startIcon,
  endIcon,
  onClick,
  className = '',
  disabled = false,
  fullWidth = false,
  loading = false,
  type = 'button',
}) => {
  // Compact size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-sm gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };

  // Modern variant classes with effects
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-military-green to-primary-600 text-white shadow-sm hover:shadow-md hover:from-primary-600 hover:to-primary-700 active:scale-[0.98] disabled:from-gray-400 disabled:to-gray-500 disabled:hover:shadow-sm',
    outline:
      'bg-white text-military-green ring-1 ring-inset ring-military-green/20 hover:bg-military-green/5 hover:ring-military-green/30 active:scale-[0.98] dark:bg-gray-800 dark:text-military-green dark:ring-military-green/30 dark:hover:bg-military-green/10',
    ghost:
      'text-military-green hover:bg-military-green/10 hover:text-primary-700 active:scale-[0.98] dark:text-military-green dark:hover:bg-military-green/20',
    glass:
      'backdrop-blur-md bg-white/10 text-military-green ring-1 ring-inset ring-white/20 hover:bg-white/20 active:scale-[0.98] dark:text-white dark:ring-white/10 dark:hover:bg-white/10',
  };

  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      className={`relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-military-green/50 focus:ring-offset-2 ${sizeClasses[size]} ${variantClasses[variant]} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${fullWidth ? 'w-full' : ''} ${className} `}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {/* Ripple effect on click */}
      {!isDisabled && (
        <motion.span
          className="absolute inset-0 rounded-lg"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            background:
              variant === 'primary'
                ? 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(74,93,35,0.2) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-inherit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Button content */}
      <span
        className={`relative flex items-center ${loading ? 'opacity-0' : ''}`}
      >
        {startIcon && (
          <motion.span
            className="flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {startIcon}
          </motion.span>
        )}
        {children}
        {endIcon && (
          <motion.span
            className="flex items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {endIcon}
          </motion.span>
        )}
      </span>
    </motion.button>
  );
};

export default Button;
