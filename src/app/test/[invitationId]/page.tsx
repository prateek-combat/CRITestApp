'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import QuestionTimer from '@/components/QuestionTimer';
import Link from 'next/link';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  timerSeconds: number;
  answerOptions: string[];
  category: string;
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
}

interface Invitation {
  id: string;
  status: string;
  test: Test;
  candidateName?: string;
  candidateEmail?: string;
}

export default function TestPage() {
  const params = useParams();
  const router = useRouter();
  const invitationId = params.invitationId as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { answerIndex: number; timeTaken?: number }>
  >({});
  const [questionStartTime, setQuestionStartTime] = useState<
    Record<string, { epoch: number; key: string | number }>
  >({});
  const [testAttempt, setTestAttempt] = useState<any>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  const fetchInvitationDetails = useCallback(async () => {
    if (!invitationId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `Failed to fetch invitation (${res.status})`
        );
      }
      const data = await res.json();
      setInvitation(data);
      setCandidateName(data.candidateName || '');
      setCandidateEmail(data.candidateEmail || '');

      if (data.id) {
        const attemptRes = await fetch(
          `/api/test-attempts?invitationId=${data.id}`
        );
        if (attemptRes.ok) {
          const attemptData = await attemptRes.json();
          if (attemptData && attemptData.id) {
            const relevantAttempt = Array.isArray(attemptData)
              ? attemptData[0]
              : attemptData;
            if (relevantAttempt && relevantAttempt.id) {
              setTestAttempt(relevantAttempt);
              if (relevantAttempt.status === 'COMPLETED') {
              } else if (relevantAttempt.status === 'IN_PROGRESS') {
                setDetailsSubmitted(true);
                setTestStarted(true);
              }
            }
          }
        } else {
          console.warn('Could not fetch existing test attempt details.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [invitationId]);

  useEffect(() => {
    fetchInvitationDetails();
  }, [fetchInvitationDetails]);

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim()) {
      setError('Name and Email are required.');
      return;
    }
    setError(null);
    setIsUpdatingDetails(true);
    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateName, candidateEmail }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || 'Failed to update candidate details.'
        );
      }
      setDetailsSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const startTest = async () => {
    if (!invitation || error) return;

    try {
      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: invitation.id,
          answers: {},
          questionStartTime: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to start the test. Please try again.'
        );
      }

      setTestStarted(true);
      const firstQuestion = invitation.test.questions[0];
      if (firstQuestion) {
        setQuestionStartTime({
          [firstQuestion.id]: { epoch: Date.now(), key: firstQuestion.id },
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while trying to start the test.'
      );
    }
  };

  const handleAnswer = (questionId: string, answerIndex: number) => {
    const questionInitialStartTime =
      questionStartTime[questionId]?.epoch || Date.now();
    const timeTaken = Math.floor(
      (Date.now() - questionInitialStartTime) / 1000
    );

    setAnswers((prev) => ({
      ...prev,
      [questionId]: { answerIndex, timeTaken },
    }));
  };

  const navigateQuestion = (direction: 'next' | 'prev') => {
    if (!invitation) return;
    const newIndex =
      direction === 'next'
        ? Math.min(
            currentQuestionIndex + 1,
            invitation.test.questions.length - 1
          )
        : Math.max(currentQuestionIndex - 1, 0);

    setCurrentQuestionIndex(newIndex);

    // Set start time for the new question if not already set
    const newQuestion = invitation.test.questions[newIndex];
    if (newQuestion && !questionStartTime[newQuestion.id]) {
      setQuestionStartTime((prev) => ({
        ...prev,
        [newQuestion.id]: { epoch: Date.now(), key: newQuestion.id },
      }));
    }
  };

  const handleTimeExpired = () => {
    if (!invitation) return;
    if (currentQuestionIndex < invitation.test.questions.length - 1) {
      navigateQuestion('next');
    } else {
      submitTest();
    }
  };

  const submitTest = async () => {
    if (isSubmitting || !invitation) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const finalQuestionStartTimes = { ...questionStartTime };
      invitation.test.questions.forEach((q) => {
        if (!finalQuestionStartTimes[q.id]) {
          finalQuestionStartTimes[q.id] = { epoch: Date.now(), key: q.id };
        }
      });

      const response = await fetch('/api/test-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationId: invitation.id,
          answers,
          questionStartTime: finalQuestionStartTimes,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit test answers.');
      }
      router.push(
        `/test/${invitation.id}/complete?invitationId=${invitation.id}`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during test submission.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonClasses = (
    variant: 'primary' | 'secondary' | 'answer' | 'selectedAnswer',
    disabled = false
  ) => {
    let base =
      'w-full text-left p-3 md:p-4 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2';
    if (disabled) base += ' opacity-60 cursor-not-allowed';

    switch (variant) {
      case 'primary':
        return `${base} bg-military-green text-primary-white hover:bg-military-green/90 focus:ring-military-green ${disabled ? 'hover:bg-military-green' : ''}`;
      case 'secondary':
        return `${base} bg-gray-200 text-text-dark hover:bg-gray-300 focus:ring-gray-400 ${disabled ? 'hover:bg-gray-200' : ''}`;
      case 'answer':
        return `${base} bg-primary-white border border-gray-300 hover:border-accent-orange hover:bg-orange-50 text-text-dark focus:ring-accent-orange`;
      case 'selectedAnswer':
        return `${base} bg-accent-orange border border-transparent text-primary-white ring-2 ring-accent-orange`;
      default:
        return base;
    }
  };

  if (isLoading || (!invitation && !error && !detailsSubmitted)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4">
        <div className="rounded-lg bg-primary-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold text-military-green">
            Loading Test...
          </h1>
          <p className="text-text-light">
            Please wait while we prepare your assessment.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4">
        <div className="rounded-lg bg-primary-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold text-accent-orange">
            An Error Occurred
          </h1>
          <p className="mb-6 text-text-light">{error}</p>
          <Link
            href="/"
            className="rounded-md bg-military-green px-6 py-3 text-primary-white transition-colors hover:bg-opacity-80"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4">
        <div className="rounded-lg bg-primary-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-3xl font-bold text-accent-orange">
            Test Not Found
          </h1>
          <p className="mb-6 text-text-light">
            The test link seems to be invalid or expired.
          </p>
          <Link
            href="/"
            className="rounded-md bg-military-green px-6 py-3 text-primary-white transition-colors hover:bg-opacity-80"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Check if invitation is revoked/cancelled
  if (invitation.status === 'CANCELLED' || invitation.status === 'EXPIRED') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4">
        <div className="w-full max-w-md rounded-lg bg-primary-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-red-600">
            {invitation.status === 'CANCELLED'
              ? 'Test Invitation Revoked'
              : 'Test Invitation Expired'}
          </h1>
          <p className="mb-6 text-text-light">
            {invitation.status === 'CANCELLED'
              ? 'This test invitation has been cancelled by the administrator.'
              : 'This test invitation has expired and is no longer valid.'}
          </p>
          <p className="mb-6 text-sm text-gray-500">
            If you believe this is an error, please contact the administrator
            for a new invitation.
          </p>
          <Link
            href="/"
            className="rounded-md bg-military-green px-6 py-3 text-primary-white transition-colors hover:bg-opacity-80"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (
    testAttempt?.status === 'COMPLETED' ||
    invitation.status === 'COMPLETED'
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4">
        <div className="w-full max-w-md rounded-lg bg-primary-white p-12 text-center shadow-xl">
          <h1 className="mb-6 text-4xl font-bold text-military-green">
            Test Completed!
          </h1>
          <p className="mb-8 text-xl text-text-dark">
            Thank you for completing the Combat Test.
          </p>
          <Link
            href="/"
            className="w-full rounded-md bg-military-green px-6 py-3 text-lg font-semibold text-primary-white transition-colors hover:bg-opacity-90"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (
    !detailsSubmitted &&
    invitation &&
    invitation.status !== 'COMPLETED' &&
    testAttempt?.status !== 'COMPLETED'
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-6">
        <div className="w-full max-w-lg rounded-xl bg-primary-white p-8 shadow-2xl md:p-12">
          <h1 className="mb-6 text-center text-3xl font-bold text-military-green md:text-4xl">
            Welcome to the Combat Test
          </h1>
          <p className="mb-8 text-center text-text-light">
            Please enter your details to begin the assessment.
          </p>
          {error && (
            <p className="mb-6 rounded-md bg-red-100 p-3 text-sm text-red-500">
              {error}
            </p>
          )}
          <form onSubmit={handleDetailsSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="candidateName"
                className="mb-1 block text-sm font-medium text-text-dark"
              >
                Full Name
              </label>
              <input
                type="text"
                id="candidateName"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-military-green focus:ring-military-green"
                placeholder="Your Full Name"
              />
            </div>
            <div>
              <label
                htmlFor="candidateEmail"
                className="mb-1 block text-sm font-medium text-text-dark"
              >
                Email Address
              </label>
              <input
                type="email"
                id="candidateEmail"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-4 py-3 placeholder-gray-400 shadow-sm focus:border-military-green focus:ring-military-green"
                placeholder="your.email@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={
                isUpdatingDetails ||
                !candidateName.trim() ||
                !candidateEmail.trim()
              }
              className="flex w-full items-center justify-center rounded-md bg-military-green px-6 py-3 font-semibold text-primary-white transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isUpdatingDetails ? (
                <svg
                  className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                'Proceed to Test'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (
    !testStarted &&
    detailsSubmitted &&
    invitation &&
    invitation.test &&
    invitation.test.questions &&
    invitation.test.questions.length > 0
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-off-white p-4">
        <div className="w-full max-w-2xl rounded-xl bg-primary-white p-6 shadow-2xl md:p-10">
          <h1 className="mb-6 text-center text-3xl font-bold text-military-green md:text-4xl">
            {invitation.test.title}
          </h1>
          {invitation.test.description && (
            <p className="mb-6 text-center text-text-light">
              {invitation.test.description}
            </p>
          )}
          <div className="mb-8 rounded-lg border border-gray-200 bg-off-white p-4">
            <h2 className="mb-3 text-xl font-semibold text-text-dark">
              Instructions
            </h2>
            <ul className="list-inside list-disc space-y-2 text-text-dark">
              <li>
                Each question has its own time limit, shown by the timer bar.
              </li>
              <li>
                There are <strong>{invitation.test.questions.length}</strong>{' '}
                questions in this test.
              </li>
              <li>Answer each question to the best of your ability.</li>
              <li>Your progress is saved as you move between questions.</li>
              <li>
                Click 'Submit Test' on the last question when you are finished.
              </li>
            </ul>
          </div>
          <button
            onClick={startTest}
            className={buttonClasses('primary') + ' py-3 text-lg md:py-4'}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-4 text-center">
        <div className="w-full max-w-lg rounded-lg bg-primary-white p-8 shadow-2xl">
          <h2 className="mb-4 text-2xl font-bold text-military-green">
            Test Over
          </h2>
          <p className="mb-6 text-text-dark">
            Loading results or all questions answered. If you haven't been
            redirected, please wait or click submit if available.
          </p>
          <button
            onClick={submitTest}
            disabled={isSubmitting}
            className={buttonClasses('primary', isSubmitting)}
          >
            {isSubmitting ? 'Submitting... ' : 'View Results (or Submit Again)'}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = invitation.test.questions[currentQuestionIndex];
  const currentQuestionStartTimeEpoch =
    currentQuestion && questionStartTime[currentQuestion.id]
      ? questionStartTime[currentQuestion.id].epoch
      : 0;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Modern Header with Progress */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="mb-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500">
                <svg
                  className="h-6 w-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="max-w-xs truncate text-lg font-bold text-gray-900 sm:max-w-md">
                  {invitation.test.title}
                </h1>
                <p className="text-sm text-gray-500">Combat Test Assessment</p>
              </div>
            </div>

            {/* Question Counter */}
            <div className="text-right">
              <div className="text-2xl font-bold text-brand-500">
                {String(currentQuestionIndex + 1).padStart(2, '0')}
              </div>
              <div className="text-sm text-gray-500">
                of {String(invitation.test.questions.length).padStart(2, '0')}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all duration-300 ease-out"
              style={{
                width: `${((currentQuestionIndex + 1) / invitation.test.questions.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress</span>
            <span>
              {Math.round(
                ((currentQuestionIndex + 1) /
                  invitation.test.questions.length) *
                  100
              )}
              % Complete
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Timer Section */}
          {currentQuestionStartTimeEpoch > 0 && (
            <div className="mb-6">
              <QuestionTimer
                questionKey={currentQuestion.id}
                startTimeEpoch={currentQuestionStartTimeEpoch}
                durationSeconds={currentQuestion.timerSeconds}
                onTimeExpired={handleTimeExpired}
              />
            </div>
          )}

          {/* Question Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {/* Question Header */}
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-white">
                  Question {currentQuestionIndex + 1}
                </h2>
                <div className="flex items-center space-x-2 text-white">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-sm">Think carefully</span>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="p-6">
              <div className="mb-8">
                <h3 className="mb-6 text-xl font-medium leading-relaxed text-gray-900 md:text-2xl">
                  {currentQuestion.promptText}
                </h3>

                {currentQuestion.promptImageUrl && (
                  <div className="mb-6 flex justify-center">
                    <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-gray-100 shadow-md">
                      <img
                        src={currentQuestion.promptImageUrl}
                        alt="Question illustration"
                        className="h-auto w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.answerOptions.map((option, index) => {
                  const isSelected =
                    answers[currentQuestion.id]?.answerIndex === index;
                  const optionLabel = String.fromCharCode(65 + index); // A, B, C, D

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswer(currentQuestion.id, index)}
                      className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ease-out ${
                        isSelected
                          ? 'scale-[1.02] transform border-brand-500 bg-brand-50 shadow-md'
                          : 'hover:bg-brand-25 border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm'
                      } focus:ring-3 focus:outline-none focus:ring-brand-200`}
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                            isSelected
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-gray-300 bg-gray-100 text-gray-600'
                          } `}
                        >
                          {optionLabel}
                        </div>
                        <span
                          className={`flex-1 text-lg font-medium ${isSelected ? 'text-brand-700' : 'text-gray-700'} `}
                        >
                          {option}
                        </span>
                        {isSelected && (
                          <div className="h-6 w-6 text-brand-500">
                            <svg
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigateQuestion('prev')}
                  disabled={currentQuestionIndex === 0}
                  className={`flex items-center space-x-2 rounded-lg px-6 py-3 font-medium transition-all duration-200 ${
                    currentQuestionIndex === 0
                      ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm'
                  } `}
                >
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  <span>Previous</span>
                </button>

                {currentQuestionIndex ===
                invitation.test.questions.length - 1 ? (
                  <button
                    onClick={submitTest}
                    disabled={isSubmitting}
                    className={`flex items-center space-x-2 rounded-lg px-8 py-3 font-semibold text-white transition-all duration-200 ${
                      isSubmitting
                        ? 'cursor-not-allowed bg-gray-400'
                        : 'transform bg-brand-500 hover:scale-105 hover:bg-brand-600 hover:shadow-lg'
                    } `}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Test</span>
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
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigateQuestion('next')}
                    className="flex transform items-center space-x-2 rounded-lg bg-brand-500 px-8 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:bg-brand-600 hover:shadow-lg"
                  >
                    <span>Next Question</span>
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
