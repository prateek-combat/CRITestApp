'use client';

import React, { useState } from 'react';
import { Bookmark, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl?: string | null;
  answerOptions: string[];
  category: string;
  timerSeconds: number;
}

interface BookmarkedQuestionsReviewProps {
  questions: Question[];
  bookmarkedQuestionIds: Set<string>;
  answers: Record<string, { answerIndex: number; timeTaken?: number }>;
  onAnswerChange: (questionId: string, answerIndex: number) => void;
  onRemoveBookmark: (questionId: string) => void;
  onClose: () => void;
  className?: string;
}

export default function BookmarkedQuestionsReview({
  questions,
  bookmarkedQuestionIds,
  answers,
  onAnswerChange,
  onRemoveBookmark,
  onClose,
  className = '',
}: BookmarkedQuestionsReviewProps) {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null
  );

  const bookmarkedQuestions = questions.filter((q) =>
    bookmarkedQuestionIds.has(q.id)
  );

  if (bookmarkedQuestions.length === 0) {
    return (
      <div
        className={`rounded-lg border border-gray-200 bg-white p-6 ${className}`}
      >
        <div className="text-center">
          <Bookmark className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            No Bookmarked Questions
          </h3>
          <p className="mb-4 text-gray-500">
            You haven&apos;t bookmarked any questions for review yet.
          </p>
          <button
            onClick={onClose}
            className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
          >
            Back to Test
          </button>
        </div>
      </div>
    );
  }

  const selectedQuestion = selectedQuestionId
    ? bookmarkedQuestions.find((q) => q.id === selectedQuestionId)
    : bookmarkedQuestions[0];

  const getQuestionStatus = (questionId: string) => {
    return answers[questionId] ? 'answered' : 'unanswered';
  };

  const getStatusIcon = (status: string) => {
    return status === 'answered' ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-yellow-500" />
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'answered'
      ? 'border-green-200 bg-green-50'
      : 'border-yellow-200 bg-yellow-50';
  };

  return (
    <div className={`rounded-lg border border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Bookmark className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-primary-900">
            Review Bookmarked Questions
          </h2>
          <span className="rounded bg-primary-100 px-2 py-1 text-sm font-medium text-primary-700">
            {bookmarkedQuestions.length} questions
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 transition-colors hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex">
        {/* Question List Sidebar */}
        <div className="max-h-96 w-1/3 overflow-y-auto border-r border-gray-200">
          <div className="space-y-2 p-4">
            {bookmarkedQuestions.map((question, index) => {
              const status = getQuestionStatus(question.id);
              const isSelected = selectedQuestion?.id === question.id;

              return (
                <button
                  key={question.id}
                  onClick={() => setSelectedQuestionId(question.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    isSelected
                      ? 'border-primary-300 bg-primary-50'
                      : `hover:border-gray-300 ${getStatusColor(status)}`
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-grow">
                      <div className="mb-1 flex items-center space-x-2">
                        {getStatusIcon(status)}
                        <span className="text-sm font-medium text-gray-900">
                          Question{' '}
                          {questions.findIndex((q) => q.id === question.id) + 1}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-600">
                        {question.promptText.substring(0, 60)}...
                      </p>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className="rounded bg-gray-100 px-1 text-xs text-gray-500">
                          {question.category}
                        </span>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{question.timerSeconds}s</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveBookmark(question.id);
                      }}
                      className="ml-2 text-gray-400 transition-colors hover:text-red-500"
                      title="Remove bookmark"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question Detail */}
        <div className="flex-1 p-6">
          {selectedQuestion && (
            <div className="space-y-6">
              {/* Question Header */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question{' '}
                    {questions.findIndex((q) => q.id === selectedQuestion.id) +
                      1}
                  </h3>
                  <div className="flex items-center space-x-3">
                    <span className="rounded bg-gray-100 px-2 py-1 text-sm text-gray-500">
                      {selectedQuestion.category}
                    </span>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{selectedQuestion.timerSeconds}s</span>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 ${getStatusColor(getQuestionStatus(selectedQuestion.id))}`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-gray-800">
                    {selectedQuestion.promptText}
                  </p>
                  {selectedQuestion.promptImageUrl && (
                    <div className="mt-4">
                      <img
                        src={selectedQuestion.promptImageUrl}
                        alt="Question prompt"
                        className="max-w-full rounded-lg"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Answer Options:</h4>
                {selectedQuestion.answerOptions.map((option, index) => {
                  const isSelected =
                    answers[selectedQuestion.id]?.answerIndex === index;

                  return (
                    <button
                      key={index}
                      onClick={() => onAnswerChange(selectedQuestion.id, index)}
                      className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 text-primary-900'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {isSelected && (
                            <CheckCircle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div className="flex-grow">
                          <span
                            className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}
                          >
                            Option {String.fromCharCode(65 + index)}
                          </span>
                          <p
                            className={`mt-1 ${isSelected ? 'text-primary-800' : 'text-gray-600'}`}
                          >
                            {option}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Question Actions */}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                <button
                  onClick={() => onRemoveBookmark(selectedQuestion.id)}
                  className="flex items-center space-x-2 text-red-600 transition-colors hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  <span>Remove Bookmark</span>
                </button>

                <div className="text-sm text-gray-500">
                  {answers[selectedQuestion.id] ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Answer saved</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Not answered yet</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 p-4">
        <div className="text-sm text-gray-600">
          {bookmarkedQuestions.filter((q) => answers[q.id]).length} of{' '}
          {bookmarkedQuestions.length} answered
        </div>
        <button
          onClick={onClose}
          className="rounded-lg bg-primary-600 px-4 py-2 text-white transition-colors hover:bg-primary-700"
        >
          Back to Test
        </button>
      </div>
    </div>
  );
}
