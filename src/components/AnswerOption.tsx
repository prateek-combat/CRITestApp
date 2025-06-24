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
      className={`group relative w-full overflow-hidden rounded-lg border-2 bg-white p-3 text-left transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
        isSelected
          ? isPersonality
            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg ring-2 ring-blue-200'
            : 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 shadow-lg ring-2 ring-green-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
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

      <div className="relative flex items-start gap-3">
        {/* Enhanced letter badge */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
            isSelected
              ? isPersonality
                ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
                : 'border-green-500 bg-green-500 text-white shadow-lg'
              : 'border-gray-300 bg-white text-gray-600 group-hover:border-gray-400 group-hover:bg-gray-100'
          }`}
        >
          {optionLetter}
        </div>

        {/* Option content with enhanced typography */}
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm leading-snug transition-colors duration-300 ${
              isSelected
                ? isPersonality
                  ? 'font-medium text-blue-900'
                  : 'font-medium text-green-900'
                : 'text-gray-800 group-hover:text-gray-900'
            }`}
          >
            <MarkdownRenderer content={option} />
          </div>
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div
            className={`flex-shrink-0 transition-all duration-300 ${
              isPersonality ? 'text-blue-500' : 'text-green-500'
            }`}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
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
