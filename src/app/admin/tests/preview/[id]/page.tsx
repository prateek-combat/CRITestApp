'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, ArrowRight, Clock, Eye, AlertCircle } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  answerOptions: string[];
  correctAnswerIndex: number;
  category: string;
  timerSeconds: number;
}

interface Test {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export default function TestPreviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, number>>(
    {}
  );

  // Fetch test data
  const fetchTest = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tests/${testId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch test');
      }
      const data = await response.json();
      setTest(data);
      if (data.questions.length > 0) {
        setTimeLeft(data.questions[0].timerSeconds || 30);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTest();
  }, [fetchTest]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (!test) return;

    // Save the answer if one was selected
    if (selectedAnswer !== null) {
      const currentQuestion = test.questions[currentQuestionIndex];
      setPreviewAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: selectedAnswer,
      }));
    }

    // Move to next question
    if (currentQuestionIndex < test.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(previewAnswers[test.questions[nextIndex].id] ?? null);
      setTimeLeft(test.questions[nextIndex].timerSeconds || 30);
      setIsTimerRunning(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (!test || currentQuestionIndex <= 0) return;

    const prevIndex = currentQuestionIndex - 1;
    setCurrentQuestionIndex(prevIndex);
    setSelectedAnswer(previewAnswers[test.questions[prevIndex].id] ?? null);
    setTimeLeft(test.questions[prevIndex].timerSeconds || 30);
    setIsTimerRunning(false);
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    if (test && test.questions[currentQuestionIndex]) {
      setTimeLeft(test.questions[currentQuestionIndex].timerSeconds || 30);
      setIsTimerRunning(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading test preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            Error Loading Test
          </h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!test || test.questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📝</div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            No Questions Found
          </h2>
          <p className="mb-4 text-gray-600">
            This test doesn't have any questions yet.
          </p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-gray-700 bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* VS Code Style Title Bar */}
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center space-x-3">
                <Eye className="h-6 w-6 text-blue-400" />
                <h1 className="text-lg font-semibold text-white">
                  {test.title} (Preview Mode)
                </h1>
                <span className="rounded bg-blue-600 px-2 py-1 font-mono text-xs text-white">
                  Q{currentQuestionIndex + 1}/{test.questions.length}
                </span>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-sm text-white">
                  {formatTime(timeLeft)}
                </span>
                <button
                  onClick={isTimerRunning ? pauseTimer : startTimer}
                  className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                >
                  {isTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={resetTimer}
                  className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700"
                >
                  Reset
                </button>
              </div>
              <button
                onClick={() => router.back()}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
              >
                Exit Preview
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 w-full rounded-full bg-gray-700">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preview Notice */}
      <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Preview Mode:</strong> You are viewing this test as it
              appears to candidates. No data will be saved and this won't affect
              any statistics.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white p-8 shadow-lg">
            {/* Question */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Question {currentQuestionIndex + 1}
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">
                  {currentQuestion.category}
                </span>
              </div>

              <div className="prose max-w-none">
                <MarkdownRenderer
                  content={currentQuestion.promptText}
                  className="text-gray-900"
                />
              </div>

              {currentQuestion.promptImageUrl && (
                <div className="mt-4">
                  <img
                    src={currentQuestion.promptImageUrl}
                    alt="Question"
                    className="max-w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        selectedAnswer === index
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedAnswer === index && '✓'}
                    </div>
                    <div className="text-gray-900">
                      <MarkdownRenderer
                        content={option}
                        className="text-gray-900"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600 disabled:opacity-50 disabled:hover:bg-gray-500"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </button>

              <div className="text-sm text-gray-500">
                {Object.keys(previewAnswers).length} of {test.questions.length}{' '}
                answered
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === test.questions.length - 1}
                className="flex items-center rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50 disabled:hover:bg-blue-500"
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
