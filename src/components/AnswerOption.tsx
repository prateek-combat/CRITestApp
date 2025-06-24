import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface AnswerOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  questionType?: 'OBJECTIVE' | 'PERSONALITY';
  className?: string;
}

const AnswerOption: React.FC<AnswerOptionProps> = ({
  option,
  index,
  isSelected,
  onSelect,
  questionType = 'OBJECTIVE',
  className,
}) => {
  const isPersonality = questionType === 'PERSONALITY';
  const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...

  return (
    <button
      role="radio"
      aria-checked={isSelected}
      onClick={onSelect}
      className={`group relative w-full overflow-hidden rounded-lg border-2 bg-white p-3 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md dark:bg-gray-800 ${
        isSelected
          ? isPersonality
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 dark:ring-blue-600'
            : 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-lg ring-2 ring-green-200 dark:from-green-900/30 dark:to-green-800/30 dark:ring-green-600'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700'
      } ${className || ''}`}
    >
      {/* Background gradient overlay for selected state */}
      {isSelected && (
        <div
          className={`absolute inset-0 opacity-10 ${
            isPersonality
              ? 'bg-gradient-to-br from-blue-400 to-blue-600'
              : 'bg-gradient-to-br from-green-400 to-green-600'
          }`}
        />
      )}

      {/* Content container */}
      <div className="relative z-10 flex items-start space-x-3">
        {/* Option letter indicator */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold transition-all ${
            isSelected
              ? isPersonality
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-green-500 bg-green-500 text-white'
              : 'border-gray-300 bg-white text-gray-600 group-hover:border-gray-400 dark:border-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:group-hover:border-gray-400'
          }`}
        >
          {optionLetter}
        </div>

        {/* Option content */}
        <div className="flex-grow">
          <div
            className={`transition-colors ${
              isSelected
                ? isPersonality
                  ? 'text-blue-900 dark:text-blue-100'
                  : 'text-green-900 dark:text-green-100'
                : 'text-gray-800 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-gray-100'
            }`}
          >
            <MarkdownRenderer
              content={option}
              className={`leading-relaxed ${
                isSelected
                  ? isPersonality
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-green-900 dark:text-green-100'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
            />
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${
              isPersonality ? 'bg-blue-500' : 'bg-green-500'
            } text-white`}
          >
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
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Subtle hover effect line */}
      <div
        className={`absolute bottom-0 left-0 h-1 w-full transform transition-all duration-300 ${
          isSelected
            ? isPersonality
              ? 'scale-x-100 bg-gradient-to-r from-blue-400 to-blue-600'
              : 'scale-x-100 bg-gradient-to-r from-green-400 to-green-600'
            : 'scale-x-0 bg-gradient-to-r from-gray-300 to-gray-400 group-hover:scale-x-100'
        }`}
      />
    </button>
  );
};

export default AnswerOption;
