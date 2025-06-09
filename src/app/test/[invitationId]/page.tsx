'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import QuestionTimer from '@/components/QuestionTimer';
import SystemCompatibilityChecker from '@/components/SystemCompatibilityChecker';
import QuestionBookmark from '@/components/QuestionBookmark';
import TestProgressBar from '@/components/TestProgressBar';

import BookmarkedQuestionsReview from '@/components/BookmarkedQuestionsReview';
import Link from 'next/link';
import { Eye, BarChart3 } from 'lucide-react';
import {
  startRecording,
  stopAndUpload,
  destroyRecording,
} from '@/lib/proctor/recorder';
import {
  useLiveFlags,
  stopProctoringGlobally,
} from '@/lib/proctor/useLiveFlags';

interface Question {
  id: string;
  promptText: string;
  promptImageUrl: string | null;
  timerSeconds: number;
  answerOptions: string[];
  category: string;
  questionType?: 'OBJECTIVE' | 'PERSONALITY';
  personalityDimensionId?: string | null;
  answerWeights?: Record<string, number> | null;
  personalityDimension?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
  };
}

interface Test {
  id: string;
  title: string;
  description: string | null;
  questions: Question[];
  allowReview?: boolean;
}

interface Invitation {
  id: string;
  status: string;
  test: Test;
  candidateName?: string;
  candidateEmail?: string;
}

export default function TestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const invitationId = params.invitationId as string;
  const isPublicAttempt = searchParams.get('type') === 'public';

  // Core state
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);

  // Candidate details
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  // Proctoring state
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploadingRecording, setIsUploadingRecording] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [cameraActuallyStopped, setCameraActuallyStopped] = useState(false);

  // New feature states
  const [systemCompatibilityPassed, setSystemCompatibilityPassed] =
    useState(false);
  const [showCompatibilityChecker, setShowCompatibilityChecker] =
    useState(true);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(
    new Set()
  );
  const [showBookmarkedReview, setShowBookmarkedReview] = useState(false);
  const [showProgressBar, setShowProgressBar] = useState(false);

  // Personality question states
  const [confidenceScores, setConfidenceScores] = useState<
    Record<string, number>
  >({});
  const [showTransitionScreen, setShowTransitionScreen] = useState(false);
  const [hasSeenPersonalityIntro, setHasSeenPersonalityIntro] = useState(false);

  // Media refs - updated for new proctoring system
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingSessionRef = useRef<any | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize live proctoring flags when test starts
  useLiveFlags(testAttempt?.id || '');

  // Helper functions for new features
  const handleSystemCompatibilityComplete = useCallback(
    (passed: boolean, results: any) => {
      setSystemCompatibilityPassed(passed);
      if (passed) {
        // Don't hide the checker immediately - user needs to click "Continue to Test"
        setHasPermissions(true); // Since compatibility check includes permission grants
      }
    },
    []
  );

  const handleContinueFromCompatibility = useCallback(() => {
    setShowCompatibilityChecker(false);
  }, []);

  const handleBookmarkToggle = useCallback((questionId: string) => {
    setBookmarkedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  const getAnsweredQuestions = useCallback(() => {
    return new Set(Object.keys(answers));
  }, [answers]);

  const navigateToQuestion = useCallback(
    (index: number) => {
      if (
        index >= 0 &&
        invitation &&
        index < invitation.test.questions.length
      ) {
        setCurrentQuestionIndex(index);
        const question = invitation.test.questions[index];
        setQuestionStartTime((prev) => ({
          ...prev,
          [question.id]: { epoch: Date.now(), key: question.id },
        }));
      }
    },
    [invitation]
  );

  // Fetch test details (invitation or public attempt)
  const fetchTestDetails = useCallback(async () => {
    if (!invitationId) return;
    setIsLoading(true);
    try {
      if (isPublicAttempt) {
        // Fetch public test attempt details
        const res = await fetch(`/api/public-test-attempts/${invitationId}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(
            errorData.message || `Failed to fetch test attempt (${res.status})`
          );
        }
        const data = await res.json();
        // Transform public attempt data to match invitation interface
        setInvitation({
          id: data.id,
          status: data.status,
          test: data.test,
          candidateName: data.candidateName,
          candidateEmail: data.candidateEmail,
        });
        setCandidateName(data.candidateName || '');
        setCandidateEmail(data.candidateEmail || '');
        setDetailsSubmitted(true); // Public attempts already have details

        // Set test attempt to the public attempt itself
        setTestAttempt(data);
        if (data.status === 'COMPLETED') {
          setTestCompleted(true);
        }
        // For public tests, don't auto-start - let them go through system checks and permissions first
        // setTestStarted will be called when user clicks "Start Proctored Test"
      } else {
        // Original invitation logic
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
                  setTestCompleted(true);
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
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [invitationId, isPublicAttempt]);

  useEffect(() => {
    fetchTestDetails();
  }, [fetchTestDetails]);

  // Request camera and microphone permissions
  const requestPermissions = useCallback(async () => {
    setPermissionsRequested(true);
    setError(null);

    try {
      console.log('🔐 Requesting camera and microphone permissions...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      console.log(
        '📹 Stream obtained:',
        stream.getVideoTracks().length,
        'video tracks,',
        stream.getAudioTracks().length,
        'audio tracks'
      );

      // Log video track details
      stream.getVideoTracks().forEach((track, index) => {
        console.log(
          `📹 Video track ${index}:`,
          track.label,
          'enabled:',
          track.enabled,
          'readyState:',
          track.readyState
        );
      });

      // Set up video preview (but don't fail if video element isn't ready yet)
      const setupVideoPreview = () => {
        if (videoRef.current) {
          console.log('📹 Setting video srcObject');
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.playsInline = true;
          videoRef.current.autoplay = true;

          // Add event listeners for debugging
          videoRef.current.onloadstart = () =>
            console.log('📹 Video loadstart');
          videoRef.current.onloadedmetadata = () =>
            console.log('📹 Video metadata loaded');
          videoRef.current.oncanplay = () => console.log('📹 Video can play');
          videoRef.current.onplay = () =>
            console.log('📹 Video started playing');
          videoRef.current.onerror = (e) => console.error('📹 Video error:', e);

          // Force play and handle any issues
          videoRef.current
            .play()
            .then(() => {
              console.log('✅ Video play() called successfully');
            })
            .catch((playError) => {
              console.warn('Video play failed, trying again:', playError);
              setTimeout(() => {
                if (videoRef.current) {
                  videoRef.current
                    .play()
                    .then(() => {
                      console.log('✅ Video play retry successful');
                    })
                    .catch((retryError) => {
                      console.error('❌ Video play retry failed:', retryError);
                    });
                }
              }, 500);
            });
        } else {
          console.warn('📹 Video element not ready yet, will retry...');
          // Retry after a short delay
          setTimeout(setupVideoPreview, 100);
        }
      };

      setupVideoPreview();

      setHasPermissions(true);
      console.log('✅ Camera and microphone permissions granted!');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Permission denied';
      setError(
        `Camera and microphone access is required for this proctored test: ${errorMessage}`
      );
      console.error('❌ Permission denied:', errorMessage);
      setHasPermissions(false);
    }
  }, []);

  // Start recording using new proctoring system
  const startRecordingSession = useCallback(async () => {
    try {
      // Clear any existing timer first
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const recordingSession = await startRecording();
      streamRef.current = recordingSession.stream;
      recordingSessionRef.current = recordingSession;
      setIsRecording(true);
      setRecordingDuration(0);

      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = recordingSession.stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        videoRef.current.play().catch(console.warn);
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          console.log('🕐 Recording duration:', prev + 1);
          return prev + 1;
        });
      }, 1000);

      console.log('✅ Proctoring session started successfully, timer started');
    } catch (err) {
      console.error('🎥 Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  }, []);

  // Stop recording using new frame-based system
  const stopRecordingSession = useCallback(
    async (shouldUpload = false) => {
      console.log('🎥 stopRecording called with shouldUpload:', shouldUpload);

      if (recordingSessionRef.current && testAttempt?.id) {
        try {
          // Stop timer immediately
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }

          if (shouldUpload) {
            console.log('🎥 Uploading captured frames...');
            await stopAndUpload(recordingSessionRef.current, testAttempt.id);
          }

          // Clean up resources - destroy session immediately
          console.log('🎥 Cleaning up recording resources...');
          destroyRecording(recordingSessionRef.current);
          streamRef.current = null;

          // Clear video element
          if (videoRef.current) {
            console.log('🎥 Clearing video element in stopRecordingSession...');
            videoRef.current.srcObject = null;
          }

          recordingSessionRef.current = null;
          setIsRecording(false);

          console.log('🎥 Recording stopped successfully');
        } catch (error) {
          console.error('🎥 Error stopping recording:', error);
        }
      } else {
        console.warn(
          '🎥 Cannot stop recording - recording session or testAttempt missing'
        );
        // Still clean up timer if it exists
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        setIsRecording(false);
      }
    },
    [testAttempt?.id]
  );

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (recordingSessionRef.current && isRecording) {
        try {
          // Force stop without upload on unmount
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (recordingSessionRef.current) {
            destroyRecording(recordingSessionRef.current);
          }
        } catch (error) {
          console.error('Error in cleanup:', error);
        }
      }
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []); // No dependencies to avoid re-creating cleanup function

  // Submit candidate details
  const handleDetailsSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!candidateName.trim() || !candidateEmail.trim()) {
        setError('Please fill in all required fields.');
        return;
      }
      setError(null);
      setIsUpdatingDetails(true);
      try {
        const res = await fetch(`/api/invitations/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: candidateName.trim(),
            candidateEmail: candidateEmail.trim(),
          }),
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
    },
    [invitationId, candidateName, candidateEmail]
  );

  // Start test
  const startTest = useCallback(async () => {
    if (!invitation || error || !hasPermissions) return;

    try {
      // Start recording first
      await startRecordingSession();

      let response;
      if (isPublicAttempt) {
        // For public tests, update the existing attempt to IN_PROGRESS
        response = await fetch(`/api/public-test-attempts/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'IN_PROGRESS',
            proctoringEnabled: true,
          }),
        });
      } else {
        // For regular invitations, create a new test attempt
        response = await fetch('/api/test-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId,
            status: 'IN_PROGRESS',
            answers: {},
            questionStartTime: {},
            proctoringEnabled: true,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to start the test. Please try again.'
        );
      }

      const attemptData = await response.json();
      setTestAttempt(attemptData);
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
  }, [
    invitation,
    error,
    hasPermissions,
    startRecordingSession,
    isPublicAttempt,
    invitationId,
  ]);

  // Handle answer selection
  const handleAnswer = useCallback(
    (questionId: string, answerIndex: number) => {
      const questionInitialStartTime =
        questionStartTime[questionId]?.epoch || Date.now();
      const timeTaken = Math.floor(
        (Date.now() - questionInitialStartTime) / 1000
      );

      setAnswers((prev) => ({
        ...prev,
        [questionId]: { answerIndex, timeTaken },
      }));
    },
    [questionStartTime]
  );

  // Navigate between questions
  const navigateQuestion = useCallback(
    (direction: 'next' | 'prev') => {
      if (!invitation) return;
      const newIndex =
        direction === 'next'
          ? Math.min(
              currentQuestionIndex + 1,
              invitation.test.questions.length - 1
            )
          : Math.max(currentQuestionIndex - 1, 0);

      // Check if transitioning to personality questions
      if (direction === 'next' && newIndex < invitation.test.questions.length) {
        const currentQuestion = invitation.test.questions[currentQuestionIndex];
        const nextQuestion = invitation.test.questions[newIndex];

        if (
          currentQuestion?.questionType !== 'PERSONALITY' &&
          nextQuestion?.questionType === 'PERSONALITY' &&
          !hasSeenPersonalityIntro
        ) {
          setShowTransitionScreen(true);
          return;
        }
      }

      setCurrentQuestionIndex(newIndex);

      // Set start time for the new question if not already set
      const newQuestion = invitation.test.questions[newIndex];
      if (newQuestion && !questionStartTime[newQuestion.id]) {
        setQuestionStartTime((prev) => ({
          ...prev,
          [newQuestion.id]: { epoch: Date.now(), key: newQuestion.id },
        }));
      }
    },
    [
      invitation,
      currentQuestionIndex,
      questionStartTime,
      hasSeenPersonalityIntro,
    ]
  );

  // Handle confidence scoring for personality questions
  const handleConfidenceChange = useCallback(
    (questionId: string, confidence: number) => {
      setConfidenceScores((prev) => ({
        ...prev,
        [questionId]: confidence,
      }));
    },
    []
  );

  // Check if current question is personality type
  const isPersonalityQuestion = useCallback((question: Question) => {
    return question.questionType === 'PERSONALITY';
  }, []);

  // Get personality vs objective progress
  const getQuestionProgress = useCallback(() => {
    if (!invitation)
      return {
        objective: 0,
        personality: 0,
        totalObjective: 0,
        totalPersonality: 0,
      };

    const objectiveQuestions = invitation.test.questions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );
    const personalityQuestions = invitation.test.questions.filter(
      (q) => q.questionType === 'PERSONALITY'
    );

    const answeredObjective = objectiveQuestions.filter(
      (q) => answers[q.id]
    ).length;
    const answeredPersonality = personalityQuestions.filter(
      (q) => answers[q.id]
    ).length;

    return {
      objective: answeredObjective,
      personality: answeredPersonality,
      totalObjective: objectiveQuestions.length,
      totalPersonality: personalityQuestions.length,
    };
  }, [invitation, answers]);

  // Handle transition screen continue
  const handleTransitionContinue = useCallback(() => {
    setShowTransitionScreen(false);
    setHasSeenPersonalityIntro(true);
    // Navigate to the first personality question
    if (!invitation?.test?.questions) return;
    const nextIndex = Math.min(
      currentQuestionIndex + 1,
      invitation.test.questions.length - 1
    );
    setCurrentQuestionIndex(nextIndex);

    const nextQuestion = invitation.test.questions[nextIndex];
    if (nextQuestion && !questionStartTime[nextQuestion.id]) {
      setQuestionStartTime((prev) => ({
        ...prev,
        [nextQuestion.id]: { epoch: Date.now(), key: nextQuestion.id },
      }));
    }
  }, [currentQuestionIndex, invitation, questionStartTime]);

  // Submit test
  const submitTest = useCallback(async () => {
    if (isSubmitting || !invitation) return;

    console.log('🚀 Starting test submission...');
    setIsSubmitting(true);
    setError(null);
    try {
      const finalQuestionStartTimes = { ...questionStartTime };
      invitation.test.questions.forEach((q) => {
        if (!finalQuestionStartTimes[q.id]) {
          finalQuestionStartTimes[q.id] = { epoch: Date.now(), key: q.id };
        }
      });

      let response;
      if (isPublicAttempt) {
        // Public test submission
        response = await fetch(`/api/public-test-attempts/${invitationId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers,
            questionStartTime: finalQuestionStartTimes,
            status: 'COMPLETED',
          }),
        });
      } else {
        // Regular invitation-based test submission
        response = await fetch('/api/test-attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invitationId,
            answers,
            questionStartTime: finalQuestionStartTimes,
            status: 'COMPLETED',
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit test answers.');
      }

      // Stop proctoring immediately using global function
      stopProctoringGlobally();

      // IMMEDIATELY stop camera and microphone tracks
      if (streamRef.current) {
        console.log('🎥 Immediately stopping camera and microphone tracks...');
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(
            '🎥 Stopped track:',
            track.kind,
            'readyState:',
            track.readyState
          );
        });
        setCameraActuallyStopped(true);
      }

      // IMMEDIATELY clear video element to stop showing camera feed
      if (videoRef.current) {
        console.log('🎥 Clearing video element...');
        videoRef.current.srcObject = null;
      }

      // Stop recording UI immediately to show user recording has stopped
      setIsRecording(false);

      // Stop timer immediately
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Update the test attempt status immediately to stop proctoring events
      setTestAttempt((prev: any) => ({
        ...prev,
        status: 'COMPLETED',
      }));

      const responseData = await response.json();
      if (responseData && responseData.id) {
        setTestAttempt((prev: any) => ({
          ...prev,
          ...responseData,
        }));
      }

      // Stop recording and upload - wait for completion
      setIsUploadingRecording(true);
      await stopRecordingSession(true);
      setIsUploadingRecording(false);

      // Clean up any remaining references
      streamRef.current = null;

      // WAIT for a moment to ensure all backend processing is complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Instead of redirecting immediately, show completion state
      setTestCompleted(true);
      setIsSubmitting(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during test submission.'
      );
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    invitation,
    answers,
    questionStartTime,
    router,
    stopRecordingSession,
    isPublicAttempt,
    invitationId,
  ]);

  // Handle time expiry
  const handleTimeExpired = useCallback(() => {
    if (!invitation) return;
    if (currentQuestionIndex < invitation.test.questions.length - 1) {
      navigateQuestion('next');
    } else {
      submitTest();
    }
  }, [invitation, currentQuestionIndex, navigateQuestion, submitTest]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-military-green"></div>
          <p className="text-text-light">Loading test details...</p>
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

  // Check if test was completed in a previous session (not current session)
  if (
    !testCompleted &&
    !testStarted &&
    (testAttempt?.status === 'COMPLETED' || invitation.status === 'COMPLETED')
  ) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-12 text-center shadow-xl">
          <h1 className="mb-6 text-4xl font-bold text-military-green">
            Test Already Completed
          </h1>
          <p className="mb-8 text-xl text-gray-700">
            This test has already been submitted.
          </p>
          <Link
            href="/"
            className="w-full rounded-md bg-military-green px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-opacity-90"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Details submission phase - FIRST STEP before any system checks
  if (!detailsSubmitted && invitation) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-6">
        <div className="w-full max-w-lg rounded-xl bg-primary-white p-8 shadow-2xl md:p-12">
          <h1 className="mb-4 text-center text-3xl font-bold text-gray-800">
            Welcome to {invitation.test.title}
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
                Email
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
              disabled={isUpdatingDetails}
              className={`w-full rounded-lg bg-military-green px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {isUpdatingDetails ? 'Submitting...' : 'Submit Details'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // System compatibility check phase - AFTER details submission
  if (
    detailsSubmitted &&
    showCompatibilityChecker &&
    invitation &&
    !systemCompatibilityPassed
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-off-white p-4">
        <div className="w-full max-w-4xl">
          <SystemCompatibilityChecker
            onComplete={handleSystemCompatibilityComplete}
            onStartTest={handleContinueFromCompatibility}
            className="rounded-xl bg-primary-white p-6 shadow-2xl md:p-10"
          />
        </div>
      </div>
    );
  }

  // Test ready phase
  if (
    !testStarted &&
    detailsSubmitted &&
    hasPermissions &&
    systemCompatibilityPassed
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

          {/* Proctoring Status */}
          <div className="mb-6 text-center">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center justify-center">
                <div className="mr-2 h-3 w-3 animate-pulse rounded-full bg-amber-500"></div>
                <span className="font-medium text-amber-700">
                  Proctoring Ready
                </span>
              </div>
              <p className="text-sm text-amber-600">
                Recording will begin automatically when you start the test.
              </p>
            </div>
          </div>

          <div className="mb-8 space-y-6">
            <div className="rounded-lg bg-gray-50 p-6">
              <h2 className="mb-4 text-xl font-semibold text-text-dark">
                Test Instructions
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
                <li>Your session will be recorded throughout the test.</li>
                <li>
                  Click &apos;Submit Test&apos; on the last question when you
                  are finished.
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
              <h2 className="mb-4 text-xl font-semibold text-blue-800">
                Test Features
              </h2>
              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                {invitation.test.allowReview && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-xs text-white">📍</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">
                        Question Bookmarking
                      </p>
                      <p className="text-blue-700">
                        Click the bookmark icon to flag questions for later
                        review
                      </p>
                    </div>
                  </div>
                )}
                {invitation.test.allowReview && (
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                      <span className="text-xs text-white">👁️</span>
                    </div>
                    <div>
                      <p className="font-medium text-blue-800">Review Mode</p>
                      <p className="text-blue-700">
                        Click &quot;Review&quot; button to view and modify
                        bookmarked questions
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <span className="text-xs text-white">📊</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">
                      Progress Tracking
                    </p>
                    <p className="text-blue-700">
                      View your test progress and navigate between questions
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-500">
                    <span className="text-xs text-white">🔒</span>
                  </div>
                  <div>
                    <p className="font-medium text-blue-800">
                      Secure Recording
                    </p>
                    <p className="text-blue-700">
                      Session recording for post-test analysis and verification
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={startTest}
            className="w-full rounded-lg bg-military-green px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-opacity-90 md:py-4"
          >
            Start Proctored Test
          </button>
        </div>
      </div>
    );
  }

  // Bookmarked questions review modal
  if (showBookmarkedReview && invitation && invitation.test.allowReview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden">
          <BookmarkedQuestionsReview
            questions={invitation.test.questions}
            bookmarkedQuestionIds={bookmarkedQuestions}
            answers={answers}
            onAnswerChange={handleAnswer}
            onRemoveBookmark={handleBookmarkToggle}
            onClose={() => setShowBookmarkedReview(false)}
          />
        </div>
      </div>
    );
  }

  // Personality questions transition screen
  if (showTransitionScreen && invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white bg-opacity-20">
                <svg
                  className="h-10 w-10 text-white"
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
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                Personality Assessment
              </h1>
              <p className="text-lg text-blue-100">
                Transitioning to work style evaluation
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  Assessment Approach Change
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-gray-600">
                  The following questions assess your work style and
                  preferences.
                  <strong className="text-blue-600">
                    {' '}
                    There are no right or wrong answers.
                  </strong>
                </p>

                <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-6">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5 h-6 w-6 text-blue-600">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="mb-2 font-medium text-blue-800">
                        How to approach these questions:
                      </h3>
                      <ul className="space-y-1 text-sm text-blue-700">
                        <li>
                          • Select the option that best describes your natural
                          approach
                        </li>
                        <li>
                          • Think about how you typically behave in work
                          situations
                        </li>
                        <li>
                          • Be honest - this helps create an accurate profile
                        </li>
                        <li>• You can change your answers if needed</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                <button
                  onClick={handleTransitionContinue}
                  className="inline-flex items-center rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-blue-700"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                  Continue to Personality Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Test completed state
  if (testCompleted && invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          {/* Main Thank You Card */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
            {/* Header with Success Icon */}
            <div className="bg-gradient-to-r from-military-green to-primary-600 p-8 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white bg-opacity-20">
                <svg
                  className="h-10 w-10 text-white"
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
              <h1 className="mb-2 text-3xl font-bold text-white md:text-4xl">
                Test Completed!
              </h1>
              <p className="text-lg text-primary-100">
                Your submission has been successfully recorded
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="mb-8 text-center">
                <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                  {candidateName
                    ? `Thank you, ${candidateName}!`
                    : 'Thank you for your participation!'}
                </h2>
                <p className="mb-6 text-lg leading-relaxed text-gray-600">
                  You have successfully completed the{' '}
                  <span className="font-medium text-military-green">
                    {invitation.test.title}
                  </span>
                  . Your responses and proctoring data have been securely
                  recorded.
                </p>

                <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-6">
                  <div className="flex items-start">
                    <div className="mr-3 mt-0.5 h-6 w-6 text-green-600">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h3 className="mb-1 font-medium text-green-800">
                        What happens next?
                      </h3>
                      <p className="text-sm text-green-700">
                        Our team will review your submission and may contact you
                        regarding the next steps. Thank you for taking the time
                        to complete this assessment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="text-center">
                <Link
                  href="/"
                  className="inline-flex items-center rounded-lg bg-military-green px-8 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-opacity-90"
                >
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011 1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Return to Homepage
                </Link>

                <p className="mt-4 text-sm text-gray-500">
                  You can safely close this window.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active test phase
  if (testStarted && invitation) {
    const currentQuestion = invitation.test.questions[currentQuestionIndex];

    return (
      <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
        {/* Submitting Overlay - Higher z-index to cover everything */}
        {isSubmitting && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900 bg-opacity-75 backdrop-blur-sm">
            <div className="mx-4 max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-2xl">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-military-green border-t-transparent"></div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">
                Submitting Your Test
              </h3>
              <p className="mb-4 text-gray-600">
                Please wait while we process your submission and upload your
                proctoring data...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                {isUploadingRecording && <p>📤 Uploading recording data...</p>}
                <p>✅ Stopping recording session</p>
                <p>💾 Saving your answers</p>
                <p>🔒 Securing your data</p>
              </div>
            </div>
          </div>
        )}

        {/* Recording indicator - Bottom Right */}
        {(isRecording || isSubmitting || isUploadingRecording) && (
          <div className="fixed bottom-6 right-6 z-50">
            <div
              className={`rounded-lg border border-gray-600 px-3 py-2 text-xs text-white shadow-lg ${
                isUploadingRecording
                  ? 'bg-blue-600'
                  : isSubmitting
                    ? cameraActuallyStopped
                      ? 'bg-green-600'
                      : 'bg-amber-600'
                    : 'bg-red-600'
              }`}
            >
              <div className="flex items-center space-x-2">
                {isUploadingRecording ? (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-blue-300"></div>
                    <span>Uploading</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div
                      className={`h-2 w-2 rounded-full ${cameraActuallyStopped ? 'bg-green-300' : 'bg-amber-300'}`}
                    ></div>
                    <span>
                      {cameraActuallyStopped ? 'Complete' : 'Finalizing'}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-300"></div>
                    <span>REC</span>
                    <span>
                      {Math.floor(recordingDuration / 60)}:
                      {(recordingDuration % 60).toString().padStart(2, '0')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Compact header matching website theme */}
        <header className="sticky top-0 z-40 bg-military-green text-white shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h1 className="text-lg font-semibold">
                  {invitation.test.title}
                </h1>
                <span className="text-sm text-green-100">
                  Question {currentQuestionIndex + 1} of{' '}
                  {invitation.test.questions.length}
                </span>
                {/* Question type indicator */}
                {isPersonalityQuestion(currentQuestion) && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-100">
                    🧠 Personality
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowProgressBar(!showProgressBar)}
                  className="flex items-center space-x-1 rounded bg-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/20"
                  title="Toggle progress"
                >
                  <BarChart3 className="h-3 w-3" />
                  <span>Progress</span>
                </button>

                {invitation.test.allowReview && (
                  <QuestionBookmark
                    questionId={currentQuestion.id}
                    isBookmarked={bookmarkedQuestions.has(currentQuestion.id)}
                    onToggle={handleBookmarkToggle}
                    size="md"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Dual progress bars for objective and personality questions */}
          {(() => {
            const progress = getQuestionProgress();
            const hasPersonalityQuestions = progress.totalPersonality > 0;

            if (hasPersonalityQuestions) {
              return (
                <div className="space-y-1 px-4 pb-2">
                  {/* Objective questions progress */}
                  {progress.totalObjective > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="w-16 text-xs text-green-100">
                        📝 Objective
                      </span>
                      <div className="h-1 flex-1 rounded-full bg-white/20">
                        <div
                          className="h-full rounded-full bg-green-300 transition-all duration-300"
                          style={{
                            width: `${(progress.objective / progress.totalObjective) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-8 text-xs text-green-100">
                        {progress.objective}/{progress.totalObjective}
                      </span>
                    </div>
                  )}
                  {/* Personality questions progress */}
                  <div className="flex items-center space-x-2">
                    <span className="w-16 text-xs text-blue-100">
                      🧠 Personality
                    </span>
                    <div className="h-1 flex-1 rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-blue-300 transition-all duration-300"
                        style={{
                          width: `${(progress.personality / progress.totalPersonality) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-xs text-blue-100">
                      {progress.personality}/{progress.totalPersonality}
                    </span>
                  </div>
                </div>
              );
            } else {
              // Single progress bar for objective-only tests
              return (
                <div className="h-0.5 bg-white/20">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / invitation.test.questions.length) * 100}%`,
                    }}
                  />
                </div>
              );
            }
          })()}
        </header>

        {/* Expandable Progress Overview */}
        {showProgressBar && (
          <div className="border-b border-gray-100 bg-white p-6 shadow-sm">
            <TestProgressBar
              totalQuestions={invitation.test.questions.length}
              currentQuestionIndex={currentQuestionIndex}
              answeredQuestions={getAnsweredQuestions()}
              bookmarkedQuestions={bookmarkedQuestions}
              questionIds={invitation.test.questions.map((q) => q.id)}
              onQuestionSelect={navigateToQuestion}
            />
          </div>
        )}

        {/* Main content area - Fitted to screen */}
        <main className="flex-grow overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Question Card */}
            <div
              className={`flex flex-col overflow-hidden rounded-lg border shadow-sm ${
                isPersonalityQuestion(currentQuestion)
                  ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* Question Header */}
              <div
                className={`border-b px-6 py-3 ${
                  isPersonalityQuestion(currentQuestion)
                    ? 'border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center space-x-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white ${
                          isPersonalityQuestion(currentQuestion)
                            ? 'bg-blue-600'
                            : 'bg-military-green'
                        }`}
                      >
                        {isPersonalityQuestion(currentQuestion) ? '🧠' : '📝'}{' '}
                        Question {currentQuestionIndex + 1}
                      </span>
                      <span className="text-sm text-gray-500">
                        {currentQuestion.category}
                      </span>
                      {isPersonalityQuestion(currentQuestion) &&
                        currentQuestion.personalityDimension && (
                          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-700">
                            {currentQuestion.personalityDimension.name}
                          </span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold leading-tight text-gray-900">
                      {currentQuestion.promptText}
                    </h2>
                    {/* Different instruction text for personality questions */}
                    <p
                      className={`mt-2 text-sm ${
                        isPersonalityQuestion(currentQuestion)
                          ? 'font-medium text-blue-600'
                          : 'text-gray-500'
                      }`}
                    >
                      {isPersonalityQuestion(currentQuestion)
                        ? 'Select the option that best describes your approach'
                        : 'Select the correct answer'}
                    </p>
                  </div>
                </div>

                {/* Timer */}
                <div className="mt-4">
                  <QuestionTimer
                    key={currentQuestion.id}
                    questionKey={currentQuestion.id}
                    durationSeconds={currentQuestion.timerSeconds}
                    onTimeExpired={handleTimeExpired}
                    startTimeEpoch={
                      questionStartTime[currentQuestion.id]?.epoch || 0
                    }
                  />
                </div>
              </div>

              {/* Question Image */}
              {currentQuestion.promptImageUrl && (
                <div className="bg-gray-50 px-8 py-6">
                  <div className="overflow-hidden rounded-xl shadow-md">
                    <img
                      src={currentQuestion.promptImageUrl}
                      alt="Question prompt"
                      className="h-auto w-full"
                    />
                  </div>
                </div>
              )}

              {/* Answer Options */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.answerOptions.map((option, index) => {
                    const isSelected =
                      answers[currentQuestion.id]?.answerIndex === index;
                    const optionLetter = String.fromCharCode(65 + index); // A, B, C, D...
                    const isPersonality =
                      isPersonalityQuestion(currentQuestion);

                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswer(currentQuestion.id, index)}
                        className={`group relative flex items-start space-x-3 rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                          isSelected
                            ? isPersonality
                              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-500/20'
                              : 'border-military-green bg-green-50 shadow-md ring-2 ring-military-green/20'
                            : isPersonality
                              ? 'hover:bg-blue-25 border-blue-200 bg-white hover:border-blue-300 hover:shadow-sm'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        } `}
                      >
                        {/* Option Letter */}
                        <div
                          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                            isSelected
                              ? isPersonality
                                ? 'bg-blue-500 text-white'
                                : 'bg-military-green text-white'
                              : isPersonality
                                ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                                : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                          } `}
                        >
                          {optionLetter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1">
                          <p
                            className={`text-base leading-relaxed transition-colors duration-200 ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'} `}
                          >
                            {option}
                          </p>
                        </div>

                        {/* Selection Indicator - Different for personality questions */}
                        {isSelected && (
                          <div className="flex-shrink-0">
                            {isPersonality ? (
                              <svg
                                className="h-6 w-6 text-blue-500"
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
                            ) : (
                              <svg
                                className="h-6 w-6 text-military-green"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Confidence Slider for Personality Questions */}
                {isPersonalityQuestion(currentQuestion) &&
                  answers[currentQuestion.id] && (
                    <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-medium text-blue-800">
                          How confident are you in this choice?
                        </label>
                        <span className="text-sm text-blue-600">
                          {confidenceScores[currentQuestion.id] || 3}/5
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-xs text-blue-600">Not sure</span>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={confidenceScores[currentQuestion.id] || 3}
                          onChange={(e) =>
                            handleConfidenceChange(
                              currentQuestion.id,
                              parseInt(e.target.value)
                            )
                          }
                          className="slider h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-blue-200"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((confidenceScores[currentQuestion.id] || 3) - 1) * 25}%, #cbd5e1 ${((confidenceScores[currentQuestion.id] || 3) - 1) * 25}%, #cbd5e1 100%)`,
                          }}
                        />
                        <span className="text-xs text-blue-600">Very sure</span>
                      </div>
                    </div>
                  )}

                {/* Answer Status */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {answers[currentQuestion.id] ? (
                      <div
                        className={`flex items-center space-x-2 ${
                          isPersonalityQuestion(currentQuestion)
                            ? 'text-blue-600'
                            : 'text-green-600'
                        }`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium">
                          {isPersonalityQuestion(currentQuestion)
                            ? 'Response recorded'
                            : 'Answer selected'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-gray-400">
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
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm">
                          {isPersonalityQuestion(currentQuestion)
                            ? 'Select your response'
                            : 'Select an answer'}
                        </span>
                      </div>
                    )}
                  </div>

                  {invitation.test.allowReview &&
                    bookmarkedQuestions.has(currentQuestion.id) && (
                      <div className="flex items-center space-x-2 text-amber-600">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        <span className="text-sm font-medium">
                          Bookmarked for review
                        </span>
                      </div>
                    )}
                </div>

                {/* Navigation Controls - Moved from footer */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="flex items-center justify-between">
                    {/* Left: Previous Button */}
                    <button
                      onClick={() => navigateQuestion('prev')}
                      disabled={currentQuestionIndex === 0}
                      className={`flex items-center space-x-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        currentQuestionIndex === 0
                          ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
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

                    {/* Center: Progress and Review Later */}
                    <div className="flex items-center space-x-3">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-900">
                          {Object.keys(answers).length} of{' '}
                          {invitation.test.questions.length} answered
                        </div>
                        {invitation.test.allowReview &&
                          bookmarkedQuestions.size > 0 && (
                            <div className="text-xs font-medium text-military-green">
                              {bookmarkedQuestions.size} bookmarked for review
                            </div>
                          )}
                      </div>

                      {/* Review Later Button */}
                      {invitation.test.allowReview && (
                        <button
                          onClick={() => {
                            // Add to bookmarks if not already bookmarked
                            if (!bookmarkedQuestions.has(currentQuestion.id)) {
                              handleBookmarkToggle(currentQuestion.id);
                            }
                            // Navigate to next question or show review if last question
                            if (
                              currentQuestionIndex <
                              invitation.test.questions.length - 1
                            ) {
                              navigateQuestion('next');
                            } else {
                              setShowBookmarkedReview(true);
                            }
                          }}
                          className="flex items-center space-x-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 transition-all duration-200 hover:bg-amber-100"
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
                              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                          <span>Review Later</span>
                        </button>
                      )}

                      {/* Review Bookmarked Button */}
                      {invitation.test.allowReview &&
                        bookmarkedQuestions.size > 0 && (
                          <button
                            onClick={() => setShowBookmarkedReview(true)}
                            className="flex items-center space-x-1 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-military-green transition-all duration-200 hover:bg-green-100"
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
                                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span>Review ({bookmarkedQuestions.size})</span>
                          </button>
                        )}
                    </div>

                    {/* Right: Next/Submit Button */}
                    {currentQuestionIndex <
                    invitation.test.questions.length - 1 ? (
                      <button
                        onClick={() => navigateQuestion('next')}
                        className="flex items-center space-x-1 rounded-md bg-military-green px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-opacity-90"
                      >
                        <span>Next</span>
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
                    ) : (
                      <button
                        onClick={submitTest}
                        disabled={isSubmitting}
                        className="flex items-center space-x-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            <span>Submitting...</span>
                          </>
                        ) : (
                          <>
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
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Submit Test</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Hidden video element for recording */}
        <video
          ref={videoRef}
          className="hidden"
          muted
          playsInline
          autoPlay
          controls={false}
        />
      </div>
    );
  }

  return null;
}
