'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            {testAttempt.test.title}
          </h1>
          <p className="text-gray-600">
            Question {currentQuestionIndex + 1} of{' '}
            {testAttempt.test.questions.length}
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="whitespace-pre-wrap text-lg text-gray-700 sm:text-xl">
            {currentQuestion.promptText}
          </p>
          {currentQuestion.promptImageUrl && (
            <div className="mt-4">
              <img
                src={currentQuestion.promptImageUrl}
                alt="Question visual"
                className="max-h-96 w-full rounded-lg object-contain"
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="mb-6 text-center text-2xl font-bold text-indigo-600 sm:text-3xl">
          Time Left: {timeLeft !== null ? timeLeft : '-'}s
        </div>

        <div className="mb-8 space-y-3">
          {currentQuestion.answerOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(index)}
              className={`w-full rounded-lg border-2 p-4 text-left transition-colors duration-150 ease-in-out ${
                selectedAnswer === index
                  ? 'border-indigo-600 bg-indigo-500 text-white shadow-md'
                  : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
              } `}
            >
              <span
                className={`font-medium ${selectedAnswer === index ? 'text-white' : 'text-gray-700'}`}
              >
                {option}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={loading || selectedAnswer === null}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition duration-150 ease-in-out hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? 'Saving...'
            : currentQuestionIndex < testAttempt.test.questions.length - 1
              ? 'Next Question'
              : 'Finish Test'}
        </button>
        {error && <p className="mt-4 text-red-500">Error: {error}</p>}
      </div>
    </div>
  );
}
