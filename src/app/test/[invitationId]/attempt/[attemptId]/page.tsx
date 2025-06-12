'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  timerSeconds: number;
  answerOptions: string[];
  correctAnswerIndex: number;
  sectionTag: string | null;
}

interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  allowReview?: boolean;
}

interface TestAttempt {
  id: string;
  status: string;
  test: Test;
  submittedAnswers: SubmittedAnswer[];
}

interface SubmittedAnswer {
  id: string;
  questionId: string;
  selectedAnswerIndex: number;
  isCorrect: boolean;
}

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const [attempt, setAttempt] = useState<TestAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<
    Record<string, string>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    fetchAttempt();
  }, []);

  useEffect(() => {
    if (attempt) {
      // Start timing for the current question
      const currentQuestion = attempt.test.questions[currentQuestionIndex];
      if (currentQuestion && !questionStartTime[currentQuestion.id]) {
        setQuestionStartTime((prev) => ({
          ...prev,
          [currentQuestion.id]: new Date().toISOString(),
        }));
        setTimeLeft(currentQuestion.timerSeconds);
      }
    }
  }, [currentQuestionIndex, attempt]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) {
        // Auto advance when time runs out
        if (
          attempt &&
          currentQuestionIndex < attempt.test.questions.length - 1
        ) {
          setCurrentQuestionIndex((prev) => prev + 1);
        } else {
          submitTest();
        }
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, currentQuestionIndex, attempt]);

  const fetchAttempt = async () => {
    try {
      const response = await fetch(`/api/test-attempts/${params.attemptId}`);
      if (!response.ok) throw new Error('Failed to fetch attempt');
      const data = await response.json();
      setAttempt(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load test attempt'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }));
  };

  const submitTest = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/test-attempts/${attempt?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answers,
          questionStartTime,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit test');
      }

      const result = await response.json();
      router.push(
        `/test/${params.invitationId}/complete?invitationId=${params.invitationId}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (error)
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Error: {error}
      </div>
    );
  if (!attempt)
    return (
      <div className="flex h-screen items-center justify-center">
        Test attempt not found
      </div>
    );

  const currentQuestion = attempt.test.questions[currentQuestionIndex];

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Compact Header */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="truncate text-lg font-semibold text-gray-900">
            {attempt.test.title}
          </h1>
          <div className="text-xs text-gray-500">
            Question {currentQuestionIndex + 1} of{' '}
            {attempt.test.questions.length}
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed Height */}
      <div className="flex min-h-0 flex-1">
        {/* Left Half - Question Content */}
        <div className="flex min-h-0 w-1/2 flex-col border-r border-gray-200 bg-white p-4">
          <div className="flex-1 overflow-y-auto">
            {currentQuestion && (
              <div className="space-y-4">
                <div>
                  <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                    {currentQuestion.promptText}
                  </p>
                </div>
                {currentQuestion.promptImageUrl && (
                  <div className="flex justify-center">
                    <img
                      src={currentQuestion.promptImageUrl}
                      alt="Question visual"
                      className="max-h-64 max-w-full rounded-lg object-contain shadow-sm"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Half - Answer Options */}
        <div className="flex min-h-0 w-1/2 flex-col bg-gray-50 p-4">
          <div className="flex-1 overflow-y-auto">
            {currentQuestion && (
              <div className="space-y-2">
                <h3 className="mb-3 text-base font-medium text-gray-900">
                  Choose your answer:
                </h3>
                {currentQuestion.answerOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, index)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition-all duration-200 ${
                      answers[currentQuestion.id] === index
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                          answers[currentQuestion.id] === index
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-gray-300'
                        }`}
                      >
                        {answers[currentQuestion.id] === index && (
                          <div className="m-0.5 h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-sm leading-relaxed">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compact Footer with Navigation and Timer */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Top Row - Timer and Status */}
          <div className="flex items-center space-x-6">
            {/* Answer Status */}
            <div className="flex items-center space-x-2">
              {answers[currentQuestion.id] !== undefined ? (
                <div className="flex items-center space-x-1 text-green-600">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xs font-medium">Selected</span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Select an answer</span>
              )}
            </div>

            {/* Compact Timer */}
            <div className="flex items-center space-x-2 rounded-full bg-gray-100 px-3 py-1">
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900">
                {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="h-2 w-32 rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-indigo-600 transition-all duration-1000"
                style={{
                  width: `${
                    timeLeft !== null && currentQuestion
                      ? (timeLeft / currentQuestion.timerSeconds) * 100
                      : 0
                  }%`,
                }}
              ></div>
            </div>

            {/* Progress Text */}
            <span className="text-sm text-gray-500">
              {Object.keys(answers).length} of {attempt.test.questions.length}{' '}
              answered
            </span>
          </div>

          {/* Bottom Row - Navigation Buttons */}
          <div className="flex items-center justify-center space-x-4">
            {/* Previous Button */}
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) => {
                  const newIndex = Math.max(0, prev - 1);
                  if (attempt && newIndex !== prev) {
                    const newQuestion = attempt.test.questions[newIndex];
                    setTimeLeft(newQuestion.timerSeconds);
                  }
                  return newIndex;
                })
              }
              disabled={currentQuestionIndex === 0 || !attempt.test.allowReview}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ${
                currentQuestionIndex === 0 || !attempt.test.allowReview
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
              title={
                !attempt.test.allowReview
                  ? 'Navigation back to previous questions is disabled for this test'
                  : ''
              }
            >
              Previous
            </button>

            {/* Next/Submit Button */}
            {currentQuestionIndex === attempt.test.questions.length - 1 ? (
              <button
                onClick={submitTest}
                disabled={submitting}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => {
                    const newIndex = Math.min(
                      attempt.test.questions.length - 1,
                      prev + 1
                    );
                    if (attempt && newIndex !== prev) {
                      const newQuestion = attempt.test.questions[newIndex];
                      setTimeLeft(newQuestion.timerSeconds);
                    }
                    return newIndex;
                  })
                }
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-indigo-700"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
