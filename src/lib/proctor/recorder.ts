import { proctorLogger } from '../logger';
import { useState, useRef, useCallback, useEffect } from 'react';

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
    try {
      const recordingSession = await startRecording();
      setSession(recordingSession);
      setIsRecording(true);
      if (videoRef.current) {
        videoRef.current.srcObject = recordingSession.stream;
      }
    } catch (error) {
      proctorLogger.error(
        'Failed to start proctoring session',
        { attemptId },
        error as Error
      );
      // Optionally, set an error state to show in the UI
    }
  }, [attemptId]);

  const stop = useCallback(async () => {
    if (session) {
      try {
        await stopAndUpload(session, attemptId);
        destroyRecording(session);
        setSession(null);
        setIsRecording(false);
      } catch (error) {
        proctorLogger.error(
          'Failed to stop and upload proctoring session',
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
    // Request camera and microphone permissions with lower requirements for efficiency
    const stream = await navigator.mediaDevices.getUserMedia({
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

    // Wait for video to be ready before starting capture
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
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
        reject(new Error('Video failed to load metadata'));
      };
      // Add timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Video metadata load timeout'));
      }, 10000);
    });

    await video.play();

    const capturedFrames: Blob[] = [];
    let isRecording = true;
    let frameCount = 0;

    // Capture frames at 2 FPS (every 500ms) for analysis
    const intervalId = window.setInterval(() => {
      frameCount++;

      if (!isRecording || video.videoWidth === 0) {
        return;
      }

      try {
        // Draw current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

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
          },
          error as Error
        );
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

export function destroyRecording(session: RecordingSession): void {
  try {
    // Stop recording flag
    session.isRecording = false;

    // Clear the frame capture interval
    if (session.intervalId) {
      clearInterval(session.intervalId);
    }

    // Stop all tracks in the media stream
    if (session.stream) {
      const tracks = session.stream.getTracks();

      tracks.forEach((track, index) => {
        if (track.readyState === 'live') {
          track.stop();
        }
      });
    }

    // Clear captured frames from memory
    session.capturedFrames.length = 0;
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
