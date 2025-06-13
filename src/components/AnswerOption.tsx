import React from 'react';

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
      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.015] ${
        isSelected
          ? isPersonality
            ? 'border-blue-600 bg-blue-50 shadow-lg'
            : 'border-green-600 bg-green-50 shadow-lg'
          : 'border-gray-300 hover:bg-gray-100'
      } ${className || ''}`}
    >
      {/* Letter bubble */}
      <span
        className={`flex h-7 w-7 select-none items-center justify-center rounded-full border text-sm font-semibold ${
          isSelected
            ? isPersonality
              ? 'border-blue-600 text-blue-600'
              : 'border-green-600 text-green-600'
            : 'border-gray-400 text-gray-500'
        }`}
      >
        {optionLetter}
      </span>

      <span className="flex-1 leading-relaxed text-gray-900">{option}</span>
    </button>
  );
};

export default AnswerOption;
