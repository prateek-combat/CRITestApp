import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200 rounded';

  const variantClasses = {
    text: 'h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height)
    style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

// Preset loading skeletons for common use cases

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="w-full">
    {/* Header skeleton */}
    <div className="mb-4 flex space-x-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-8 flex-1" />
      ))}
    </div>

    {/* Rows skeleton */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="mb-3 flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} className="h-6 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ showImage?: boolean }> = ({
  showImage = false,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    {showImage && (
      <Skeleton className="mb-4" variant="rectangular" height={200} />
    )}
    <Skeleton className="mb-2 h-6 w-3/4" />
    <Skeleton className="mb-4 h-4 w-full" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const StatsSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <Skeleton className="mb-2 h-4 w-16" />
        <Skeleton className="mb-1 h-8 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({
  height = 300,
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
    <Skeleton className="mb-4 h-6 w-48" />
    <Skeleton variant="rectangular" height={height} />
  </div>
);

export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 6 }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="flex items-center space-x-4 rounded-lg border border-gray-200 bg-white p-4"
      >
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

export const FormSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div>
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div>
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Skeleton className="mb-2 h-4 w-20" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
    <div className="flex justify-end space-x-4">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-24" />
    </div>
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    {/* Header */}
    <div className="mb-8">
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="h-4 w-96" />
    </div>

    {/* Stats */}
    <div className="mb-8">
      <StatsSkeleton />
    </div>

    {/* Main content */}
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ChartSkeleton />
      </div>
      <div>
        <CardSkeleton />
      </div>
    </div>
  </div>
);

export default Skeleton;
