'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  title?: string;
  showLoadingOnNavigation?: boolean;
  replace?: boolean;
  target?: string;
}

const LinkButton: React.FC<LinkButtonProps> = ({
  href,
  children,
  variant = 'primary',
  size = 'sm',
  startIcon,
  endIcon,
  className = '',
  disabled = false,
  title,
  showLoadingOnNavigation = true,
  replace = false,
  target,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs gap-1',
    sm: 'px-2.5 py-1.5 text-sm gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border border-blue-700/50 shadow-md hover:shadow-lg',
    secondary:
      'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md',
    outline:
      'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 hover:border-blue-700 shadow-sm hover:shadow-md',
    ghost:
      'text-gray-700 bg-gray-50 hover:bg-gray-100 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 border border-red-700/50 shadow-md hover:shadow-lg',
  };

  const baseClasses = `
    relative inline-flex items-center justify-center font-medium rounded-md 
    transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
    ${sizeClasses[size]} ${variantClasses[variant]}
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
    ${className}
  `;

  const handleClick = async (e: React.MouseEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (showLoadingOnNavigation && !target) {
      e.preventDefault();
      setIsNavigating(true);

      try {
        if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      } catch (error) {
        console.error('Navigation error:', error);
        setIsNavigating(false);
      }
    }
  };

  const buttonContent = (
    <>
      {/* Loading spinner */}
      {isNavigating && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-md bg-inherit"
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
      <span className={`flex items-center ${isNavigating ? 'opacity-0' : ''}`}>
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
    </>
  );

  if (target) {
    return (
      <a
        href={href}
        target={target}
        className={baseClasses}
        title={title}
        onClick={handleClick}
      >
        {buttonContent}
      </a>
    );
  }

  return (
    <Link href={href} replace={replace}>
      <motion.button
        className={baseClasses}
        title={title}
        onClick={handleClick}
        disabled={disabled}
        whileHover={!disabled && !isNavigating ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isNavigating ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      >
        {buttonContent}
      </motion.button>
    </Link>
  );
};

export default LinkButton;
