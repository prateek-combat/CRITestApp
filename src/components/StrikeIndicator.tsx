'use client';

interface StrikeIndicatorProps {
  strikeCount: number;
  maxAllowed: number;
  strikeLevel: 'none' | 'first' | 'second' | 'terminated';
}

export default function StrikeIndicator({
  strikeCount,
  maxAllowed,
  strikeLevel,
}: StrikeIndicatorProps) {
  // Don't show indicator if no strikes
  if (strikeCount === 0) {
    return null;
  }

  const getStrikeColor = (strikeLevel: string) => {
    switch (strikeLevel) {
      case 'first':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'second':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'terminated':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStrikeIcon = (strikeLevel: string) => {
    switch (strikeLevel) {
      case 'first':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.884-.833-2.598 0L4.216 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case 'second':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'terminated':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStrikeMessage = (
    strikeLevel: string,
    strikeCount: number,
    maxAllowed: number
  ) => {
    switch (strikeLevel) {
      case 'first':
        return `Warning: Copy detected (${strikeCount}/${maxAllowed})`;
      case 'second':
        return `Final Warning: Copy detected (${strikeCount}/${maxAllowed})`;
      case 'terminated':
        return `Test terminated: Too many copy attempts (${strikeCount}/${maxAllowed})`;
      default:
        return `Copy violations: ${strikeCount}/${maxAllowed}`;
    }
  };

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-lg ${getStrikeColor(strikeLevel)}`}
    >
      {getStrikeIcon(strikeLevel)}
      <span>{getStrikeMessage(strikeLevel, strikeCount, maxAllowed)}</span>
    </div>
  );
}
