import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface QuestionCardProps {
  question: {
    id: string;
    promptText: string;
    promptImageUrl: string | null;
    category: string;
    questionType?: 'OBJECTIVE' | 'PERSONALITY';
    personalityDimension?: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  };
  index: number;
  className?: string;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  className,
}) => {
  const isPersonality = question.questionType === 'PERSONALITY';

  return (
    <article
      className={`flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm ${className || ''}`}
    >
      <header className="flex flex-shrink-0 items-center gap-2 p-6 pb-4">
        <span
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            isPersonality ? 'bg-blue-600 text-white' : 'bg-green-700 text-white'
          }`}
        >
          {index + 1}
        </span>

        <div className="flex flex-1 flex-wrap items-center gap-2">
          {question.category && (
            <span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600">
              {question.category}
            </span>
          )}

          {isPersonality && question.personalityDimension && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-blue-700">
              {question.personalityDimension.name}
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mb-4">
          <MarkdownRenderer
            content={question.promptText}
            className="text-lg font-semibold leading-snug"
          />
        </div>

        {question.promptImageUrl && (
          <div className="flex justify-center">
            <img
              src={question.promptImageUrl}
              alt=""
              className="mx-auto max-h-60 w-full rounded-lg object-contain"
            />
          </div>
        )}
      </div>
    </article>
  );
};

export default QuestionCard;
