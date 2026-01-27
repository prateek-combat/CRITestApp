import { fetchWithCSRF } from '@/lib/csrf';
import { proctorLogger } from '../logger';
import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecordingSession {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  intervalId: number;
  capturedFrames: Blob[];
  isRecording: boolean;
  uploadIntervalId?: number;
  isUploading: boolean;
  uploadedFrameCount: number;
}

export function useProctoring(attemptId: string) {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = useCallback(async () => {
    // Proctoring is now mandatory - always proceed with recording
    try {
      const recordingSession = await startRecording();
      recordingSession.uploadIntervalId = startContinuousFrameUpload(
        recordingSession,
        attemptId
      );
      setSession(recordingSession);
      setIsRecording(true);
      if (videoRef.current) {
        videoRef.current.srcObject = recordingSession.stream;
      }
      proctorLogger.info('Proctoring started successfully', { attemptId });
    } catch (error) {
      proctorLogger.error(
        'Proctoring failed to start - test cannot continue without permissions',
        {
          attemptId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      // Set recording to false and throw error - test requires proctoring
      setIsRecording(false);
      setSession(null);

      // Show error to user - proctoring is now mandatory
      throw new Error(
        'Camera and microphone access is required for this test. Please grant permissions and refresh the page.'
      );
    }
  }, [attemptId]);

  const stop = useCallback(async () => {
    if (session) {
      try {
        // PRIORITY FIX: Stop camera immediately, upload in background
        // Step 1: Immediately stop camera and recording
        destroyRecording(session);
        setSession(null);
        setIsRecording(false);

        // Step 2: Upload frames in background (non-blocking)
        // Don't await this - let it happen in background
        uploadFramesInBackground(
          session,
          attemptId,
          session.uploadedFrameCount
        );
      } catch (error) {
        proctorLogger.error(
          'Failed to stop proctoring session',
          { attemptId },
          error as Error
        );
      }
    }
  }, [session, attemptId]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (session) {
        destroyRecording(session);
      }
    };
  }, [session]);

  return {
    isRecording,
    startRecording: start,
    stopRecording: stop,
    recordingSession: session,
    videoRef,
  };
}

export async function startRecording(): Promise<RecordingSession> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 22050,
        },
      });
    } catch (error) {
      proctorLogger.warn(
        'Initial stream request failed, trying with basic constraints',
        {
          operation: 'fallback_stream_request',
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
    }

    // Create canvas for frame capture
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Failed to get canvas 2D context');
    }

    // Create video element for frame capture (not for display)
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;

    // Wait for video to be ready
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        resolve();
      };
    });

    // Captured frames array
    const capturedFrames: Blob[] = [];

    // Capture cadence: capture a frame every 10 seconds to keep storage manageable
    const FRAME_CAPTURE_INTERVAL_MS = 10_000;

    // Start capturing frames
    const intervalId = window.setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              capturedFrames.push(blob);
              proctorLogger.debug('Frame captured', {
                operation: 'capture_frame',
                frameCount: capturedFrames.length,
                blobSize: blob.size,
              });
            }
          },
          'image/jpeg',
          0.7
        );
      }
    }, FRAME_CAPTURE_INTERVAL_MS); // Capture every 10 seconds

    return {
      stream,
      canvas,
      context,
      intervalId,
      capturedFrames,
      isRecording: true,
      isUploading: false,
      uploadedFrameCount: 0,
    };
  } catch (error) {
    proctorLogger.error(
      'Failed to start recording',
      {
        operation: 'start_recording',
        userAgent: navigator.userAgent,
      },
      error as Error
    );
    throw new Error(
      `Failed to start recording: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export async function stopAndUpload(
  session: RecordingSession,
  attemptId: string
): Promise<void> {
  try {
    // Stop capturing frames
    session.isRecording = false;
    clearInterval(session.intervalId);

    if (session.capturedFrames.length === 0) {
      proctorLogger.warn('No frames captured to upload', {
        operation: 'upload_frames',
        attemptId,
        sessionStatus: session.isRecording ? 'recording' : 'stopped',
      });
      return;
    }

    // Create a zip-like structure by uploading frames in batches
    const batchSize = 10;
    const totalBatches = Math.ceil(session.capturedFrames.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const batchFrames = session.capturedFrames.slice(
        i * batchSize,
        (i + 1) * batchSize
      );

      const formData = new FormData();
      formData.append('attemptId', attemptId);
      formData.append('batchIndex', i.toString());
      formData.append('totalBatches', totalBatches.toString());

      batchFrames.forEach((frame, index) => {
        const globalFrameIndex = i * batchSize + index;
        formData.append(
          `frame_${globalFrameIndex}`,
          frame,
          `frame_${globalFrameIndex}.jpg`
        );
      });

      const response = await fetchWithCSRF('/api/proctor/upload-frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Failed to upload batch ${i + 1}: ${response.statusText}`
        );
      }
    }
  } catch (error) {
    proctorLogger.error(
      'Frame upload failed',
      {
        operation: 'upload_frames',
        attemptId,
        totalFrames: session.capturedFrames.length,
      },
      error as Error
    );
    throw error;
  }
}

// PRIORITY FIX: Non-blocking background frame upload
export function uploadFramesInBackground(
  session: RecordingSession,
  attemptId: string,
  startIndex = 0
): void {
  // Create a copy of frames to avoid memory issues after session is destroyed
  const framesToUpload = [...session.capturedFrames];

  if (framesToUpload.length === 0) {
    proctorLogger.warn('No frames captured to upload', {
      operation: 'background_upload_frames',
      attemptId,
    });
    return;
  }

  // Upload in background without blocking
  (async () => {
    try {
      const batchSize = 10;
      const totalBatches = Math.ceil(framesToUpload.length / batchSize);

      proctorLogger.info('Starting background frame upload', {
        operation: 'background_upload_start',
        attemptId,
        totalFrames: framesToUpload.length,
        totalBatches,
      });

      for (let i = 0; i < totalBatches; i++) {
        const batchFrames = framesToUpload.slice(
          i * batchSize,
          (i + 1) * batchSize
        );

        const formData = new FormData();
        formData.append('attemptId', attemptId);
        formData.append('batchIndex', i.toString());
        formData.append('totalBatches', totalBatches.toString());

        batchFrames.forEach((frame, index) => {
          const globalFrameIndex = startIndex + i * batchSize + index;
          formData.append(
            `frame_${globalFrameIndex}`,
            frame,
            `frame_${globalFrameIndex}.jpg`
          );
        });

        const response = await fetchWithCSRF('/api/proctor/upload-frames', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to upload batch ${i + 1}: ${response.statusText}`
          );
        }

        proctorLogger.info(
          `Background upload batch ${i + 1}/${totalBatches} completed`,
          {
            operation: 'background_upload_batch',
            attemptId,
            batchIndex: i + 1,
            totalBatches,
          }
        );
      }

      proctorLogger.info('Background frame upload completed successfully', {
        operation: 'background_upload_complete',
        attemptId,
        totalFrames: framesToUpload.length,
      });
    } catch (error) {
      proctorLogger.error(
        'Background frame upload failed',
        {
          operation: 'background_upload_frames',
          attemptId,
          totalFrames: framesToUpload.length,
        },
        error as Error
      );
      // Don't throw - this is background operation
    }
  })();
}

export function destroyRecording(session: RecordingSession): void {
  try {
    // PRIORITY FIX: Stop camera immediately and aggressively
    // Step 1: Stop recording flag first
    session.isRecording = false;

    // Step 2: Clear the frame capture interval immediately
    if (session.intervalId) {
      clearInterval(session.intervalId);
    }

    if (session.uploadIntervalId) {
      clearInterval(session.uploadIntervalId);
    }

    // Step 3: Stop all tracks in the media stream IMMEDIATELY
    if (session.stream) {
      const tracks = session.stream.getTracks();

      tracks.forEach((track) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });

      // Additional cleanup - remove all tracks from stream
      tracks.forEach((track) => {
        session.stream.removeTrack(track);
      });
    }

    // Step 4: Clear captured frames from memory (but keep copy for background upload)
    // Don't clear here since background upload needs them
    // session.capturedFrames.length = 0;

    proctorLogger.info('Recording session destroyed immediately', {
      operation: 'destroy_recording_immediate',
      streamWasActive: session.stream?.active || false,
      capturedFramesCount: session.capturedFrames.length,
    });
  } catch (error) {
    proctorLogger.error(
      'Failed to destroy recording session',
      {
        operation: 'destroy_recording',
        streamActive: session.stream?.active || false,
        capturedFramesCount: session.capturedFrames.length,
      },
      error as Error
    );
    throw error;
  }
}

function startContinuousFrameUpload(
  session: RecordingSession,
  attemptId: string
): number {
  const UPLOAD_INTERVAL_MS = 10_000;
  return window.setInterval(() => {
    if (!session.capturedFrames.length || session.isUploading) {
      return;
    }
    uploadPendingFrames(session, attemptId);
  }, UPLOAD_INTERVAL_MS);
}

function uploadPendingFrames(session: RecordingSession, attemptId: string) {
  const batchSize = 5;
  const framesToUpload = session.capturedFrames.splice(0, batchSize);

  if (framesToUpload.length === 0) {
    return;
  }

  session.isUploading = true;

  (async () => {
    try {
      const formData = new FormData();
      formData.append('attemptId', attemptId);
      formData.append('batchIndex', 'live');
      formData.append('totalBatches', 'live');

      framesToUpload.forEach((frame, index) => {
        const globalFrameIndex = session.uploadedFrameCount + index;
        formData.append(
          `frame_${globalFrameIndex}`,
          frame,
          `frame_${globalFrameIndex}.jpg`
        );
      });

      const response = await fetchWithCSRF('/api/proctor/upload-frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Live upload failed: ${response.statusText}`);
      }

      session.uploadedFrameCount += framesToUpload.length;
      proctorLogger.info('Live frame batch uploaded', {
        operation: 'live_upload_batch',
        attemptId,
        uploaded: framesToUpload.length,
        totalUploaded: session.uploadedFrameCount,
      });
    } catch (error) {
      proctorLogger.error(
        'Live frame upload failed',
        {
          operation: 'live_upload_batch',
          attemptId,
          pendingFrames: framesToUpload.length,
        },
        error as Error
      );
      // Requeue frames so they can be retried later
      session.capturedFrames.unshift(...framesToUpload);
    } finally {
      session.isUploading = false;
    }
  })();
}

export async function forceStopAllCameraAccess(): Promise<void> {
  try {
    // Get all media devices and stop any active streams
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Try to stop any active media streams by requesting and immediately stopping
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const tracks = stream.getTracks();

      tracks.forEach((track, index) => {
        track.stop();
      });
    } catch (err) {
      // This is expected if no camera access is currently active
    }

    // Final cleanup attempt - create a temporary stream just to immediately stop it
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1, height: 1 },
        audio: false,
      });

      testStream.getTracks().forEach((track) => {
        track.stop();
      });
    } catch (finalErr) {
      // Expected if camera is not available
    }
  } catch (error) {
    proctorLogger.error(
      'Error in forced camera cleanup',
      {
        operation: 'force_stop_camera',
        cleanup: true,
      },
      error as Error
    );
    throw error;
  }
}
