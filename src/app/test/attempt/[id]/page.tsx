'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Button from '@/components/ui/button/Button';
import SystemCompatibilityChecker from '@/components/SystemCompatibilityChecker';
import { useProctoring } from '@/lib/proctor/recorder';
import { useLiveFlags } from '@/lib/proctor/useLiveFlags';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UserAnswer {
  questionId: string;
  selectedAnswerIndex: number | null;
  timeTakenSeconds?: number;
}

interface CompatibilityResult {
  camera: {
    status: 'checking' | 'pass' | 'fail';
    message: string;
    details?: string;
  };
  microphone: {
    status: 'checking' | 'pass' | 'fail';
    message: string;
    details?: string;
  };
  browser: {
    status: 'checking' | 'pass' | 'fail';
    message: string;
    details?: string;
  };
  bandwidth: {
    status: 'checking' | 'pass' | 'fail';
    message: string;
    details?: string;
  };
}

export default function TestTakingPage() {
  const params = useParams();
  const attemptId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isPublicTest = searchParams.get('type') === 'public';

  // Determine the correct API endpoint based on test type
  const apiEndpoint = isPublicTest
    ? `/api/public-test-attempts/${attemptId}`
    : `/api/test-attempts/${attemptId}`;
  const { data, isLoading, error } = useSWR(
    attemptId ? apiEndpoint : null,
    fetcher
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);
  const {
    isRecording,
    startRecording,
    stopRecording,
    recordingSession,
    videoRef,
  } = useProctoring(attemptId);
  const [systemCheckComplete, setSystemCheckComplete] = useState(false);
  const [systemCheckResults, setSystemCheckResults] =
    useState<CompatibilityResult | null>(null);
  const [testReady, setTestReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<string>('');
  const [proctoringError, setProctoringError] = useState<string | null>(null);

  useLiveFlags(attemptId);

  const handleSystemCheckComplete = (
    passed: boolean,
    results: CompatibilityResult
  ) => {
    setSystemCheckComplete(true);
    setSystemCheckResults(results);
  };

  const handleStartTest = async () => {
    // Import the flag to check if proctoring requirements are disabled
    const { DISABLE_PROCTORING_REQUIREMENTS } = await import('@/lib/constants');

    // Check if camera and microphone permissions are granted
    const cameraGranted = systemCheckResults?.camera.status === 'pass';
    const microphoneGranted = systemCheckResults?.microphone.status === 'pass';
    const permissionsGranted = cameraGranted && microphoneGranted;

    // TEMPORARILY DISABLED: Skip camera/microphone requirement check
    // if (!permissionsGranted && !DISABLE_PROCTORING_REQUIREMENTS) {
    //   alert(
    //     'Camera and microphone access is required to start the test. Please grant permissions and try again.'
    //   );
    //   return;
    // }

    try {
      // Update permission status in database using the correct endpoint
      const permissionsEndpoint = isPublicTest
        ? `/api/public-test-attempts/${attemptId}/permissions`
        : `/api/test-attempts/${attemptId}/permissions`;

      const response = await fetch(permissionsEndpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          permissionsGranted:
            DISABLE_PROCTORING_REQUIREMENTS || permissionsGranted,
          proctoringEnabled: DISABLE_PROCTORING_REQUIREMENTS ? false : true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      setTestReady(true);
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to initialize proctoring. Please try again.');
    }
  };

  // Separate submit test function with proper cleanup flow
  const handleSubmitTest = useCallback(async () => {
    if (!data || isSubmitting) return;

    setIsSubmitting(true);
    setSubmissionStep('Preparing submission...');

    try {
      // PRIORITY FIX: Stop camera immediately, then handle submission
      // Step 1: Stop recording and camera IMMEDIATELY (non-blocking)
      setSubmissionStep('Stopping camera...');
      if (isRecording && recordingSession) {
        // This now stops camera immediately and uploads in background
        await stopRecording();
      }

      // Step 2: Prepare answers (quick operation)
      setSubmissionStep('Finalizing your answers...');
      const finalAnswersPayload = userAnswers.reduce(
        (acc, ans) => {
          if (ans.questionId && ans.selectedAnswerIndex !== null) {
            acc[ans.questionId] = { answerIndex: ans.selectedAnswerIndex };
          }
          return acc;
        },
        {} as Record<string, { answerIndex: number | null }>
      );

      // Step 3: Submit to server
      setSubmissionStep('Submitting your test...');
      const res = await fetch(apiEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: finalAnswersPayload,
          status: 'COMPLETED',
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(errorBody.error || 'Failed to submit test');
      }

      // Step 4: Cleanup and redirect
      setSubmissionStep('Finalizing submission...');
      localStorage.removeItem(`test-progress-${attemptId}`);

      // Brief delay to show completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to completion page (not results page)
      router.push(`/test/results/${attemptId}`);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
      setSubmissionStep('');
      alert('An error occurred while submitting your test. Please try again.');
    }
  }, [
    data,
    isSubmitting,
    isRecording,
    recordingSession,
    stopRecording,
    userAnswers,
    apiEndpoint,
    attemptId,
    router,
  ]);

  // Define handleNextQuestion after handleSubmitTest
  const handleNextQuestion = useCallback(() => {
    if (!data) return;
    const isLastQuestion =
      currentQuestionIndex === data.test.questions.length - 1;
    if (isLastQuestion) {
      handleSubmitTest();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, data, handleSubmitTest]);

  // Hydrate state from localStorage and initial data
  useEffect(() => {
    if (data) {
      const savedProgress = localStorage.getItem(`test-progress-${attemptId}`);

      // Initialize answers from scratch based on test questions
      let initialAnswers = (data.test.questions || []).map((q: any) => ({
        questionId: q.id,
        selectedAnswerIndex: null,
      }));

      // Create a map of already submitted answers for quick lookup
      const submittedAnswersMap = (data.submittedAnswers || []).reduce(
        (acc: any, ans: any) => {
          acc[ans.questionId] = ans.selectedAnswerIndex;
          return acc;
        },
        {}
      );

      // Populate initial answers with submitted ones
      initialAnswers.forEach((answer: any) => {
        if (submittedAnswersMap[answer.questionId] !== undefined) {
          answer.selectedAnswerIndex = submittedAnswersMap[answer.questionId];
        }
      });

      if (savedProgress) {
        const { questionIndex, answers: savedAnswers } =
          JSON.parse(savedProgress);
        setCurrentQuestionIndex(questionIndex);

        // Sync saved local answers with the definitive list of questions
        const syncedAnswers = initialAnswers.map((initAns: any) => {
          const saved = savedAnswers.find(
            (a: any) => a.questionId === initAns.questionId
          );
          return saved || initAns;
        });
        setUserAnswers(syncedAnswers);
      } else {
        setUserAnswers(initialAnswers);
      }

      setHasHydrated(true);
    }
  }, [data, attemptId]);

  // Persist state to localStorage
  useEffect(() => {
    if (hasHydrated && data?.status !== 'COMPLETED') {
      const progress = {
        questionIndex: currentQuestionIndex,
        answers: userAnswers,
      };
      localStorage.setItem(
        `test-progress-${attemptId}`,
        JSON.stringify(progress)
      );
    }
  }, [currentQuestionIndex, userAnswers, attemptId, hasHydrated, data?.status]);

  // Set timer for the current question - only after test is ready
  useEffect(() => {
    if (testReady && data?.test?.questions[currentQuestionIndex]) {
      setTimeLeft(data.test.questions[currentQuestionIndex].timerSeconds);
    }
  }, [currentQuestionIndex, data, testReady]);

  // Countdown timer effect - only when test is ready
  useEffect(() => {
    if (!testReady || timeLeft === null) return;

    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }
    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => (prevTime !== null ? prevTime - 1 : null));
    }, 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, testReady]); // Removed handleNextQuestion to prevent circular dependency

  // Start/Stop proctoring - only after test is ready and if proctoring is enabled
  useEffect(() => {
    const initializeProctoring = async () => {
      const { DISABLE_PROCTORING_REQUIREMENTS } = await import(
        '@/lib/constants'
      );

      if (
        testReady &&
        attemptId &&
        !isRecording &&
        !DISABLE_PROCTORING_REQUIREMENTS
      ) {
        startRecording().catch((error) => {
          console.error('Failed to start proctoring:', error);
          setProctoringError(error.message || 'Failed to start proctoring');
          setTestReady(false); // Prevent test from continuing
        });
      }
    };

    initializeProctoring();
  }, [testReady, attemptId, isRecording, startRecording]);

  // Separate cleanup effect for proctoring
  useEffect(() => {
    return () => {
      if (recordingSession) {
        stopRecording();
      }
    };
  }, [recordingSession, stopRecording]);

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestionId = data.test.questions[currentQuestionIndex].id;
    setUserAnswers((prev) =>
      prev.map((ans) =>
        ans.questionId === currentQuestionId
          ? { ...ans, selectedAnswerIndex: optionIndex }
          : ans
      )
    );
  };

  if (!systemCheckComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
          <SystemCompatibilityChecker
            onComplete={handleSystemCheckComplete}
            onStartTest={handleStartTest}
          />
        </div>
      </div>
    );
  }

  if (systemCheckComplete && !testReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          {proctoringError ? (
            // Show proctoring error
            <div className="mb-6">
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
              <h1 className="mb-2 text-2xl font-bold text-red-800">
                Proctoring Failed
              </h1>
              <p className="mb-4 text-red-600">{proctoringError}</p>
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Refresh Page & Try Again
              </Button>
            </div>
          ) : (
            // Show normal system check complete
            <div className="mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-8 w-8 text-green-600"
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
              <h1 className="mb-2 text-2xl font-bold text-gray-800">
                System Check Complete
              </h1>
              <p className="text-gray-600">
                {systemCheckResults &&
                Object.values(systemCheckResults).every(
                  (result) => result.status === 'pass'
                )
                  ? 'All systems are ready. You can now start your test.'
                  : 'System check completed with some warnings. You can still proceed with the test.'}
              </p>
              <Button onClick={handleStartTest} className="mt-4 w-full">
                Start Test
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show submission screen when submitting
  if (isSubmitting) {
    // Dynamic progress based on current step
    const getProgressWidth = () => {
      switch (submissionStep) {
        case 'Preparing submission...':
          return '20%';
        case 'Stopping camera...':
          return '40%';
        case 'Finalizing your answers...':
          return '60%';
        case 'Submitting your test...':
          return '80%';
        case 'Finalizing submission...':
          return '95%';
        default:
          return '20%';
      }
    };

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
          <div className="mb-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              {submissionStep === 'Stopping camera...' ? (
                // Camera icon when stopping camera
                <svg
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3l18 18"
                  />
                </svg>
              ) : (
                // Spinning icon for other steps
                <svg
                  className="h-8 w-8 animate-spin text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </div>
            <h1 className="mb-2 text-2xl font-bold text-gray-800">
              Completing Your Test
            </h1>
            <p className="mb-4 text-gray-600">
              {submissionStep === 'Stopping camera...'
                ? 'Camera access released - uploading data securely...'
                : submissionStep === 'Finalizing submission...'
                  ? 'Almost done - preparing your completion confirmation...'
                  : 'Please wait while we process your submission...'}
            </p>
            <div className="text-sm font-medium text-blue-600">
              {submissionStep}
            </div>
          </div>

          {/* Dynamic progress bar */}
          <div className="mb-4 h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: getProgressWidth() }}
            ></div>
          </div>

          <p className="text-xs text-gray-500">
            {submissionStep === 'Stopping camera...'
              ? 'Camera access released - data uploading in background'
              : submissionStep === 'Finalizing submission...'
                ? 'Preparing your completion confirmation...'
                : 'Do not close this window or navigate away'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !hasHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading test...
      </div>
    );
  }

  if (error || !data || !data.test) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Error: Failed to load test data.
      </div>
    );
  }

  if (data.status === 'COMPLETED') {
    router.replace(`/test/results/${attemptId}`);
    return (
      <div className="flex h-screen items-center justify-center">
        Test already completed. Redirecting to completion page...
      </div>
    );
  }

  const currentQuestion = data.test.questions[currentQuestionIndex];

  if (!currentQuestion) {
    // This can happen briefly if the test is completed and is about to redirect.
    return (
      <div className="flex h-screen items-center justify-center">
        Test completed. Redirecting to completion page...
      </div>
    );
  }

  const currentAnswer = userAnswers.find(
    (a) => a.questionId === currentQuestion.id
  );

  return (
    <div className="relative flex h-screen flex-col bg-gray-100 font-sans">
      {isRecording && (
        <div className="absolute bottom-24 right-4 z-50 flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white shadow-lg">
          <div className="h-2 w-2 animate-pulse rounded-full bg-white"></div>
          REC
        </div>
      )}

      <header className="flex items-center justify-between border-b bg-military-green px-6 py-2 text-white shadow-sm">
        <h1 className="text-lg font-bold">{data.test.title}</h1>
        <div className="relative h-2.5 w-64 rounded-full bg-white/30">
          <div
            className="absolute h-full rounded-full bg-green-400 transition-all"
            style={{
              width: `${((currentQuestionIndex + 1) / data.test.questions.length) * 100}%`,
            }}
          ></div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="grid h-full min-h-0 flex-1 grid-cols-1 md:grid-cols-3">
          <div className="flex min-h-0 flex-col border-r border-gray-200 bg-white md:col-span-2">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="prose prose-lg max-w-none text-gray-900">
                <MarkdownRenderer content={currentQuestion?.promptText || ''} />
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col bg-slate-50">
            <div className="border-b border-gray-200 bg-white p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Choose Your Answer
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="space-y-3">
                {currentQuestion.answerOptions.map(
                  (option: string, index: number) => {
                    const isSelected =
                      currentAnswer?.selectedAnswerIndex === index;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`flex w-full items-center rounded-lg border-2 p-3 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                            : 'border-gray-300 bg-white hover:border-blue-400'
                        }`}
                      >
                        <span
                          className={`mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full font-bold ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-sm text-gray-800">{option}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-center border-t bg-white px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="flex w-24 items-center justify-center font-mono text-lg font-bold text-gray-700">
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
            <span>
              {timeLeft !== null
                ? `${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                : '0:00'}
            </span>
          </div>

          <Button
            onClick={handleNextQuestion}
            disabled={currentAnswer?.selectedAnswerIndex === null}
          >
            {currentQuestionIndex === data.test.questions.length - 1
              ? 'Finish & Submit'
              : 'Next'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
