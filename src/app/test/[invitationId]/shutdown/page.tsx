'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface CompletionData {
  testId: string;
  testTitle: string;
  candidateName: string;
  candidateEmail: string;
  testAttemptId: string;
  invitationId: string;
  isPublicAttempt: boolean;
  hasRecording: boolean;
  timestamp: number;
}

export default function ShutdownPage() {
  const router = useRouter();
  const params = useParams();
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Stopping camera...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleShutdown = async () => {
      try {
        // Get completion data from localStorage
        const storedData = localStorage.getItem('testCompletionData');
        if (!storedData) {
          console.error('No completion data found');
          router.push(`/test/${params.invitationId}/complete`);
          return;
        }

        const completionData: CompletionData = JSON.parse(storedData);

        // Step 1: Force stop all media streams immediately
        setCurrentStep('Stopping camera and microphone...');
        setProgress(20);

        try {
          // Use the robust force cleanup function
          const { forceStopAllCameraAccess } = await import(
            '@/lib/proctor/recorder'
          );
          await forceStopAllCameraAccess();
        } catch (err) {
          console.log('🎥 Error in force cleanup, trying manual cleanup:', err);

          // Fallback manual cleanup
          try {
            const stream = await navigator.mediaDevices
              .getUserMedia({
                video: true,
                audio: true,
              })
              .catch(() => null);

            if (stream) {
              const tracks = stream.getTracks();
              console.log(
                `🎥 Fallback: Found ${tracks.length} active tracks to stop`
              );

              tracks.forEach((track, index) => {
                console.log(
                  `🎥 Fallback stopping track ${index}: ${track.kind}`
                );
                track.stop();
              });
            }
          } catch (fallbackErr) {
            console.log('🎥 Fallback cleanup completed');
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
        setProgress(40);

        // Step 2: Stop any remaining global camera access
        setCurrentStep('Ensuring camera access is released...');

        try {
          // Force enumerate devices to release any hanging references
          await navigator.mediaDevices.enumerateDevices();

          // Try to access and immediately release camera again as a final cleanup
          const testStream = await navigator.mediaDevices
            .getUserMedia({
              video: { width: 1, height: 1 },
              audio: false,
            })
            .catch(() => null);

          if (testStream) {
            testStream.getTracks().forEach((track) => track.stop());
          }
        } catch (err) {
          console.log('🎥 Final camera cleanup completed');
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        setProgress(60);

        // Step 3: Upload any remaining recording data if needed
        if (completionData.hasRecording) {
          setCurrentStep('Finalizing recording upload...');
          setProgress(80);

          try {
            // Try to access the parent window's recording session if available
            if (window.opener && window.opener.recordingSessionRef) {
              console.log(
                '🎥 Found recording session in parent window, uploading...'
              );
              const { stopAndUpload } = await import('@/lib/proctor/recorder');
              await stopAndUpload(
                window.opener.recordingSessionRef.current,
                completionData.testAttemptId
              );
              console.log('🎥 Recording upload completed from shutdown page');
            } else {
              // Give server time to process any pending uploads from the main page
              console.log(
                '🎥 No direct recording session access, waiting for server processing...'
              );
              await new Promise((resolve) => setTimeout(resolve, 3000));
            }
          } catch (error) {
            console.error('🎥 Error during recording upload:', error);
            // Continue with cleanup even if upload fails
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        } else {
          setProgress(80);
        }

        // Step 4: Clear any remaining DOM elements and references
        setCurrentStep('Cleaning up resources...');
        setProgress(90);

        // Force garbage collection of any remaining video elements
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach((video) => {
          video.srcObject = null;
          video.src = '';
          video.load();
        });

        // Clear completion data from localStorage
        localStorage.removeItem('testCompletionData');

        await new Promise((resolve) => setTimeout(resolve, 500));
        setProgress(100);

        setCurrentStep('Complete! Redirecting...');

        // Wait a moment to show completion
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Redirect to completion page
        router.push(
          `/test/${params.invitationId}/complete?invitationId=${completionData.invitationId}`
        );
      } catch (error) {
        console.error('Shutdown error:', error);
        setError('An error occurred during cleanup. Redirecting anyway...');

        setTimeout(() => {
          router.push(`/test/${params.invitationId}/complete`);
        }, 2000);
      }
    };

    handleShutdown();
  }, [router, params.invitationId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        {/* Camera icon with animation */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
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
        </div>

        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Finalizing Your Test
        </h2>

        <p className="mb-6 text-gray-600">{currentStep}</p>

        {/* Progress bar */}
        <div className="mb-4 w-full rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-red-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-sm text-gray-500">{progress}% complete</p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 text-xs text-gray-400">
          Please do not close this window
        </div>
      </div>
    </div>
  );
}
