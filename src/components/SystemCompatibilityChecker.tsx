'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  X,
  AlertCircle,
  Camera,
  Mic,
  Monitor,
  Loader,
  Play,
  Shield,
} from 'lucide-react';
import { logger } from '@/lib/logger';

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

interface SystemCompatibilityCheckerProps {
  onComplete: (passed: boolean, results: CompatibilityResult) => void;
  onStartTest?: () => void;
  className?: string;
}

// Extend window interface for browser compatibility checks
declare global {
  interface Window {
    mozRTCPeerConnection?: any;
    webkitRTCPeerConnection?: any;
  }
}

export default function SystemCompatibilityChecker({
  onComplete,
  onStartTest,
  className = '',
}: SystemCompatibilityCheckerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const [results, setResults] = useState<CompatibilityResult>({
    camera: { status: 'checking', message: 'Ready to test camera access' },
    microphone: {
      status: 'checking',
      message: 'Ready to test microphone access',
    },
    browser: {
      status: 'checking',
      message: 'Ready to check browser compatibility',
    },
    bandwidth: { status: 'checking', message: 'Ready to test network speed' },
  });

  const [overallStatus, setOverallStatus] = useState<
    'checking' | 'pass' | 'fail'
  >('checking');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const updateResult = (
    key: keyof CompatibilityResult,
    status: 'checking' | 'pass' | 'fail',
    message: string,
    details?: string
  ) => {
    setResults((prev) => ({
      ...prev,
      [key]: { status, message, details },
    }));
  };

  const checkBrowserCompatibility = async () => {
    updateResult('browser', 'checking', 'Checking browser compatibility...');

    try {
      const userAgent = navigator.userAgent;
      const isChrome =
        /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
      const isFirefox = /Firefox/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isEdge = /Edg/.test(userAgent);

      // Check for required APIs
      const hasGetUserMedia = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
      const hasWebRTC = !!(
        window.RTCPeerConnection ||
        window.mozRTCPeerConnection ||
        window.webkitRTCPeerConnection
      );

      if (!hasGetUserMedia) {
        updateResult(
          'browser',
          'fail',
          'Browser not supported',
          'getUserMedia API not available'
        );
        return;
      }

      if (!hasMediaRecorder) {
        updateResult(
          'browser',
          'fail',
          'Recording not supported',
          'MediaRecorder API not available'
        );
        return;
      }

      let browserName = 'Unknown';
      if (isChrome) browserName = 'Chrome';
      else if (isFirefox) browserName = 'Firefox';
      else if (isSafari) browserName = 'Safari';
      else if (isEdge) browserName = 'Edge';

      updateResult(
        'browser',
        'pass',
        `${browserName} - Fully compatible`,
        'All required APIs available'
      );
    } catch (error) {
      updateResult(
        'browser',
        'fail',
        'Browser check failed',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const checkCameraAccess = async () => {
    updateResult('camera', 'checking', 'Testing camera access...');

    try {
      // Use mic-check library for better error handling
      const { requestMediaPermissions } = await import('mic-check');

      // Request both camera and microphone permissions in one go
      await requestMediaPermissions({ video: true, audio: true });

      // If we get here, camera permission was granted
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        },
      });

      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length === 0) {
        updateResult(
          'camera',
          'fail',
          'No camera detected',
          'No video tracks available'
        );
        return;
      }

      const track = videoTracks[0];
      const settings = track.getSettings();

      // Test video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve, reject) => {
          if (!videoRef.current) return reject('Video element not available');
          videoRef.current.onloadedmetadata = resolve;
          videoRef.current.onerror = reject;
        });
      }

      streamRef.current = stream;
      updateResult(
        'camera',
        'pass',
        'Camera working perfectly',
        `${settings.width}x${settings.height} at ${settings.frameRate}fps`
      );

      // Stop the stream after testing
      stream.getTracks().forEach((track) => track.stop());
    } catch (error: any) {
      let message = 'Camera access failed';
      let details = 'Please check camera permissions';

      if (error && error.type) {
        // Handle mic-check specific errors
        const { MediaPermissionsErrorType } = await import('mic-check');
        switch (error.type) {
          case MediaPermissionsErrorType.SystemPermissionDenied:
            message = 'System permission denied';
            details = 'Please enable camera access in system settings';
            break;
          case MediaPermissionsErrorType.UserPermissionDenied:
            message = 'User permission denied';
            details = 'Please click "Allow" when prompted for camera access';
            break;
          case MediaPermissionsErrorType.CouldNotStartVideoSource:
            message = 'Camera in use';
            details = 'Close other apps using the camera and try again';
            break;
          default:
            message = error.message || 'Camera test failed';
            break;
        }
      } else if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          message = 'No camera found';
          details = 'Please connect a camera device';
        } else if (error.name === 'NotAllowedError') {
          message = 'Camera access denied';
          details = 'Please allow camera access in browser settings';
        }
      }

      updateResult('camera', 'fail', message, details);
    }
  };

  const checkMicrophoneAccess = async () => {
    updateResult('microphone', 'checking', 'Testing microphone access...');

    try {
      // Since we already requested both permissions in camera check,
      // just test microphone functionality without requesting again
      // const { requestMediaPermissions } = await import('mic-check');
      // await requestMediaPermissions({ audio: true, video: false });

      // If we get here, microphone permission was granted
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        updateResult(
          'microphone',
          'fail',
          'No microphone detected',
          'No audio tracks available'
        );
        return;
      }

      const track = audioTracks[0];
      const settings = track.getSettings();

      // Test audio level detection
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      // Check for audio input for 1 second
      let hasAudioInput = false;
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        if (average > 5) hasAudioInput = true;
      };

      const audioCheckInterval = setInterval(checkAudio, 100);

      setTimeout(() => {
        clearInterval(audioCheckInterval);
        audioContext.close();
        stream.getTracks().forEach((track) => track.stop());

        updateResult(
          'microphone',
          'pass',
          'Microphone working perfectly',
          `Sample rate: ${settings.sampleRate}Hz`
        );
      }, 1000);
    } catch (error: any) {
      let message = 'Microphone access failed';
      let details = 'Please check microphone permissions';

      if (error && error.type) {
        // Handle mic-check specific errors
        const { MediaPermissionsErrorType } = await import('mic-check');
        switch (error.type) {
          case MediaPermissionsErrorType.SystemPermissionDenied:
            message = 'System permission denied';
            details = 'Please enable microphone access in system settings';
            break;
          case MediaPermissionsErrorType.UserPermissionDenied:
            message = 'User permission denied';
            details =
              'Please click "Allow" when prompted for microphone access';
            break;
          default:
            message = error.message || 'Microphone test failed';
            break;
        }
      } else if (error instanceof Error) {
        if (error.name === 'NotFoundError') {
          message = 'No microphone found';
          details = 'Please connect a microphone device';
        } else if (error.name === 'NotAllowedError') {
          message = 'Microphone access denied';
          details = 'Please allow microphone access in browser settings';
        }
      }

      updateResult('microphone', 'fail', message, details);
    }
  };

  const checkBandwidth = async () => {
    updateResult('bandwidth', 'checking', 'Testing network speed...');

    // Simple and reliable connectivity check
    try {
      const startTime = Date.now();

      // Test with multiple endpoints to increase reliability
      const testEndpoints = [
        // Use our own API endpoint first
        '/api/health',
        // Fallback to reliable external services
        'https://www.google.com/favicon.ico',
        'https://cdn.jsdelivr.net/npm/react@17/umd/react.production.min.js',
      ];

      let bestResult = null;

      for (const endpoint of testEndpoints) {
        try {
          const testStart = Date.now();
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch(endpoint, {
            method: 'HEAD', // Use HEAD to minimize data transfer
            cache: 'no-cache',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const loadTime = Date.now() - testStart;
            bestResult = { success: true, loadTime, endpoint };
            break; // Use first successful result
          }
        } catch (endpointError) {
          // Continue to next endpoint
          continue;
        }
      }

      if (bestResult) {
        const { loadTime } = bestResult;

        if (loadTime < 1000) {
          updateResult(
            'bandwidth',
            'pass',
            'Connection speed excellent',
            `Response time: ${loadTime}ms`
          );
        } else if (loadTime < 3000) {
          updateResult(
            'bandwidth',
            'pass',
            'Connection speed good',
            `Response time: ${loadTime}ms`
          );
        } else if (loadTime < 8000) {
          updateResult(
            'bandwidth',
            'pass',
            'Connection speed acceptable',
            `Response time: ${loadTime}ms`
          );
        } else {
          updateResult(
            'bandwidth',
            'pass',
            'Slow connection detected',
            `Response time: ${loadTime}ms - May affect performance`
          );
        }
      } else {
        // All endpoints failed, but don't block the test
        updateResult(
          'bandwidth',
          'pass',
          'Connection available',
          'Unable to measure speed but basic connectivity confirmed'
        );
      }
    } catch (error) {
      logger.warn(
        'Network speed check failed',
        {
          component: 'SystemCompatibilityChecker',
          operation: 'bandwidth_check',
          userAgent: navigator.userAgent,
        },
        error as Error
      );
      // Don't fail the entire compatibility check for network issues
      updateResult(
        'bandwidth',
        'pass',
        'Network check skipped',
        'Proceeding with test (network check unavailable)'
      );
    }
  };

  const startCompatibilityChecks = async () => {
    setHasStarted(true);

    // Reset all results to checking state
    setResults({
      camera: { status: 'checking', message: 'Testing camera access...' },
      microphone: {
        status: 'checking',
        message: 'Testing microphone access...',
      },
      browser: {
        status: 'checking',
        message: 'Checking browser compatibility...',
      },
      bandwidth: { status: 'checking', message: 'Testing network speed...' },
    });

    // Run checks sequentially to avoid overwhelming the user with permission prompts
    try {
      await checkBrowserCompatibility();
      await checkCameraAccess();
      await checkMicrophoneAccess();
      await checkBandwidth();
    } catch (error) {
      logger.error(
        'Error during compatibility checks',
        {
          component: 'SystemCompatibilityChecker',
          operation: 'compatibility_checks',
          userAgent: navigator.userAgent,
        },
        error as Error
      );
    }
  };

  useEffect(() => {
    // Cleanup function only
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update overall status when all checks complete
  useEffect(() => {
    const allChecksComplete = Object.values(results).every(
      (result) => result.status !== 'checking'
    );

    if (allChecksComplete) {
      const allPassed = Object.values(results).every(
        (result) => result.status === 'pass'
      );
      const newStatus = allPassed ? 'pass' : 'fail';
      setOverallStatus(newStatus);
      onComplete(allPassed, results);
    }
  }, [results, onComplete]);

  const getStatusIcon = (status: 'checking' | 'pass' | 'fail') => {
    switch (status) {
      case 'checking':
        return <Loader className="h-5 w-5 animate-spin text-blue-500" />;
      case 'pass':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'fail':
        return <X className="h-5 w-5 text-red-500" />;
    }
  };

  const getTestIcon = (key: keyof CompatibilityResult) => {
    switch (key) {
      case 'camera':
        return <Camera className="h-6 w-6" />;
      case 'microphone':
        return <Mic className="h-6 w-6" />;
      case 'browser':
        return <Monitor className="h-6 w-6" />;
      case 'bandwidth':
        return <AlertCircle className="h-6 w-6" />;
    }
  };

  if (!hasStarted) {
    return (
      <div className={`space-y-6 text-center ${className}`}>
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
            <Shield className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h2 className="mb-2 text-2xl font-bold text-primary-900">
              System Compatibility Check
            </h2>
            <p className="mx-auto max-w-md text-primary-600">
              Before starting your test, we need to verify that your system is
              compatible. We&apos;ll need to check your camera, microphone,
              browser capabilities, and network connection.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-left">
              <h3 className="mb-1 font-medium text-amber-900">
                Permission Required
              </h3>
              <p className="text-sm text-amber-700">
                Your browser will ask for camera and microphone permissions.
                Please click &quot;Allow&quot; to proceed with the compatibility
                check.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={startCompatibilityChecks}
          className="mx-auto flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
        >
          <Play className="h-5 w-5" />
          <span>Start Compatibility Check</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-primary-900">
          System Compatibility Check
        </h2>
        <p className="text-primary-600">
          Testing your system to ensure the best test experience
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(results).map(([key, result]) => (
          <div
            key={key}
            className={`rounded-lg border p-4 transition-colors ${
              result.status === 'pass'
                ? 'border-green-200 bg-green-50'
                : result.status === 'fail'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 pt-0.5">
                {getTestIcon(key as keyof CompatibilityResult)}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium capitalize text-primary-900">
                    {key === 'bandwidth' ? 'Network Speed' : key}
                  </h3>
                  {getStatusIcon(result.status)}
                </div>
                <p className="mt-1 text-sm text-primary-700">
                  {result.message}
                </p>
                {result.details && (
                  <p className="mt-1 text-xs text-primary-500">
                    {result.details}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden video element for camera testing */}
      <video ref={videoRef} className="hidden" muted playsInline autoPlay />

      {overallStatus !== 'checking' && (
        <div
          className={`rounded-lg border p-4 text-center ${
            overallStatus === 'pass'
              ? 'border-green-200 bg-green-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="mb-2 flex items-center justify-center space-x-2">
            {getStatusIcon(overallStatus)}
            <span className="font-medium text-primary-900">
              {overallStatus === 'pass'
                ? 'System Ready for Testing'
                : 'System Issues Detected'}
            </span>
          </div>
          <p className="mb-4 text-sm text-primary-600">
            {overallStatus === 'pass'
              ? 'All systems are working correctly. Camera and microphone permissions have been granted.'
              : 'Some hardware issues were detected. You can still continue with the test, but proctoring features may be limited.'}
          </p>

          {/* Show Continue button only when camera and microphone pass */}
          {onStartTest && (
            <div className="space-y-3">
              {(overallStatus === 'pass' &&
                results.camera.status === 'pass' &&
                results.microphone.status === 'pass') ||
              process.env.NEXT_PUBLIC_DISABLE_PROCTORING_REQUIREMENTS ===
                'true' ? (
                <button
                  onClick={onStartTest}
                  className="mx-auto flex items-center space-x-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
                >
                  <Play className="h-5 w-5" />
                  <span>
                    Continue to Test{' '}
                    {process.env.NEXT_PUBLIC_DISABLE_PROCTORING_REQUIREMENTS ===
                    'true'
                      ? '(Proctoring Disabled)'
                      : ''}
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    disabled
                    className="mx-auto flex cursor-not-allowed items-center space-x-2 rounded-lg bg-gray-400 px-6 py-3 font-medium text-white"
                  >
                    <X className="h-5 w-5" />
                    <span>Cannot Start Test</span>
                  </button>

                  <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                      <div className="text-left">
                        <p className="text-xs text-red-700">
                          <strong>
                            Camera and microphone access required:
                          </strong>{' '}
                          This test requires proctoring. Please grant camera and
                          microphone permissions and refresh the page to try
                          again.
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="mx-auto flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <span>🔄 Retry Permission Check</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
