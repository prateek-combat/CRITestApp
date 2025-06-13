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
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-base font-medium text-gray-900">
          {isPersonality
            ? 'Select the option that best describes your approach:'
            : 'Choose your answer:'}
        </h3>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        <div className="space-y-3">
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

        {/* Confidence Slider for Personality Questions */}
        {isPersonality && hasSelectedAnswer && (
          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-medium text-blue-800">
                How confident are you in this choice?
              </label>
              <span className="text-sm font-semibold text-blue-600">
                {confidenceScore}/5
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-blue-600">Not sure</span>
              <input
                type="range"
                min="1"
                max="5"
                value={confidenceScore}
                onChange={(e) => onConfidenceChange(parseInt(e.target.value))}
                className="slider h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-blue-200"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(confidenceScore - 1) * 25}%, #cbd5e1 ${(confidenceScore - 1) * 25}%, #cbd5e1 100%)`,
                }}
              />
              <span className="text-xs text-blue-600">Very sure</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerColumn;
