'use client';

import React from 'react';
import { CheckCircle, Circle, Bookmark } from 'lucide-react';

interface TestProgressBarProps {
  totalQuestions: number;
  currentQuestionIndex: number;
  answeredQuestions: Set<string>;
  bookmarkedQuestions: Set<string>;
  questionIds: string[];
  onQuestionSelect?: (index: number) => void;
  className?: string;
}

export default function TestProgressBar({
  totalQuestions,
  currentQuestionIndex,
  answeredQuestions,
  bookmarkedQuestions,
  questionIds,
  onQuestionSelect,
  className = '',
}: TestProgressBarProps) {
  const completionPercentage = Math.round(
    (answeredQuestions.size / totalQuestions) * 100
  );
  const remainingQuestions = totalQuestions - answeredQuestions.size;
  const bookmarkedCount = bookmarkedQuestions.size;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-primary-900">
            Progress: {completionPercentage}%
          </span>
          <span className="text-primary-600">
            {answeredQuestions.size} of {totalQuestions} completed
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-gray-200">
          <div
            className="relative h-3 overflow-hidden rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white to-transparent opacity-20"></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/30">
          <div className="text-lg font-bold text-green-700 dark:text-green-300">
            {answeredQuestions.size}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            Answered
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
          <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
            {remainingQuestions}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Remaining
          </div>
        </div>
        <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/30">
          <div className="text-lg font-bold text-primary-700 dark:text-primary-300">
            {bookmarkedCount}
          </div>
          <div className="text-xs text-primary-600 dark:text-primary-400">
            Bookmarked
          </div>
        </div>
      </div>

      {/* Question Grid Overview */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-primary-900 dark:text-primary-100">
          Question Overview
        </h4>
        <div className="sm:grid-cols-15 md:grid-cols-20 grid grid-cols-10 gap-1">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const questionId = questionIds[index];
            const isAnswered = answeredQuestions.has(questionId);
            const isBookmarked = bookmarkedQuestions.has(questionId);
            const isCurrent = index === currentQuestionIndex;

            return (
              <button
                key={index}
                onClick={
                  onQuestionSelect ? () => onQuestionSelect(index) : undefined
                }
                disabled={!onQuestionSelect}
                className={`relative h-6 w-6 rounded border-2 text-xs font-medium transition-all duration-200 ${
                  isCurrent
                    ? 'border-primary-500 bg-primary-100 ring-2 ring-primary-300 ring-offset-1 dark:bg-primary-900/50 dark:ring-primary-600'
                    : onQuestionSelect
                      ? 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      : 'border-gray-200 dark:border-gray-600'
                } ${
                  isAnswered
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : onQuestionSelect
                      ? 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                      : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                } ${!onQuestionSelect ? 'cursor-not-allowed' : ''}`}
                title={
                  !onQuestionSelect
                    ? 'Question navigation is disabled for this test'
                    : `Question ${index + 1}${isAnswered ? ' (Answered)' : ''}${isBookmarked ? ' (Bookmarked)' : ''}`
                }
              >
                {isAnswered ? (
                  <CheckCircle className="mx-auto h-3 w-3" />
                ) : (
                  <span>{index + 1}</span>
                )}

                {isBookmarked && (
                  <div className="absolute -right-1 -top-1">
                    <Bookmark className="h-2 w-2 fill-current text-primary-500" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-green-300 bg-green-100"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-gray-300 bg-white"></div>
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border-2 border-primary-500 bg-primary-100"></div>
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1">
          <Bookmark className="h-3 w-3 fill-current text-primary-500" />
          <span>Bookmarked</span>
        </div>
      </div>

      {/* Time and Status */}
      <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Current: Question {currentQuestionIndex + 1}
          </span>
          <div
            className={`rounded px-2 py-1 text-xs font-medium ${
              completionPercentage < 25
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : completionPercentage < 50
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : completionPercentage < 75
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {completionPercentage < 25
              ? 'Just Started'
              : completionPercentage < 50
                ? 'In Progress'
                : completionPercentage < 75
                  ? 'Making Progress'
                  : completionPercentage < 100
                    ? 'Almost Done'
                    : 'Complete'}
          </div>
        </div>
      </div>
    </div>
  );
}
