'use client';

import { AlertCircle, Play } from 'lucide-react';

interface ResumeTestNotificationProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  startedAt: string;
  onResume: () => void;
  onRestart?: () => void;
}

export default function ResumeTestNotification({
  currentQuestionIndex,
  totalQuestions,
  answeredQuestions,
  startedAt,
  onResume,
  onRestart,
}: ResumeTestNotificationProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const progressPercentage = Math.round(
    (answeredQuestions / totalQuestions) * 100
  );

  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-orange-200 bg-white p-6 shadow-lg">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <AlertCircle className="h-8 w-8 text-orange-500" />
        </div>
        <div className="flex-grow">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Resume Your Test
          </h3>
          <p className="mb-4 text-gray-600">
            You have an in-progress test that you can continue from where you
            left off.
          </p>

          {/* Progress Summary */}
          <div className="mb-4 rounded-lg bg-gray-50 p-4">
            <h4 className="mb-3 font-medium text-gray-800">Test Progress</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Current Question:</span>
                <span className="font-medium">
                  {currentQuestionIndex + 1} of {totalQuestions}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Questions Answered:</span>
                <span className="font-medium">
                  {answeredQuestions} ({progressPercentage}%)
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Started At:</span>
                <span className="font-medium">{formatDate(startedAt)}</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onResume}
              className="flex flex-1 items-center justify-center rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
            >
              <Play className="mr-2 h-4 w-4" />
              Resume Test
            </button>
            {onRestart && (
              <button
                onClick={onRestart}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
              >
                Start Over
              </button>
            )}
          </div>

          <p className="mt-3 text-xs text-gray-500">
            💡 Your previous answers have been saved. You can continue from
            Question {currentQuestionIndex + 1}.
          </p>
        </div>
      </div>
    </div>
  );
}
