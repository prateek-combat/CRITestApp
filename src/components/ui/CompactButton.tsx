import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CompactButtonProps {
  children?: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  title?: string;
  loading?: boolean;
}

export const CompactButton: React.FC<CompactButtonProps> = ({
  children,
  icon: Icon,
  variant = 'secondary',
  size = 'sm',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  title,
  loading = false,
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variantStyles = {
    primary:
      'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 focus:ring-blue-500 border border-blue-700/50 shadow-md hover:shadow-lg',
    secondary:
      'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-500 shadow-sm hover:shadow-md',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 border border-red-700/50 shadow-md hover:shadow-lg',
    ghost:
      'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:text-gray-900 focus:ring-gray-500 border-2 border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md',
  };

  const sizeStyles = {
    xs: 'px-2 py-1 text-xs gap-1',
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
  };

  const iconSizes = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-4 w-4',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={` ${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? 'cursor-not-allowed opacity-50' : ''} ${className} `}
    >
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-inherit">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
        </div>
      )}

      {/* Button content */}
      <span className={`flex items-center ${loading ? 'opacity-0' : ''}`}>
        {Icon && <Icon className={iconSizes[size]} />}
        {children}
      </span>
    </button>
  );
};

export const CompactIconButton: React.FC<
  Omit<CompactButtonProps, 'children'>
> = (props) => {
  return (
    <CompactButton {...props} className={`!p-1 ${props.className || ''}`} />
  );
};
