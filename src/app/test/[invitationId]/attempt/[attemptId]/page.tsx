'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* VS Code Style Header */}
      <div className="flex-shrink-0 border-b border-gray-700 bg-gray-900">
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
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12l-5.657 5.657-1.414-1.414L21.172 12l-4.243-4.243 1.414-1.414L24 12zM2.828 12l4.243 4.243-1.414 1.414L0 12l5.657-5.657 1.414 1.414L2.828 12z" />
                </svg>
                <h1 className="text-lg font-semibold text-white">
                  {attempt?.test.title || 'Loading...'}
                </h1>
                <span className="rounded bg-blue-600 px-2 py-1 font-mono text-xs text-white">
                  Q{currentQuestionIndex + 1}/{attempt?.test.questions.length}
                </span>
              </div>
            </div>

            {/* VS Code Style Status Bar */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-300">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-mono text-sm">
                  {Object.keys(answers).length}/{attempt?.test.questions.length}{' '}
                  completed
                </span>
              </div>

              <div className="h-6 w-32 overflow-hidden rounded bg-gray-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                  style={{
                    width: `${attempt ? (Object.keys(answers).length / attempt.test.questions.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VS Code Style Main Content */}
      <div className="flex min-h-0 flex-1 bg-gray-900">
        {/* Question Panel - VS Code Editor Style */}
        <div className="flex min-h-0 w-1/2 flex-col border-r border-gray-700 bg-gray-900">
          {/* File Tab */}
          <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center px-4 py-2">
              <div className="flex items-center space-x-2 rounded-t border-t-2 border-blue-500 bg-gray-900 px-3 py-1">
                <svg
                  className="h-4 w-4 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                <span className="font-mono text-sm text-white">
                  question.md
                </span>
                <button className="text-gray-400 hover:text-white">
                  <svg
                    className="h-3 w-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="vscode-scrollbar flex-1 overflow-y-auto bg-gray-900">
            {currentQuestion && (
              <div className="p-6">
                {/* Line Numbers and Content */}
                <div className="flex">
                  {/* Line Numbers */}
                  <div className="w-12 flex-shrink-0 select-none pr-4 text-right font-mono text-sm leading-relaxed text-gray-500">
                    <div>1</div>
                    <div>2</div>
                    <div>3</div>
                    <div>4</div>
                    <div>5</div>
                    <div>6</div>
                    <div>7</div>
                    <div>8</div>
                    <div>9</div>
                    <div>10</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 border-l border-gray-700 pl-4">
                    <div className="space-y-4">
                      {/* Question Header Comment */}
                      <div className="font-mono text-sm text-green-400">
                        <span className="text-gray-500">{'/*'}</span>
                        <br />
                        <span className="text-gray-500">
                          {' '}
                          {`*`} Question {currentQuestionIndex + 1} of{' '}
                          {attempt?.test.questions.length}
                        </span>
                        <br />
                        <span className="text-gray-500">
                          {' '}
                          {`*`} Category: Programming Assessment
                        </span>
                        <br />
                        <span className="text-gray-500"> {'*/'}</span>
                      </div>

                      {/* Question Content */}
                      <div className="prose prose-invert max-w-none">
                        <div className="text-base leading-relaxed text-gray-100">
                          <MarkdownRenderer
                            content={currentQuestion.promptText}
                            className="text-gray-100"
                          />
                        </div>
                      </div>

                      {/* Question Image */}
                      {currentQuestion.promptImageUrl && (
                        <div className="mt-6 rounded-lg border border-gray-700 bg-gray-800 p-4">
                          <img
                            src={currentQuestion.promptImageUrl}
                            alt="Question visual"
                            className="mx-auto max-h-80 w-full rounded object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Answer Panel - VS Code Terminal Style */}
        <div className="flex min-h-0 w-1/2 flex-col bg-gray-900">
          {/* Terminal Tab */}
          <div className="flex-shrink-0 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 rounded-t border-t-2 border-green-500 bg-gray-900 px-3 py-1">
                  <svg
                    className="h-4 w-4 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20,19V7H4V19H20M20,3A2,2 0 0,1 22,5V19A2,2 0 0,1 20,21H4A2,2 0 0,1 2,19V5C2,3.89 2.9,3 4,3H20M13,17V15H18V17H13M9.58,13L5.57,9H8.4L11.7,12.3C12.09,12.69 12.09,13.33 11.7,13.72L8.42,17H5.59L9.58,13Z" />
                  </svg>
                  <span className="font-mono text-sm text-white">terminal</span>
                </div>
              </div>

              {/* Timer in Terminal Style */}
              <div className="flex items-center space-x-2 font-mono text-sm text-green-400">
                <span>⏱</span>
                <span>
                  {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                </span>
              </div>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="vscode-scrollbar flex-1 overflow-y-auto bg-gray-900 p-6">
            {currentQuestion && (
              <div className="space-y-4">
                {/* Terminal Prompt */}
                <div className="font-mono text-sm text-green-400">
                  <span className="text-blue-400">user@assessment</span>
                  <span className="text-white">:</span>
                  <span className="text-purple-400">~/questions</span>
                  <span className="text-white">$ </span>
                  <span className="text-yellow-400">select-answer</span>
                </div>

                {/* Answer Options */}
                <div className="ml-4 space-y-3">
                  {currentQuestion.answerOptions.map((option, index) => {
                    const isSelected = answers[currentQuestion.id] === index;
                    const optionLetter = String.fromCharCode(65 + index);

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(currentQuestion.id, index)}
                        className={`group w-full text-left transition-all duration-200 ${
                          isSelected
                            ? 'border-l-4 border-blue-400 bg-blue-900/30'
                            : 'hover:bg-gray-800/50'
                        } rounded-r p-4 font-mono text-sm`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Terminal Style Option */}
                          <span
                            className={`flex-shrink-0 ${
                              isSelected ? 'text-blue-400' : 'text-green-400'
                            }`}
                          >
                            [{optionLetter}]
                          </span>

                          {/* Option Content */}
                          <div className="flex-1">
                            <div
                              className={`${
                                isSelected
                                  ? 'text-blue-100'
                                  : 'text-gray-300 group-hover:text-white'
                              } leading-relaxed`}
                            >
                              <MarkdownRenderer
                                content={option}
                                className={`${
                                  isSelected
                                    ? 'text-blue-100'
                                    : 'text-gray-300 group-hover:text-white'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Selection Indicator */}
                          {isSelected && (
                            <span className="text-green-400">✓</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Terminal Output */}
                <div className="ml-4 mt-6">
                  {answers[currentQuestion.id] !== undefined ? (
                    <div className="font-mono text-sm text-green-400">
                      <span className="text-gray-500">&gt;</span> Answer
                      selected: Option{' '}
                      {String.fromCharCode(65 + answers[currentQuestion.id])}
                      <br />
                      <span className="text-gray-500">&gt;</span>{' '}
                      <span className="text-green-400">
                        Ready for next question
                      </span>
                    </div>
                  ) : (
                    <div className="font-mono text-sm text-yellow-400">
                      <span className="text-gray-500">&gt;</span> Waiting for
                      input...
                      <br />
                      <span className="text-gray-500">&gt;</span>{' '}
                      <span className="animate-pulse">_</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* VS Code Style Footer/Status Bar */}
      <div className="flex-shrink-0 bg-blue-600 text-white">
        <div className="px-6 py-2">
          <div className="flex items-center justify-between text-sm">
            {/* Left Status */}
            <div className="flex items-center space-x-4 font-mono">
              <span>⚡ Assessment Mode</span>
              <span>
                🎯 Question {currentQuestionIndex + 1}/
                {attempt?.test.questions.length}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-3">
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
                disabled={currentQuestionIndex === 0}
                className="rounded bg-blue-700 px-3 py-1 font-mono text-xs transition-colors hover:bg-blue-800 disabled:bg-blue-800 disabled:opacity-50"
              >
                ← Prev
              </button>

              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => {
                    if (!attempt) return prev;
                    const newIndex = Math.min(
                      attempt.test.questions.length - 1,
                      prev + 1
                    );
                    if (newIndex !== prev) {
                      const newQuestion = attempt.test.questions[newIndex];
                      setTimeLeft(newQuestion.timerSeconds);
                    }
                    return newIndex;
                  })
                }
                disabled={
                  !attempt ||
                  currentQuestionIndex === attempt.test.questions.length - 1
                }
                className="rounded bg-blue-700 px-3 py-1 font-mono text-xs transition-colors hover:bg-blue-800 disabled:bg-blue-800 disabled:opacity-50"
              >
                Next →
              </button>

              {Object.keys(answers).length ===
                attempt?.test.questions.length && (
                <button
                  onClick={submitTest}
                  className="rounded bg-green-600 px-4 py-1 font-mono text-xs font-bold transition-colors hover:bg-green-700"
                >
                  Submit Test
                </button>
              )}
            </div>

            {/* Right Status */}
            <div className="flex items-center space-x-4 font-mono text-xs">
              <span>
                Progress:{' '}
                {Math.round(
                  (Object.keys(answers).length /
                    (attempt?.test.questions.length || 1)) *
                    100
                )}
                %
              </span>
              <span>
                ⏱ {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
