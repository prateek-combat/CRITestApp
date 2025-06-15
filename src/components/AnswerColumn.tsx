import React from 'react';
import AnswerOption from './AnswerOption';

interface AnswerColumnProps {
  question: {
    id: string;
    answerOptions: string[];
    questionType?: 'OBJECTIVE' | 'PERSONALITY';
  };
  selectedAnswerIndex?: number;
  confidenceScore?: number;
  onAnswerSelect: (index: number) => void;
  onConfidenceChange: (score: number) => void;
  className?: string;
}

const AnswerColumn: React.FC<AnswerColumnProps> = ({
  question,
  selectedAnswerIndex,
  confidenceScore = 3,
  onAnswerSelect,
  onConfidenceChange,
  className,
}) => {
  const isPersonality = question.questionType === 'PERSONALITY';
  const hasSelectedAnswer = selectedAnswerIndex !== undefined;

  return (
    <div className={`flex h-full flex-col ${className || ''}`}>
      {/* Enhanced Header */}
      <div className="mb-6 flex-shrink-0">
        <div className="mb-2 flex items-center space-x-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isPersonality
                ? 'bg-blue-100 text-blue-600'
                : 'bg-green-100 text-green-600'
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {isPersonality ? 'Select Your Response' : 'Choose Your Answer'}
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-gray-600">
          {isPersonality
            ? 'Select the option that best describes your approach or preference.'
            : 'Choose the correct answer from the options below.'}
        </p>
      </div>

      {/* Answer Options */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        <div className="space-y-4">
          {question.answerOptions.map((option, index) => (
            <AnswerOption
              key={index}
              option={option}
              index={index}
              isSelected={selectedAnswerIndex === index}
              onSelect={() => onAnswerSelect(index)}
              questionType={question.questionType}
            />
          ))}
        </div>

        {/* Enhanced Confidence Slider for Personality Questions */}
        {isPersonality && hasSelectedAnswer && (
          <div className="mt-8 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg
                  className="h-5 w-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
                <label className="text-sm font-semibold text-blue-800">
                  How confident are you in this choice?
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-blue-700">
                  {confidenceScore}
                </span>
                <span className="text-sm text-blue-600">/5</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <span className="whitespace-nowrap text-xs font-medium text-blue-600">
                Not sure
              </span>
              <div className="relative flex-1">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={confidenceScore}
                  onChange={(e) => onConfidenceChange(parseInt(e.target.value))}
                  className="slider-thumb h-3 w-full cursor-pointer appearance-none rounded-lg bg-blue-200"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(confidenceScore - 1) * 25}%, #cbd5e1 ${(confidenceScore - 1) * 25}%, #cbd5e1 100%)`,
                  }}
                />
                {/* Confidence level indicators */}
                <div className="mt-2 flex justify-between px-1">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        level <= confidenceScore ? 'bg-blue-500' : 'bg-blue-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <span className="whitespace-nowrap text-xs font-medium text-blue-600">
                Very sure
              </span>
            </div>

            <div className="mt-3 text-center">
              <span className="text-xs font-medium text-blue-700">
                {confidenceScore === 1 && "I'm guessing"}
                {confidenceScore === 2 && 'Somewhat uncertain'}
                {confidenceScore === 3 && 'Moderately confident'}
                {confidenceScore === 4 && 'Quite confident'}
                {confidenceScore === 5 && 'Very confident'}
              </span>
            </div>
          </div>
        )}

        {/* Selection Status */}
        {hasSelectedAnswer && (
          <div
            className={`mt-6 flex items-center justify-center space-x-2 rounded-lg p-3 ${
              isPersonality
                ? 'bg-blue-50 text-blue-700'
                : 'bg-green-50 text-green-700'
            }`}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium">
              Answer selected: Option{' '}
              {String.fromCharCode(65 + selectedAnswerIndex)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerColumn;
