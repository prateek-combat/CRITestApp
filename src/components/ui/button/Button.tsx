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

  // Enhanced modern variant classes with premium styling
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg hover:shadow-xl hover:shadow-blue-500/25 hover:from-blue-700 hover:to-blue-900 active:scale-[0.98] disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none border border-blue-700/50 hover:border-blue-600',
    outline:
      'bg-white text-blue-600 border-2 border-blue-600 shadow-sm hover:bg-blue-50 hover:shadow-md hover:border-blue-700 active:scale-[0.98] disabled:text-gray-400 disabled:border-gray-300 disabled:shadow-none',
    ghost:
      'text-gray-700 bg-gray-50 border-2 border-gray-200 shadow-sm hover:bg-gray-100 hover:border-gray-300 hover:shadow-md active:scale-[0.98] disabled:text-gray-400 disabled:bg-gray-50 disabled:border-gray-200',
    glass:
      'backdrop-blur-md bg-white/80 text-blue-600 border border-white/50 shadow-lg hover:bg-white/90 hover:shadow-xl active:scale-[0.98] disabled:bg-white/60 disabled:text-gray-400 disabled:shadow-none',
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
