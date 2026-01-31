import React from 'react';

type BadgeVariant = 'light' | 'solid';
type BadgeSize = 'sm' | 'md';
type BadgeColor =
  | 'primary'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

interface BadgeProps {
  variant?: BadgeVariant; // Light or solid variant
  size?: BadgeSize; // Badge size
  color?: BadgeColor; // Badge color
  startIcon?: React.ReactNode; // Icon at the start
  endIcon?: React.ReactNode; // Icon at the end
  children: React.ReactNode; // Badge content
}

const Badge: React.FC<BadgeProps> = ({
  variant = 'light',
  color = 'primary',
  size = 'md',
  startIcon,
  endIcon,
  children,
}) => {
  const baseStyles =
    'inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium';

  // Define size styles
  const sizeStyles = {
    sm: 'text-theme-xs', // Smaller padding and font size
    md: 'text-sm', // Default padding and font size
  };

  // Define color styles for variants
  const variants = {
    light: {
      primary: 'bg-ink/10 text-ink',
      success: 'bg-moss/12 text-moss',
      error: 'bg-red-50 text-red-600',
      warning: 'bg-copper/12 text-copper',
      info: 'bg-slateblue/12 text-slateblue',
      light: 'bg-parchment text-ink/70',
      dark: 'bg-ink text-parchment',
    },
    solid: {
      primary: 'bg-ink text-parchment',
      success: 'bg-moss text-parchment',
      error: 'bg-red-600 text-white',
      warning: 'bg-copper text-parchment',
      info: 'bg-slateblue text-parchment',
      light: 'bg-parchment text-ink',
      dark: 'bg-ink text-parchment',
    },
  };

  // Get styles based on size and color variant
  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
    <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
      {children}
      {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
