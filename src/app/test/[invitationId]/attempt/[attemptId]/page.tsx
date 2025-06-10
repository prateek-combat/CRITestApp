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
      }
    }
  }, [currentQuestionIndex, attempt]);

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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!attempt) return <div>Test attempt not found</div>;

  const currentQuestion = attempt.test.questions[currentQuestionIndex];

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{attempt.test.title}</h1>
          <div className="text-sm text-gray-500">
            Question {currentQuestionIndex + 1} of{' '}
            {attempt.test.questions.length}
          </div>
        </div>

        {currentQuestion && (
          <div>
            <p className="mb-4 text-lg">{currentQuestion.promptText}</p>
            {currentQuestion.promptImageUrl && (
              <img
                src={currentQuestion.promptImageUrl}
                alt="Question visual"
                className="mb-4 h-auto max-w-full"
              />
            )}
            <div className="space-y-3">
              {currentQuestion.answerOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion.id, index)}
                  className={`w-full rounded-lg border p-3 text-left ${
                    answers[currentQuestion.id] === index
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0 || !attempt.test.allowReview}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
            title={
              !attempt.test.allowReview
                ? 'Navigation back to previous questions is disabled for this test'
                : ''
            }
          >
            Previous
          </button>
          {currentQuestionIndex === attempt.test.questions.length - 1 ? (
            <button
              onClick={submitTest}
              disabled={submitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Test'}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(attempt.test.questions.length - 1, prev + 1)
                )
              }
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
