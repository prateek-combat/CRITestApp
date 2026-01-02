'use client';

import { useState, useEffect, useCallback } from 'react';
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
  const [navigationDirection, setNavigationDirection] = useState<
    'next' | 'prev' | null
  >(null);

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

  const totalQuestions = data?.test?.questions?.length ?? 0;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion =
    totalQuestions > 0 && currentQuestionIndex === totalQuestions - 1;

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
  const saveCurrentAnswer = useCallback(
    async (forQuestionIndex?: number) => {
      if (!data || savingAnswer) return;

      // Use provided index or fall back to current index
      const questionIndex = forQuestionIndex ?? currentQuestionIndex;
      const currentQuestion = data.test.questions[questionIndex];
      const currentAnswer = userAnswers.find(
        (ans) => ans.questionId === currentQuestion.id
      );

      // DIAGNOSTIC: Save operation started
      // providedIndex: forQuestionIndex
      // currentStateIndex: currentQuestionIndex
      // usedIndex: questionIndex

      // Only save if user has selected an answer
      if (!currentAnswer || currentAnswer.selectedAnswerIndex === null) {
        // No answer to save for this question
        return;
      }

      setSavingAnswer(true);

      try {
        // Calculate time taken for this question
        let timeTaken = 0;
        if (questionStartTime) {
          timeTaken = Math.max(
            0,
            Math.floor((Date.now() - questionStartTime) / 1000)
          );
        } else {
          // Fallback: If questionStartTime is null, set it now and use minimum time
          console.warn('questionStartTime was null, using fallback timing');
          setQuestionStartTime(Date.now());
          timeTaken = 1; // Minimum 1 second to indicate answer was timed
        }

        // Determine the correct API endpoint
        const answerEndpoint = isPublicTest
          ? `/api/public-test-attempts/${attemptId}/answer`
          : `/api/test-attempts/${attemptId}/answer`;

        // Saving answer for question with calculated time

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
          const errorText = await response.text();
          console.error('Failed to save answer:', errorText);
        } else {
          const result = await response.json();
          // Successfully saved answer
        }
      } catch (error) {
        console.error('Error saving answer:', error);
      } finally {
        setSavingAnswer(false);
      }
    },
    [
      data,
      currentQuestionIndex,
      userAnswers,
      questionStartTime,
      isPublicTest,
      attemptId,
      savingAnswer,
    ]
  );

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

    setNavigationDirection('next');
    setIsNavigating(true);

    try {
      if (isLastQuestion) {
        // Save current answer before submitting (use current index)
        await saveCurrentAnswer(currentQuestionIndex);
        handleSubmitTest();
      } else {
        const nextIndex = currentQuestionIndex + 1;

        // Navigation: Moving to next question

        // Update UI immediately for better user experience
        setCurrentQuestionIndex(nextIndex);
        setQuestionStartTime(Date.now());

        // Save current answer and progress in background (non-blocking)
        // CRITICAL: Pass currentQuestionIndex explicitly to avoid race condition
        Promise.all([
          saveCurrentAnswer(currentQuestionIndex), // Save answer for the question we're leaving
          saveProgress(nextIndex), // Save progress for the question we're going to
        ]).catch((error) => {
          console.error('Error saving progress:', error);
          // Don't block navigation on save errors
        });
      }
    } finally {
      setIsNavigating(false);
      setNavigationDirection(null);
    }
  }, [
    currentQuestionIndex,
    data,
    isNavigating,
    handleSubmitTest,
    saveCurrentAnswer,
    saveProgress,
  ]);

  const handlePreviousQuestion = useCallback(async () => {
    if (!data || isFirstQuestion || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      setNavigationDirection('prev');
      await saveCurrentAnswer(currentQuestionIndex);
      const previousIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(previousIndex);
      setQuestionStartTime(Date.now());
      await saveProgress(previousIndex);
    } finally {
      setIsNavigating(false);
      setNavigationDirection(null);
    }
  }, [
    data,
    currentQuestionIndex,
    isFirstQuestion,
    isNavigating,
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
    // Answer selected for current question

    const currentQuestionId = data.test.questions[currentQuestionIndex].id;
    setUserAnswers((prev) =>
      prev.map((ans) =>
        ans.questionId === currentQuestionId
          ? { ...ans, selectedAnswerIndex: optionIndex }
          : ans
      )
    );

    // Auto-save the answer in background (non-blocking)
    // CRITICAL FIX: Pass explicit currentQuestionIndex to avoid race condition
    setTimeout(() => {
      // Triggering auto-save with explicit index to avoid race condition
      saveCurrentAnswer(currentQuestionIndex).catch((error) => {
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

  const answeredCount = userAnswers.filter(
    (ans) => ans.selectedAnswerIndex !== null
  ).length;
  const remainingCount = Math.max(totalQuestions - answeredCount, 0);
  const answeredPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const questionProgressPercent =
    totalQuestions > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)
      : 0;
  const formattedTimeLeft =
    timeLeft !== null
      ? `${Math.floor(timeLeft / 60)
          .toString()
          .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
      : '00:00';
  const timerPercent =
    currentQuestion?.timerSeconds && timeLeft !== null
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round((timeLeft / currentQuestion.timerSeconds) * 100)
          )
        )
      : currentQuestion?.timerSeconds
        ? 100
        : 0;
  const lowTimeWarning =
    Boolean(currentQuestion?.timerSeconds) &&
    timeLeft !== null &&
    timeLeft <= Math.ceil((currentQuestion?.timerSeconds ?? 0) * 0.2);
  const strikesRemaining = Math.max(maxAllowed - strikeCount, 0);
  const statusPillClasses = isRecording
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-amber-100 text-amber-700';
  const statusDotClasses = isRecording ? 'bg-emerald-500' : 'bg-amber-500';
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const focusGuidelines = [
    'Keep your webcam and microphone on for the entire assessment.',
    'Stay inside this browser tab—switching windows triggers strikes.',
    'Avoid background noise and keep notes or devices out of view.',
  ];

  return (
    <div className="relative flex min-h-screen flex-col bg-gray-100 font-sans">
      {isRecording && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow-lg sm:flex">
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

      <header className="border-b bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Candidate
            </p>
            <p className="text-base font-semibold text-gray-900">
              {data.candidateName || 'Candidate'}
            </p>
            {data.candidateEmail && (
              <p className="text-sm text-gray-500">{data.candidateEmail}</p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-3 lg:items-end">
            <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-gray-400">
                  Question progress
                </span>
                <span className="text-lg font-semibold text-gray-900">
                  {currentQuestionIndex + 1}/{totalQuestions}
                </span>
              </div>
              <div className="hidden h-2 w-56 rounded-full bg-gray-200 sm:block">
                <div
                  className="h-2 rounded-full bg-blue-500 transition-all"
                  style={{ width: `${questionProgressPercent}%` }}
                ></div>
              </div>
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusPillClasses}`}
              >
                <span
                  className={`${statusDotClasses} h-2 w-2 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                ></span>
                {isRecording ? 'Proctoring active' : 'Initializing proctoring'}
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                <span className="text-sm font-semibold text-gray-900">
                  {answeredCount}
                </span>
                answered
              </div>
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1">
                <span className="text-sm font-semibold text-gray-900">
                  {strikesRemaining}
                </span>
                strikes left
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <aside className="hidden w-80 flex-shrink-0 flex-col border-r border-gray-200 bg-white p-5 lg:flex lg:overflow-y-auto">
          <section className="rounded-2xl border border-gray-100 bg-slate-50 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Session status
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Q{currentQuestionIndex + 1}
              </span>
            </div>
            <div className="mt-4 text-4xl font-semibold text-gray-900">
              {formattedTimeLeft}
            </div>
            <p
              className={`text-sm ${lowTimeWarning ? 'text-red-600' : 'text-gray-500'}`}
            >
              {lowTimeWarning
                ? 'Wrap up this question soon'
                : 'Time remaining for this question'}
            </p>
            <div className="mt-3 h-2 rounded-full bg-white/80">
              <span
                className={`block h-2 rounded-full ${lowTimeWarning ? 'bg-red-500' : 'bg-emerald-500'}`}
                style={{ width: `${timerPercent}%` }}
              ></span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Answered</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {answeredCount}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Remaining</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {remainingCount}
                </dd>
              </div>
            </dl>
            <div className="mt-4 rounded-lg bg-white px-3 py-2 text-xs font-medium text-slate-600">
              {strikesRemaining > 0
                ? `${strikesRemaining} strike${strikesRemaining === 1 ? '' : 's'} left before termination`
                : 'Any further violation will end this attempt'}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">
                Answer progress
              </p>
              <span className="text-xs font-semibold text-gray-500">
                {answeredPercent}% complete
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-gray-100">
              <span
                className="block h-2 rounded-full bg-blue-500"
                style={{ width: `${answeredPercent}%` }}
              ></span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Question map
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {data.test.questions.map((question: any, index: number) => {
                  const answered = userAnswers.some(
                    (ans) =>
                      ans.questionId === question.id &&
                      ans.selectedAnswerIndex !== null
                  );
                  const isCurrent = index === currentQuestionIndex;
                  return (
                    <div
                      key={question.id}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold ${
                        isCurrent
                          ? 'border-2 border-blue-500 bg-blue-50 text-blue-600'
                          : answered
                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border border-gray-200 bg-white text-gray-500'
                      }`}
                      aria-label={`Question ${index + 1} ${answered ? 'answered' : 'not answered'}`}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                Questions must be completed sequentially. Use this map as a
                status reference.
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-gray-100 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              Quick guidelines
            </p>
            <ul className="mt-3 space-y-3 text-sm text-gray-700">
              {focusGuidelines.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className="flex flex-1 flex-col lg:flex-row">
          <section className="flex min-h-0 flex-1 flex-col border-b border-gray-200 bg-white lg:border-b-0 lg:border-r">
            <div className="border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 lg:hidden">
              <div className="flex items-center justify-between text-gray-900">
                <span>
                  Q{currentQuestionIndex + 1}/{totalQuestions}
                </span>
                <span
                  className={lowTimeWarning ? 'text-red-600' : 'text-gray-500'}
                >
                  {formattedTimeLeft}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200">
                <span
                  className={`block h-2 rounded-full ${lowTimeWarning ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${timerPercent}%` }}
                ></span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gray-100 bg-slate-50 p-4 text-sm text-gray-600 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Current question
                  </p>
                  <p className="text-base font-semibold text-gray-900">
                    Stay focused and answer before the timer expires.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-gray-700">
                    {currentQuestion.timerSeconds} sec limit
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 font-semibold text-gray-700">
                    {answeredPercent}% overall
                  </span>
                </div>
              </div>
              <div className="prose prose-lg max-w-none text-gray-900">
                <MarkdownRenderer content={currentQuestion?.promptText || ''} />
              </div>
            </div>
          </section>

          <aside className="flex min-h-0 w-full flex-col border-t border-gray-200 bg-slate-50 lg:w-[380px] lg:border-t-0">
            <div className="border-b border-gray-200 bg-white px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose your answer
              </h3>
              <p className="text-sm text-gray-500">
                Select an option to auto-save your response. You can move
                forward once an answer is locked in.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="space-y-3">
                {currentQuestion.answerOptions.map(
                  (option: string, index: number) => {
                    const isSelected =
                      currentAnswer?.selectedAnswerIndex === index;
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`flex w-full items-center rounded-2xl border-2 p-3 text-left transition-all duration-150 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <span
                          className={`mr-4 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-500'
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
            <div className="border-t border-gray-200 bg-white px-4 py-4 text-xs text-gray-500">
              Answers auto-save when selected. You can revisit any question
              before you finish the test.
            </div>
          </aside>
        </div>
      </main>

      <footer className="sticky bottom-0 z-30 flex flex-col gap-3 border-t border-gray-200 bg-white/95 px-4 py-4 text-sm text-gray-600 shadow-inner backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono text-xl font-semibold">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-6 w-6 ${lowTimeWarning ? 'text-red-500' : 'text-gray-500'}`}
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
            <span className={lowTimeWarning ? 'text-red-600' : 'text-gray-900'}>
              {formattedTimeLeft}
            </span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Answered
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {answeredCount}/{totalQuestions}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={handlePreviousQuestion}
            disabled={isFirstQuestion || isNavigating}
          >
            {isNavigating && navigationDirection === 'prev'
              ? 'Going back...'
              : 'Previous question'}
          </Button>
          <Button
            onClick={handleNextQuestion}
            disabled={
              currentAnswer?.selectedAnswerIndex === null || isNavigating
            }
          >
            {isNavigating && navigationDirection === 'next' ? (
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
                {isLastQuestion ? 'Submitting...' : 'Saving...'}
              </div>
            ) : isLastQuestion ? (
              'Finish & submit'
            ) : (
              'Next question'
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
