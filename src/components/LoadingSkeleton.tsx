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
    wave: 'loading-pulse',
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

// Enhanced preset loading skeletons for common use cases

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <div className="responsive-table-container animate-slide-in-bottom">
    {/* Header skeleton */}
    <div className="mb-4 flex space-x-4 rounded-t-lg bg-gray-50 p-4">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-6 flex-1" animation="wave" />
      ))}
    </div>

    {/* Rows skeleton */}
    <div className="bg-white">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="mb-3 flex space-x-4 border-b border-gray-100 p-4 last:border-b-0"
          style={{ animationDelay: `${rowIndex * 100}ms` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-5 flex-1" animation="wave" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const CardSkeleton: React.FC<{
  showImage?: boolean;
  variant?: 'default' | 'compact';
}> = ({ showImage = false, variant = 'default' }) => {
  const padding = variant === 'compact' ? 'p-4' : 'p-6';
  const imageHeight = variant === 'compact' ? 150 : 200;

  return (
    <div
      className={`card-hover animate-scale-in rounded-xl border border-gray-200 bg-white shadow-sm ${padding}`}
    >
      {showImage && (
        <Skeleton
          className="mb-4"
          variant="rectangular"
          height={imageHeight}
          animation="wave"
        />
      )}
      <Skeleton className="mb-3 h-6 w-3/4" animation="wave" />
      <Skeleton className="mb-3 h-4 w-full" animation="wave" />
      <Skeleton className="h-4 w-1/2" animation="wave" />
      {variant === 'default' && (
        <div className="mt-4 flex space-x-2">
          <Skeleton className="h-8 w-20" animation="wave" />
          <Skeleton className="h-8 w-24" animation="wave" />
        </div>
      )}
    </div>
  );
};

export const StatsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="responsive-grid-4">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="card-hover animate-slide-in-bottom rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        style={{ animationDelay: `${i * 100}ms` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton className="mb-2 h-4 w-20" animation="wave" />
            <Skeleton className="mb-1 h-8 w-16" animation="wave" />
            <Skeleton className="h-3 w-24" animation="wave" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" animation="wave" />
        </div>
      </div>
    ))}
  </div>
);

export const ChartSkeleton: React.FC<{ height?: number; title?: boolean }> = ({
  height = 300,
  title = true,
}) => (
  <div className="card-hover animate-slide-in-left rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    {title && <Skeleton className="mb-6 h-6 w-48" animation="wave" />}
    <Skeleton variant="rectangular" height={height} animation="wave" />
    <div className="mt-4 flex justify-center space-x-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-3 w-3 rounded-full" animation="wave" />
          <Skeleton className="h-3 w-16" animation="wave" />
        </div>
      ))}
    </div>
  </div>
);

export const ListSkeleton: React.FC<{
  items?: number;
  showAvatar?: boolean;
}> = ({ items = 6, showAvatar = true }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, i) => (
      <div
        key={i}
        className="card-hover animate-slide-in-right flex items-center space-x-4 rounded-xl border border-gray-200 bg-white p-4"
        style={{ animationDelay: `${i * 80}ms` }}
      >
        {showAvatar && (
          <Skeleton
            variant="circular"
            width={40}
            height={40}
            animation="wave"
          />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" animation="wave" />
          <Skeleton className="h-3 w-1/2" animation="wave" />
        </div>
        <Skeleton className="h-6 w-20" animation="wave" />
      </div>
    ))}
  </div>
);

export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 4 }) => (
  <div className="animate-slide-in-top space-y-6">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
        <Skeleton className="mb-2 h-4 w-24" animation="wave" />
        <Skeleton className="h-12 w-full rounded-lg" animation="wave" />
      </div>
    ))}
    <div className="responsive-grid-2 grid gap-4">
      <div>
        <Skeleton className="mb-2 h-4 w-20" animation="wave" />
        <Skeleton className="h-12 w-full rounded-lg" animation="wave" />
      </div>
      <div>
        <Skeleton className="mb-2 h-4 w-28" animation="wave" />
        <Skeleton className="h-12 w-full rounded-lg" animation="wave" />
      </div>
    </div>
    <div className="flex justify-end space-x-4 pt-4">
      <Skeleton className="h-10 w-20 rounded-lg" animation="wave" />
      <Skeleton className="h-10 w-28 rounded-lg" animation="wave" />
    </div>
  </div>
);

export const PageSkeleton: React.FC<{
  showStats?: boolean;
  showChart?: boolean;
  showSidebar?: boolean;
}> = ({ showStats = true, showChart = true, showSidebar = false }) => (
  <div className="page-fade-in min-h-screen bg-gray-50">
    <div className="responsive-container">
      {/* Header */}
      <div className="animate-slide-in-top mb-8">
        <Skeleton className="mb-3 h-8 w-64" animation="wave" />
        <Skeleton className="h-4 w-96" animation="wave" />
      </div>

      {/* Stats */}
      {showStats && (
        <div className="mb-8">
          <StatsSkeleton />
        </div>
      )}

      {/* Main content */}
      <div
        className={`grid gap-8 ${showSidebar ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
      >
        <div className={showSidebar ? 'lg:col-span-3' : 'lg:col-span-2'}>
          {showChart && <ChartSkeleton />}
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          {showSidebar && <CardSkeleton variant="compact" />}
        </div>
      </div>
    </div>
  </div>
);

// Navigation Skeleton
export const NavigationSkeleton: React.FC = () => (
  <div className="animate-slide-in-left">
    <div className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-8 w-8 rounded-lg" animation="wave" />
        <div>
          <Skeleton className="mb-1 h-4 w-32" animation="wave" />
          <Skeleton className="h-3 w-20" animation="wave" />
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-lg" animation="wave" />
        ))}
        <Skeleton className="h-8 w-8 rounded-full" animation="wave" />
      </div>
    </div>
  </div>
);

// Button Skeleton
export const ButtonSkeleton: React.FC<{
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  width?: string;
}> = ({ variant = 'primary', size = 'md', width = 'auto' }) => {
  const heights = { sm: 'h-8', md: 'h-10', lg: 'h-12' };
  const widths = width === 'auto' ? 'w-24' : width;

  return (
    <Skeleton
      className={`${heights[size]} ${widths} rounded-lg`}
      animation="wave"
    />
  );
};

// Search/Filter Skeleton
export const FilterSkeleton: React.FC = () => (
  <div className="animate-slide-in-top mb-6 flex flex-wrap items-center justify-between gap-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-10 w-64 rounded-lg" animation="wave" />
      <Skeleton className="h-10 w-32 rounded-lg" animation="wave" />
    </div>
    <div className="flex items-center space-x-2">
      <ButtonSkeleton size="md" width="w-28" />
      <ButtonSkeleton size="md" width="w-20" />
    </div>
  </div>
);

export default Skeleton;
