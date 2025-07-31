'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import useSWR from 'swr';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import Button from '@/components/ui/button/Button';
import SystemCompatibilityChecker from '@/components/SystemCompatibilityChecker';
import StrikeIndicator from '@/components/StrikeIndicator';
import StrikeWarningModal from '@/components/StrikeWarningModal';
import TestTerminationPage from '@/components/TestTerminationPage';
import FocusWarningModal from '@/components/FocusWarningModal';
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
  const [showStrikeWarning, setShowStrikeWarning] = useState(false);
  const [strikeCount, setStrikeCount] = useState(0);
  const [maxAllowed, setMaxAllowed] = useState(3);
  const [strikeLevel, setStrikeLevel] = useState<'first' | 'second'>('first');
  const [isTerminated, setIsTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState<string>('');
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const [blurCount, setBlurCount] = useState(0);
  const [isReturningFocus, setIsReturningFocus] = useState(false);

  // Time tracking for individual questions
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Control when full monitoring (focus detection, etc.) becomes active
  // Only start after question 1 to avoid issues during permission granting
  // This allows users to grant camera/microphone permissions without triggering focus warnings
  const isMonitoringActive = testReady && currentQuestionIndex >= 1;

  const handleTestTermination = (reason: string) => {
    setIsTerminated(true);
    setTerminationReason(reason);
  };

  const handleStrikeUpdateFromLiveFlags = (
    strikeCount: number,
    maxAllowed: number,
    strikeLevel: 'first' | 'second' | 'terminated'
  ) => {
    setStrikeCount(strikeCount);
    setMaxAllowed(maxAllowed);

    if (strikeLevel === 'terminated') {
      setIsTerminated(true);
      setTerminationReason(
        `Test terminated due to ${strikeCount} copy violations`
      );
    } else {
      // Always update strike level and show warning - don't block on existing modal
      setStrikeLevel(strikeLevel);
      setShowStrikeWarning(true);
    }
  };

  const handleStrikeUpdate = (
    newStrikeCount: number,
    newMaxAllowed: number
  ) => {
    setStrikeCount(newStrikeCount);
    setMaxAllowed(newMaxAllowed);

    // Show warning modal for first and second strikes
    if (newStrikeCount === 1 && !showStrikeWarning) {
      setStrikeLevel('first');
      setShowStrikeWarning(true);
    } else if (newStrikeCount === 2 && !showStrikeWarning) {
      setStrikeLevel('second');
      setShowStrikeWarning(true);
    }
  };

  const handleFocusEvent = (isBlur: boolean, currentBlurCount: number) => {
    setBlurCount(currentBlurCount);

    if (isBlur) {
      // Window lost focus - show warning immediately
      setIsReturningFocus(false);
      setShowFocusWarning(true);
    } else {
      // Window regained focus - show "welcome back" message
      setIsReturningFocus(true);
      setShowFocusWarning(true);
    }
  };

  const handleCloseFocusWarning = () => {
    setShowFocusWarning(false);
  };

  useLiveFlags(
    attemptId,
    isMonitoringActive, // Only start monitoring after question 1
    handleStrikeUpdateFromLiveFlags,
    handleTestTermination,
    handleFocusEvent
  );

  const handleCloseStrikeWarning = () => {
    setShowStrikeWarning(false);
  };

  const handleSystemCheckComplete = (
    passed: boolean,
    results: CompatibilityResult
  ) => {
    setSystemCheckComplete(true);
    setSystemCheckResults(results);
  };

  const handleStartTest = async () => {
    // Check if camera and microphone permissions are granted
    const cameraGranted = systemCheckResults?.camera.status === 'pass';
    const microphoneGranted = systemCheckResults?.microphone.status === 'pass';
    const permissionsGranted = cameraGranted && microphoneGranted;

    // Proctoring is MANDATORY - camera/microphone permissions required
    if (!permissionsGranted) {
      alert(
        'Camera and microphone access is required to start the test. Please grant permissions and try again.'
      );
      return;
    }

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
          permissionsGranted: permissionsGranted,
          proctoringEnabled: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update permissions');
      }

      setTestReady(true);
    } catch (error) {
      // Error updating permissions
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

      // Redirect based on test type
      if (isPublicTest) {
        // For public tests, redirect to success page
        const token = searchParams.get('token');
        if (token) {
          window.location.href = `/public-test/${token}/success`;
        } else {
          // Fallback if no token available
          window.location.href = '/public-test/success';
        }
      } else {
        // For regular tests, redirect to results page
        router.push(`/test/results/${attemptId}`);
      }
    } catch (e) {
      // Error occurred while submitting test
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

  // Save individual answer as user progresses
  const saveCurrentAnswer = useCallback(async () => {
    if (!data || savingAnswer) return;

    const currentQuestion = data.test.questions[currentQuestionIndex];
    const currentAnswer = userAnswers.find(
      (ans) => ans.questionId === currentQuestion.id
    );

    // Only save if user has selected an answer
    if (!currentAnswer || currentAnswer.selectedAnswerIndex === null) {
      return;
    }

    setSavingAnswer(true);

    try {
      // Calculate time taken for this question
      const timeTaken = questionStartTime
        ? Math.max(0, Math.floor((Date.now() - questionStartTime) / 1000))
        : 0;

      // Determine the correct API endpoint
      const answerEndpoint = isPublicTest
        ? `/api/public-test-attempts/${attemptId}/answer`
        : `/api/test-attempts/${attemptId}/answer`;

      const response = await fetch(answerEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedAnswerIndex: currentAnswer.selectedAnswerIndex,
          timeTakenSeconds: timeTaken,
        }),
      });

      if (!response.ok) {
        console.error('Failed to save answer:', await response.text());
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    } finally {
      setSavingAnswer(false);
    }
  }, [
    data,
    currentQuestionIndex,
    userAnswers,
    questionStartTime,
    isPublicTest,
    attemptId,
    savingAnswer,
  ]);

  // Save progress to server
  const saveProgress = useCallback(
    async (questionIndex: number) => {
      try {
        const progressEndpoint = isPublicTest
          ? `/api/public-test-attempts/${attemptId}/progress`
          : `/api/test-attempts/${attemptId}/progress`;

        await fetch(progressEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentQuestionIndex: questionIndex,
          }),
        });
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    },
    [isPublicTest, attemptId]
  );

  // Define handleNextQuestion after handleSubmitTest
  const handleNextQuestion = useCallback(async () => {
    if (!data || isNavigating) return; // Prevent multiple clicks

    setIsNavigating(true);

    try {
      const isLastQuestion =
        currentQuestionIndex === data.test.questions.length - 1;

      if (isLastQuestion) {
        // Save current answer before submitting
        await saveCurrentAnswer();
        handleSubmitTest();
      } else {
        const nextIndex = currentQuestionIndex + 1;

        // Update UI immediately for better user experience
        setCurrentQuestionIndex(nextIndex);
        setQuestionStartTime(Date.now());

        // Save current answer and progress in background (non-blocking)
        Promise.all([saveCurrentAnswer(), saveProgress(nextIndex)]).catch(
          (error) => {
            console.error('Error saving progress:', error);
            // Don't block navigation on save errors
          }
        );
      }
    } finally {
      setIsNavigating(false);
    }
  }, [
    currentQuestionIndex,
    data,
    isNavigating,
    handleSubmitTest,
    saveCurrentAnswer,
    saveProgress,
  ]);

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
      // Start timing for this question
      setQuestionStartTime(Date.now());
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

  // Start/Stop proctoring - only after test is ready (proctoring is mandatory)
  useEffect(() => {
    if (testReady && attemptId && !isRecording) {
      startRecording().catch((error) => {
        // Failed to start proctoring
        setProctoringError(error.message || 'Failed to start proctoring');
        setTestReady(false); // Prevent test from continuing
      });
    }
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

    // Auto-save the answer in background (non-blocking)
    setTimeout(() => {
      saveCurrentAnswer().catch((error) => {
        console.error('Error auto-saving answer:', error);
        // Don't block user interaction on save errors
      });
    }, 100); // Small delay to ensure state is updated
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

  if (data.status === 'TERMINATED' || isTerminated) {
    return (
      <TestTerminationPage
        reason={
          terminationReason ||
          data.terminationReason ||
          'Test terminated due to policy violations'
        }
        strikeCount={strikeCount}
        maxAllowed={maxAllowed}
      />
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

      <StrikeIndicator
        strikeCount={strikeCount}
        maxAllowed={maxAllowed}
        strikeLevel={
          strikeCount === 0
            ? 'none'
            : strikeCount === 1
              ? 'first'
              : strikeCount === 2
                ? 'second'
                : 'terminated'
        }
      />

      <StrikeWarningModal
        isOpen={showStrikeWarning}
        onClose={handleCloseStrikeWarning}
        strikeCount={strikeCount}
        maxAllowed={maxAllowed}
        strikeLevel={strikeLevel}
      />

      <FocusWarningModal
        isOpen={showFocusWarning}
        onClose={handleCloseFocusWarning}
        blurCount={blurCount}
        isReturning={isReturningFocus}
      />

      <header className="flex items-center justify-between border-b bg-military-green px-6 py-2 text-white shadow-sm">
        <h1 className="text-lg font-bold">{data.test.title}</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white/90">
            {currentQuestionIndex + 1}/{data.test.questions.length}
          </span>
          <div className="relative h-2.5 w-64 rounded-full bg-white/30">
            <div
              className="absolute h-full rounded-full bg-green-400 transition-all"
              style={{
                width: `${((currentQuestionIndex + 1) / data.test.questions.length) * 100}%`,
              }}
            ></div>
          </div>
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
            disabled={
              currentAnswer?.selectedAnswerIndex === null || isNavigating
            }
          >
            {isNavigating ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {currentQuestionIndex === data.test.questions.length - 1
                  ? 'Submitting...'
                  : 'Next...'}
              </div>
            ) : currentQuestionIndex === data.test.questions.length - 1 ? (
              'Finish & Submit'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
