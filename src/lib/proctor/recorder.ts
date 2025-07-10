import { proctorLogger } from '../logger';
import { useState, useRef, useCallback, useEffect } from 'react';
import { DISABLE_PROCTORING_REQUIREMENTS } from '../constants';

export interface RecordingSession {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  intervalId: number;
  capturedFrames: Blob[];
  isRecording: boolean;
}

export function useProctoring(attemptId: string) {
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = useCallback(async () => {
    // If proctoring is disabled, do nothing
    if (DISABLE_PROCTORING_REQUIREMENTS) {
      proctorLogger.info('Proctoring disabled - skipping recording', {
        attemptId,
      });
      setIsRecording(false);
      return;
    }

    try {
      const recordingSession = await startRecording();
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
        uploadFramesInBackground(session, attemptId);
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
    // Add a small delay to ensure any previous camera access has been released
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Request camera and microphone permissions with lower requirements for efficiency
    // Try with reduced constraints first for better compatibility
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 }, // Reduced resolution
          height: { ideal: 480 }, // Reduced resolution
          frameRate: { ideal: 15 }, // Lower frame rate since we'll capture manually
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 22050, // Reduced sample rate
        },
      });
    } catch (error) {
      // Fallback to even more basic constraints if the above fails
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

    // Small delay to ensure stream is fully ready
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Wait for video to be ready before starting capture with multiple fallback strategies
    await new Promise<void>((resolve, reject) => {
      let resolved = false;

      const resolveOnce = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      const rejectOnce = (error: Error) => {
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      };

      video.onloadedmetadata = () => {
        // Additional check to ensure video dimensions are available
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolveOnce();
        } else {
          // Wait a bit more for dimensions to be available
          setTimeout(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              resolveOnce();
            } else {
              // Final fallback - proceed even without dimensions if we have a stream
              proctorLogger.warn(
                'Video dimensions not available, proceeding anyway',
                {
                  operation: 'video_fallback',
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  videoReady: video.readyState,
                }
              );
              resolveOnce();
            }
          }, 1000);
        }
      };

      video.oncanplay = () => {
        // Alternative event that might fire when loadedmetadata doesn't
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolveOnce();
        }
      };

      video.onerror = (error) => {
        proctorLogger.error(
          'Video error during metadata load',
          {
            operation: 'video_metadata_load',
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          },
          error instanceof Error
            ? error
            : new Error('Video metadata load failed')
        );
        rejectOnce(new Error('Video failed to load metadata'));
      };

      // Add timeout to prevent hanging - increased timeout for slower systems
      setTimeout(() => {
        rejectOnce(new Error('Video metadata load timeout'));
      }, 20000);

      // Immediate check in case video is already ready
      if (
        video.readyState >= 1 &&
        video.videoWidth > 0 &&
        video.videoHeight > 0
      ) {
        resolveOnce();
      }
    });

    await video.play();

    const capturedFrames: Blob[] = [];
    let isRecording = true;
    let frameCount = 0;

    // Capture frames at 2 FPS (every 500ms) for analysis
    const intervalId = window.setInterval(() => {
      frameCount++;

      if (!isRecording) {
        return;
      }

      // More lenient check - proceed even if video dimensions are not ideal
      if (video.videoWidth === 0 && frameCount < 10) {
        // Give it a few attempts before giving up
        return;
      }

      try {
        // Use actual video dimensions or fallback to canvas dimensions
        const drawWidth = video.videoWidth || canvas.width;
        const drawHeight = video.videoHeight || canvas.height;

        // Draw current video frame to canvas
        context.drawImage(
          video,
          0,
          0,
          drawWidth,
          drawHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Convert canvas to blob (JPEG for smaller file size)
        canvas.toBlob(
          (blob) => {
            if (blob && capturedFrames.length < 600) {
              // Limit to ~5 minutes at 2 FPS
              capturedFrames.push(blob);
            } else if (!blob) {
              proctorLogger.error('Failed to create blob from canvas', {
                operation: 'canvas_to_blob',
                frameCount,
                capturedFramesCount: capturedFrames.length,
              });
            }
          },
          'image/jpeg',
          0.8
        ); // 80% quality for balance between size and quality
      } catch (error) {
        proctorLogger.error(
          'Error capturing frame',
          {
            operation: 'frame_capture',
            frameCount,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            videoReadyState: video.readyState,
          },
          error as Error
        );

        // If we consistently fail to capture frames, log a warning but continue
        if (frameCount % 20 === 0) {
          // Every 10 seconds
          proctorLogger.warn('Persistent frame capture issues', {
            operation: 'frame_capture_persistent_error',
            frameCount,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
          });
        }
      }
    }, 500); // Capture every 500ms (2 FPS)

    return {
      stream,
      canvas,
      context,
      intervalId,
      capturedFrames,
      isRecording: true,
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

      const response = await fetch('/api/proctor/upload-frames', {
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
  attemptId: string
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
          const globalFrameIndex = i * batchSize + index;
          formData.append(
            `frame_${globalFrameIndex}`,
            frame,
            `frame_${globalFrameIndex}.jpg`
          );
        });

        const response = await fetch('/api/proctor/upload-frames', {
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
