'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

interface UserAnswer {
  questionId: string;
  selectedAnswerIndex: number | null;
  timeTakenSeconds?: number;
}

export default function TestTakingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: testAttemptId } = use(params);
  const searchParams = useSearchParams();

  const [isPublicTest, setIsPublicTest] = useState(false);
  const [testAttempt, setTestAttempt] = useState<TestAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTestAttempt = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const isPublic = searchParams.get('type') === 'public';
      setIsPublicTest(isPublic);

      const url = isPublic
        ? `/api/public-test-attempts/${testAttemptId}`
        : `/api/test-attempts/${testAttemptId}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch test attempt');
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
          firstUnansweredIndex = 0; // Or redirect to results if all are answered

        const startIndex =
          firstUnansweredIndex < data.test.questions.length
            ? firstUnansweredIndex
            : 0;
        setCurrentQuestionIndex(startIndex);
        setTimeLeft(data.test.questions[startIndex]?.timerSeconds ?? 60);
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
  }, [testAttemptId, searchParams]);

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

  const handleNextQuestion = useCallback(async () => {
    if (!testAttempt) return;
    setLoading(true);
    setError(null);

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
      await handleSubmitTest();
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
      const isPublic = searchParams.get('type') === 'public';
      const url = isPublic
        ? `/api/public-test-attempts/${testAttemptId}/progress`
        : `/api/test-attempts/${testAttemptId}/progress`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswers,
          currentQuestionIndex: testAttempt.test.questions.length - 1, // -1 for summary
        }),
      });

      if (testAttempt.test.questions.length - 1 === currentQuestionIndex) {
        // Now submit the final completion status
        const finalUrl = isPublic
          ? `/api/public-test-attempts/${testAttemptId}`
          : `/api/test-attempts/${testAttemptId}`;
        await fetch(finalUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'COMPLETED',
            answers: finalAnswers.reduce(
              (acc, ans) => {
                acc[ans.questionId] = { answerIndex: ans.selectedAnswerIndex };
                return acc;
              },
              {} as Record<string, { answerIndex: number | null }>
            ),
          }),
        });

        router.push(
          isPublic
            ? `/test/results/${testAttemptId}?type=public`
            : `/test/results/${testAttemptId}`
        );
      } else {
        setCurrentQuestionIndex(testAttempt.test.questions.length - 1);
        setSelectedAnswer(null); // Reset for next question
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      setTimeLeft(testAttempt?.test.questions[prevIndex].timerSeconds ?? 60);
      const previousAnswer = userAnswers.find(
        (a) => a.questionId === testAttempt?.test.questions[prevIndex].id
      );
      setSelectedAnswer(previousAnswer?.selectedAnswerIndex ?? null);
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
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Thinner Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-2 shadow-sm">
        <h1 className="text-lg font-bold text-gray-800">
          {testAttempt.test.title}
        </h1>
        <div className="relative h-2.5 w-64 rounded-full bg-gray-200">
          <div
            className="absolute h-full rounded-full bg-green-500 transition-all"
            style={{
              width: `${
                (userAnswers.filter((a) => a.selectedAnswerIndex !== null)
                  .length /
                  testAttempt.test.questions.length) *
                100
              }%`,
            }}
          ></div>
        </div>
      </header>

      {/* Main Content with 2/3 and 1/3 split */}
      <main className="flex-grow overflow-hidden p-4">
        <div className="grid h-full grid-cols-3 gap-4">
          {/* Question Panel */}
          <div className="col-span-2 flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Question {currentQuestionIndex + 1}
              </h2>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <MarkdownRenderer
                content={currentQuestion.promptText}
                className="rendered-markdown-content"
              />
            </div>
          </div>

          {/* Answer Panel */}
          <div className="col-span-1 flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Choose Your Answer
              </h3>
            </div>
            <div className="flex-grow overflow-y-auto p-6">
              <div className="space-y-3">
                {currentQuestion.answerOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`flex w-full items-center rounded-lg border-2 p-3 text-left transition-all duration-150 ${
                      selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                        : 'border-gray-300 bg-white hover:border-blue-400'
                    }`}
                  >
                    <span
                      className={`mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                        selectedAnswer === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm text-gray-800">{option}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Thinner Footer with new layout */}
      <footer className="flex items-center justify-between border-t bg-white px-6 py-2 shadow-inner">
        <div className="w-1/4">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className="rounded-md bg-gray-300 px-6 py-2 font-semibold text-gray-700 transition hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
        </div>

        <div className="flex w-1/2 items-center justify-center font-mono text-lg font-bold text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-6 w-6 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {timeLeft !== null ? Math.floor(timeLeft / 60) : 0}:
          {timeLeft !== null
            ? (timeLeft % 60).toString().padStart(2, '0')
            : '00'}
        </div>

        <div className="flex w-1/4 justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="rounded-md bg-blue-600 px-8 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {currentQuestionIndex === testAttempt.test.questions.length - 1
              ? 'Finish & Submit'
              : 'Next'}
          </button>
        </div>
      </footer>
    </div>
  );
}
