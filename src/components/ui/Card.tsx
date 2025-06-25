'use client';

import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'neu' | 'gradient-border';
  hover?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  hover = true,
  compact = true,
  onClick,
}) => {
  const baseClasses = `
    rounded-xl overflow-hidden transition-all duration-300
    ${compact ? 'p-3' : 'p-4 md:p-6'}
  `;

  const variantClasses = {
    default: 'bg-white shadow-smooth hover:shadow-smooth-lg',
    glass: 'glass',
    neu: 'neu hover:shadow-xl',
    'gradient-border': 'gradient-border-green-orange',
  };

  const hoverEffects = hover
    ? {
        whileHover: {
          y: -2,
          transition: { duration: 0.2, ease: 'easeOut' },
        },
        whileTap: onClick ? { scale: 0.98 } : {},
      }
    : {};

  const content = (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      {...hoverEffects}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {variant === 'gradient-border' ? (
        <div className="rounded-[11px] bg-white p-3">{children}</div>
      ) : (
        children
      )}
    </motion.div>
  );

  return content;
};

export default Card;
