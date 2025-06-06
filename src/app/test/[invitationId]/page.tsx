'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const router = useRouter();
  const params = useParams();
  const invitationId = params.invitationId as string;

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

  // Candidate details
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);

  // Proctoring state
  const [permissionsRequested, setPermissionsRequested] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldDownloadRef = useRef<boolean>(false);

  // Fetch invitation details
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
                // Test already completed
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

  // Start recording
  const startRecording = useCallback(async () => {
    if (!streamRef.current) {
      console.error('🎥 No stream available for recording');
      return;
    }

    try {
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: 'video/webm',
        });

        // Upload recording to server if test is completed
        if (shouldDownloadRef.current && blob.size > 0) {
          try {
            const formData = new FormData();
            formData.append(
              'file',
              blob,
              `proctoring-session-${invitationId}-${Date.now()}.webm`
            );
            formData.append('testAttemptId', testAttempt?.id || invitationId);

            fetch('/api/upload-recording', {
              method: 'POST',
              body: formData,
            })
              .then(async (response) => {
                if (!response.ok) {
                  console.error(
                    'Failed to upload recording:',
                    await response.text()
                  );
                }
              })
              .catch((error) => {
                console.error('Upload error:', error);
              });

            shouldDownloadRef.current = false; // Reset flag
          } catch (error) {
            console.error('Upload failed:', error);
          }
        }
      };

      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('🎥 Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  }, [invitationId]);

  // Stop recording
  const stopRecording = useCallback(
    (shouldDownload = false) => {
      console.log(
        '🎥 stopRecording called with shouldDownload:',
        shouldDownload
      );
      console.log(
        '🎥 Current state - mediaRecorder exists:',
        !!mediaRecorderRef.current
      );
      console.log(
        '🎥 Current state - mediaRecorder state:',
        mediaRecorderRef.current?.state
      );
      console.log('🎥 Current state - isRecording:', isRecording);

      if (mediaRecorderRef.current && isRecording) {
        shouldDownloadRef.current = shouldDownload;
        console.log('🎥 Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        console.log(
          '🎥 Recording stopped after',
          recordingDuration,
          'seconds, shouldDownload:',
          shouldDownload
        );
      } else {
        console.warn(
          '🎥 Cannot stop recording - mediaRecorder:',
          !!mediaRecorderRef.current,
          'isRecording:',
          isRecording
        );
      }
    },
    [isRecording, recordingDuration]
  );

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      // Stop recording if active
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === 'recording'
      ) {
        mediaRecorderRef.current.stop();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []); // Empty dependency array - only runs on unmount

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
      await startRecording();

      const response = await fetch('/api/test-attempts', {
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
  }, [invitation, error, hasPermissions, startRecording]);

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
    [invitation, currentQuestionIndex, questionStartTime]
  );

  // Submit test
  const submitTest = useCallback(async () => {
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
          invitationId,
          answers,
          questionStartTime: finalQuestionStartTimes,
          status: 'COMPLETED',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit test answers.');
      }

      // Stop recording and upload
      stopRecording(true);

      // Update the test attempt status
      const responseData = await response.json();
      if (responseData && responseData.id) {
        setTestAttempt((prev: any) => ({
          ...prev,
          ...responseData,
          status: 'COMPLETED',
        }));
      }

      // Small delay then redirect
      setTimeout(() => {
        router.push(
          `/test/${invitation.id}/complete?invitationId=${invitation.id}`
        );
      }, 1000);
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
    stopRecording,
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

  const buttonClasses = (
    variant: 'primary' | 'secondary' | 'answer' | 'selectedAnswer',
    disabled = false
  ) => {
    const baseClasses =
      'w-full text-left rounded-md p-4 transition-colors font-semibold text-lg';
    if (disabled) {
      return `${baseClasses} bg-gray-200 text-gray-400 cursor-not-allowed`;
    }
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-military-green text-primary-white hover:bg-opacity-90`;
      case 'secondary':
        return `${baseClasses} bg-gray-200 text-text-dark hover:bg-gray-300`;
      case 'answer':
        return `${baseClasses} bg-off-white text-text-dark hover:bg-gray-100 border border-gray-300`;
      case 'selectedAnswer':
        return `${baseClasses} bg-military-green text-primary-white border border-military-green`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-400 cursor-not-allowed`;
    }
  };

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

  // Permission request phase - must be completed before proceeding
  if (!hasPermissions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-6">
        <div className="w-full max-w-lg rounded-xl bg-primary-white p-8 shadow-2xl">
          <h1 className="mb-6 text-center text-3xl font-bold text-military-green">
            Proctored Test Setup
          </h1>
          <div className="mb-6 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-800">
                This test is proctored and requires:
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-blue-700">
                <li>Camera access for video recording</li>
                <li>Microphone access for audio recording</li>
                <li>Continuous recording throughout the test</li>
                <li>No tab switching or window minimizing</li>
              </ul>
            </div>

            {permissionsRequested && !hasPermissions && (
              <div className="rounded-lg bg-red-100 p-4 text-red-700">
                <p className="font-semibold">Permission Required</p>
                <p className="text-sm">
                  Please allow camera and microphone access when prompted by
                  your browser. If you accidentally denied access, click the
                  camera icon in your address bar to enable it.
                </p>
              </div>
            )}
          </div>

          {hasPermissions && (
            <div className="mb-6 text-center">
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="mb-2 flex items-center justify-center">
                  <div className="mr-2 h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-700">
                    Camera and Microphone Active
                  </span>
                </div>
                <p className="text-sm text-green-600">
                  Your devices are ready for proctoring. You can now proceed to
                  the test.
                </p>
              </div>
            </div>
          )}

          {!hasPermissions ? (
            <button
              onClick={requestPermissions}
              disabled={permissionsRequested}
              className={
                buttonClasses('primary', permissionsRequested) + ' py-3 text-lg'
              }
            >
              {permissionsRequested
                ? 'Requesting Permissions...'
                : 'Grant Camera & Microphone Access'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="text-center font-medium text-green-600">
                ✅ Permissions Granted Successfully
              </div>
              <button
                onClick={() => {
                  // Permissions are granted, move to next phase
                  setPermissionsRequested(true);
                }}
                className={buttonClasses('primary') + ' py-3 text-lg'}
              >
                Continue to Test Details
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Details submission phase
  if (!detailsSubmitted && hasPermissions) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-off-white p-6">
        <div className="w-full max-w-lg rounded-xl bg-primary-white p-8 shadow-2xl md:p-12">
          <h1 className="mb-6 text-center text-3xl font-bold text-military-green md:text-4xl">
            Welcome to the Combat Test
          </h1>
          <p className="mb-8 text-center text-text-light">
            Please enter your details to begin the assessment.
          </p>

          {/* Proctoring Status */}
          <div className="mb-6 text-center">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-center">
                <div className="mr-2 h-3 w-3 animate-pulse rounded-full bg-blue-500"></div>
                <span className="font-medium text-blue-700">
                  Proctoring Active
                </span>
              </div>
              <p className="text-sm text-blue-600">
                Your session is being monitored for security purposes.
              </p>
            </div>
          </div>

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
              className={buttonClasses('primary', isUpdatingDetails)}
            >
              {isUpdatingDetails ? 'Submitting...' : 'Submit Details'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Test ready phase
  if (!testStarted && detailsSubmitted && hasPermissions) {
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

          <div className="mb-8 rounded-lg bg-gray-50 p-6">
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
                Click 'Submit Test' on the last question when you are finished.
              </li>
            </ul>
          </div>
          <button
            onClick={startTest}
            className={buttonClasses('primary') + ' py-3 text-lg md:py-4'}
          >
            Start Proctored Test
          </button>
        </div>
      </div>
    );
  }

  // Active test phase
  if (testStarted && invitation) {
    const currentQuestion = invitation.test.questions[currentQuestionIndex];

    return (
      <div className="flex min-h-screen flex-col bg-off-white">
        {/* Recording status bar */}
        {isRecording && (
          <div className="bg-red-600 px-4 py-2 text-center text-white">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span>🔴 RECORDING</span>
              <span>
                {Math.floor(recordingDuration / 60)}:
                {(recordingDuration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        <header className="bg-primary-white p-4 shadow-md">
          <p className="text-center text-lg font-semibold text-military-green">
            {invitation.test.title}
          </p>
        </header>

        <main className="flex flex-grow flex-col p-4">
          <div className="mx-auto w-full max-w-4xl flex-grow">
            <div className="mb-6">
              <p className="text-sm text-text-light">
                Question {currentQuestionIndex + 1} of{' '}
                {invitation.test.questions.length}
              </p>
              <h2 className="text-2xl font-bold text-text-dark">
                {currentQuestion.promptText}
              </h2>
            </div>

            <QuestionTimer
              key={currentQuestion.id}
              questionKey={currentQuestion.id}
              durationSeconds={currentQuestion.timerSeconds}
              onTimeExpired={handleTimeExpired}
              startTimeEpoch={questionStartTime[currentQuestion.id]?.epoch || 0}
            />

            {currentQuestion.promptImageUrl && (
              <div className="mb-6">
                <img
                  src={currentQuestion.promptImageUrl}
                  alt="Question prompt"
                  className="max-w-full rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {currentQuestion.answerOptions.map((option, index) => {
                const isSelected =
                  answers[currentQuestion.id]?.answerIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, index)}
                    className={buttonClasses(
                      isSelected ? 'selectedAnswer' : 'answer'
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="bg-primary-white p-4 shadow-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <button
              onClick={() => navigateQuestion('prev')}
              disabled={currentQuestionIndex === 0}
              className={
                buttonClasses('secondary', currentQuestionIndex === 0) +
                ' w-32 py-2'
              }
            >
              Previous
            </button>

            <div className="flex-grow"></div>

            {currentQuestionIndex < invitation.test.questions.length - 1 ? (
              <button
                onClick={() => navigateQuestion('next')}
                className={buttonClasses('primary') + ' w-32 py-2'}
              >
                Next
              </button>
            ) : (
              <button
                onClick={submitTest}
                disabled={isSubmitting}
                className={
                  buttonClasses('primary', isSubmitting) + ' w-32 py-2'
                }
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>
        </footer>

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
