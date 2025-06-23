'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface AnswerOption {
  text: string;
  // Potentially add other properties if needed, e.g., id
}

interface Question {
  id: string;
  promptText: string;
  promptImageUrl?: string | null;
  answerOptions: string[]; // Array of strings representing answer texts
  correctAnswerIndex: number; // This might not be directly used on client during test
  timerSeconds: number;
  sectionTag?: string | null;
}

interface Test {
  id: string;
  title: string;
  questions: Question[];
}

interface SubmittedAnswerPayload {
  questionId: string;
  selectedAnswerIndex: number | null; // null if not answered
  timeTakenSeconds?: number; // Optional: track time per question
}

interface TestAttempt {
  id: string;
  test: Test;
  status: string; // e.g., IN_PROGRESS, COMPLETED
  submittedAnswers: SubmittedAnswerPayload[]; // Existing answers if resuming
  // Add other relevant fields from your TestAttempt model
}

export default function TestTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: testAttemptId } = use(params);

  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<SubmittedAnswerPayload[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestAttempt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/test-attempts/${testAttemptId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch test attempt');
      }
      const data: TestAttempt = await response.json();
      setTestAttempt(data);

      if (data.test && data.test.questions.length > 0) {
        // Initialize userAnswers based on existing submittedAnswers or create new ones
        const initialAnswers = data.test.questions.map((q) => {
          const existing = data.submittedAnswers.find(
            (sa) => sa.questionId === q.id
          );
          return existing || { questionId: q.id, selectedAnswerIndex: null };
        });
        setUserAnswers(initialAnswers);

        // Find the first unanswered question or start from the beginning
        let firstUnansweredIndex = initialAnswers.findIndex(
          (ans) => ans.selectedAnswerIndex === null
        );
        if (firstUnansweredIndex === -1 && initialAnswers.length > 0)
          firstUnansweredIndex = initialAnswers.length; // All answered, go to summary/end

        setCurrentQuestionIndex(
          firstUnansweredIndex < data.test.questions.length
            ? firstUnansweredIndex
            : 0
        );
        setTimeLeft(
          data.test.questions[
            firstUnansweredIndex < data.test.questions.length
              ? firstUnansweredIndex
              : 0
          ]?.timerSeconds ?? 60
        );
      } else if (data.test && data.test.questions.length === 0) {
        setError('This test has no questions.');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setLoading(false);
    }
  }, [testAttemptId]);

  useEffect(() => {
    if (testAttemptId) {
      fetchTestAttempt();
    }
  }, [testAttemptId, fetchTestAttempt]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      // If time runs out, and we are not already at the end.
      if (
        timeLeft === 0 &&
        testAttempt &&
        currentQuestionIndex < testAttempt.test.questions.length
      ) {
        handleNextQuestion();
      }
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, currentQuestionIndex, testAttempt]);

  const handleAnswerSelect = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
    // Optionally submit answer immediately or wait for next button
  };

  const handleNextQuestion = useCallback(() => {
    if (!testAttempt) return;

    // Store current answer
    const currentQuestion = testAttempt.test.questions[currentQuestionIndex];
    const timeTaken = currentQuestion.timerSeconds - (timeLeft ?? 0);

    setUserAnswers((prevAnswers) => {
      const newAnswers = [...prevAnswers];
      const answerIndex = newAnswers.findIndex(
        (a) => a.questionId === currentQuestion.id
      );
      if (answerIndex !== -1) {
        newAnswers[answerIndex] = {
          questionId: currentQuestion.id,
          selectedAnswerIndex: selectedAnswer,
          timeTakenSeconds: timeTaken,
        };
      } else {
        newAnswers.push({
          questionId: currentQuestion.id,
          selectedAnswerIndex: selectedAnswer,
          timeTakenSeconds: timeTaken,
        });
      }
      return newAnswers;
    });

    setSelectedAnswer(null); // Reset selected answer for next question

    if (currentQuestionIndex < testAttempt.test.questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setTimeLeft(testAttempt.test.questions[nextIndex].timerSeconds);
    } else {
      // Last question answered, move to submit/summary
      handleSubmitTest();
    }
  }, [
    currentQuestionIndex,
    selectedAnswer,
    timeLeft,
    testAttempt,
    userAnswers,
  ]);

  const handleSubmitTest = async () => {
    if (!testAttempt) return;
    setLoading(true);
    setError(null);

    // Ensure the very last answer is captured if not already by handleNextQuestion
    // This might be redundant if handleNextQuestion is always called before submit.
    const finalAnswers = [...userAnswers];
    const currentQuestion = testAttempt.test.questions[currentQuestionIndex];
    if (
      currentQuestion &&
      !finalAnswers.find(
        (a) =>
          a.questionId === currentQuestion.id && a.selectedAnswerIndex !== null
      )
    ) {
      const timeTaken = currentQuestion.timerSeconds - (timeLeft ?? 0);
      const answerIndex = finalAnswers.findIndex(
        (a) => a.questionId === currentQuestion.id
      );
      if (answerIndex !== -1) {
        finalAnswers[answerIndex] = {
          questionId: currentQuestion.id,
          selectedAnswerIndex: selectedAnswer,
          timeTakenSeconds: timeTaken,
        };
      } else {
        finalAnswers.push({
          questionId: currentQuestion.id,
          selectedAnswerIndex: selectedAnswer,
          timeTakenSeconds: timeTaken,
        });
      }
    }

    try {
      const response = await fetch(`/api/test-attempts/${testAttemptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED', // Or other appropriate status
          submittedAnswers: finalAnswers,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit test');
      }
      // const result = await response.json();
      router.push(`/test/results/${testAttemptId}`); // Redirect to a results page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setLoading(false);
    }
  };

  if (loading && !testAttempt)
    return <div className="p-4 text-center">Loading test...</div>;
  if (error)
    return <div className="p-4 text-center text-red-600">Error: {error}</div>;
  if (
    !testAttempt ||
    !testAttempt.test ||
    testAttempt.test.questions.length === 0
  ) {
    return (
      <div className="p-4 text-center">
        Test not found or no questions available.
      </div>
    );
  }

  const currentQuestion = testAttempt.test.questions[currentQuestionIndex];

  if (!currentQuestion) {
    // This case implies all questions are answered, or an issue with indexing
    if (
      currentQuestionIndex >= testAttempt.test.questions.length &&
      testAttempt.test.questions.length > 0
    ) {
      return (
        <div className="mx-auto max-w-2xl p-6">
          <h1 className="mb-4 text-2xl font-bold">Test Completed!</h1>
          <p className="mb-6">All questions have been answered.</p>
          <button
            onClick={handleSubmitTest}
            disabled={loading}
            className="w-full rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition duration-150 ease-in-out hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'View Results'}
          </button>
          {error && (
            <p className="mt-4 text-red-500">Error submitting: {error}</p>
          )}
        </div>
      );
    }
    return (
      <div className="p-4 text-center">No current question to display.</div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">
          {testAttempt.test.title}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Question {currentQuestionIndex + 1} of{' '}
            {testAttempt.test.questions.length}
          </span>
          <div className="relative h-10 w-10">
            <svg
              className="absolute inset-0"
              width="40"
              height="40"
              viewBox="0 0 40 40"
            >
              <circle
                className="text-gray-200"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="16"
                cx="20"
                cy="20"
              />
              <circle
                className="text-blue-500"
                strokeWidth="4"
                strokeDasharray={`${(
                  ((timeLeft ?? 0) / currentQuestion.timerSeconds) *
                  100.5
                ).toFixed(2)}, 100.5`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="16"
                cx="20"
                cy="20"
                transform="rotate(-90 20 20)"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
              {timeLeft}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="mb-2 text-lg font-semibold text-gray-700">
                Question {currentQuestionIndex + 1}
              </h2>
              <p className="text-sm text-gray-500">
                Read carefully and analyze
              </p>
            </div>

            <div className="prose prose-gray prose-enhanced max-w-none">
              <MarkdownRenderer
                content={currentQuestion.promptText}
                className="leading-relaxed text-gray-800"
              />
            </div>

            {currentQuestion.promptImageUrl && (
              <div className="mt-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-inner">
                <img
                  src={currentQuestion.promptImageUrl}
                  alt="Question visual"
                  className="mx-auto max-h-80 w-full rounded-xl object-contain shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900">
                Choose your answer
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select the best option below
              </p>
            </div>

            <div className="space-y-4">
              {currentQuestion.answerOptions.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const optionLetter = String.fromCharCode(65 + index);

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`test-answer-option group relative w-full rounded-2xl border-2 p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                      isSelected
                        ? 'selected border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${
                          isSelected
                            ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                            : 'border-gray-300 bg-white text-gray-600 group-hover:border-blue-400 group-hover:bg-blue-50 group-hover:text-blue-600'
                        }`}
                      >
                        {optionLetter}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div
                          className={`font-medium leading-relaxed transition-colors ${
                            isSelected
                              ? 'text-blue-900'
                              : 'text-gray-800 group-hover:text-gray-900'
                          }`}
                        >
                          <MarkdownRenderer content={option} />
                        </div>
                      </div>

                      <div
                        className={`flex-shrink-0 transition-all duration-300 ${
                          isSelected
                            ? 'scale-100 opacity-100'
                            : 'scale-75 opacity-0'
                        }`}
                      >
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                          <svg
                            className="h-4 w-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-10">
              <button
                onClick={handleNextQuestion}
                disabled={loading || selectedAnswer === null}
                className="btn-primary w-full rounded-2xl px-8 py-4 font-semibold text-white shadow-xl transition-all duration-300 hover:shadow-2xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-xl"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving your answer...</span>
                  </div>
                ) : currentQuestionIndex <
                  testAttempt.test.questions.length - 1 ? (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Continue to Next Question</span>
                    <svg
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5-5 5M6 12h12"
                      />
                    </svg>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Complete Test</span>
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
                )}
              </button>

              {selectedAnswer === null && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-amber-600">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <p className="text-sm font-medium">
                    Please select an answer to continue
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 p-6 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-red-800">
                  Something went wrong
                </h4>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
