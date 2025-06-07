'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';

interface QuestionBookmarkProps {
  questionId: string;
  isBookmarked: boolean;
  onToggle: (questionId: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuestionBookmark({
  questionId,
  isBookmarked,
  onToggle,
  className = '',
  size = 'md',
}: QuestionBookmarkProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3',
  };

  return (
    <button
      onClick={() => onToggle(questionId)}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-200 ${
        isBookmarked
          ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
      } ${buttonSizeClasses[size]} ${className} `}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark for review'}
      type="button"
    >
      {isBookmarked ? (
        <BookmarkCheck className={sizeClasses[size]} />
      ) : (
        <Bookmark className={sizeClasses[size]} />
      )}
    </button>
  );
}
