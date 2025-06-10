interface RecordingSession {
  stream: MediaStream;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  intervalId: number;
  capturedFrames: Blob[];
  isRecording: boolean;
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
    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        console.log(
          '🎥 Video metadata loaded, dimensions:',
          video.videoWidth,
          'x',
          video.videoHeight
        );
        resolve();
      };
    });

    video.play();

    const capturedFrames: Blob[] = [];
    let isRecording = true;

    // Capture frames at 2 FPS (every 500ms) for analysis
    const intervalId = window.setInterval(() => {
      if (!isRecording) {
        console.log('🎥 Skipping frame capture - not recording');
        return;
      }
      if (video.videoWidth === 0) {
        console.log(
          '🎥 Skipping frame capture - video not ready, width:',
          video.videoWidth
        );
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
              console.log(
                `📸 Captured frame ${capturedFrames.length}, size: ${blob.size} bytes`
              );
            } else if (!blob) {
              console.warn('⚠️ Failed to create blob from canvas');
            } else if (capturedFrames.length >= 600) {
              console.warn('⚠️ Frame limit reached (600 frames)');
            }
          },
          'image/jpeg',
          0.8
        ); // 80% quality for balance between size and quality
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }, 500); // Capture every 500ms (2 FPS)

    console.log('✅ Frame-based recording started successfully (2 FPS)');

    return {
      stream,
      canvas,
      context,
      intervalId,
      capturedFrames,
      isRecording: true,
    };
  } catch (error) {
    console.error('❌ Failed to start recording:', error);
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

    console.log(
      `🎥 stopAndUpload called - captured frames: ${session.capturedFrames.length}`
    );

    if (session.capturedFrames.length === 0) {
      console.warn('⚠️ No frames captured to upload');
      return;
    }

    console.log(
      `🎥 Uploading ${session.capturedFrames.length} captured frames...`
    );

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
        const frameIndex = i * batchSize + index;
        formData.append(
          `frame_${frameIndex}`,
          frame,
          `frame_${frameIndex}.jpg`
        );
      });

      // Upload batch to server
      const response = await fetch('/api/proctor/upload-frames', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Frame upload failed for batch ${i}: ${errorText}`);
      }

      console.log(`✅ Uploaded batch ${i + 1}/${totalBatches}`);
    }

    console.log('✅ All frames uploaded successfully');
  } catch (error) {
    console.error('❌ Frame upload failed:', error);
    throw error;
  }
}

export function destroyRecording(session: RecordingSession): void {
  try {
    console.log('🎥 Destroying recording session...');

    // Stop frame capture immediately
    session.isRecording = false;
    if (session.intervalId) {
      clearInterval(session.intervalId);
      console.log('🎥 Cleared frame capture interval');
    }

    // Stop all media tracks immediately
    if (session.stream) {
      const tracks = session.stream.getTracks();
      console.log(`🎥 Found ${tracks.length} tracks to stop`);

      tracks.forEach((track, index) => {
        console.log(
          `🎥 Track ${index}: ${track.kind}, state: ${track.readyState}, enabled: ${track.enabled}`
        );

        if (track.readyState !== 'ended') {
          track.stop();
          console.log(
            `🎥 Stopped track ${index} (${track.kind}), new state: ${track.readyState}`
          );
        } else {
          console.log(`🎥 Track ${index} (${track.kind}) already ended`);
        }
      });

      // Wait a moment and verify tracks are stopped
      setTimeout(() => {
        tracks.forEach((track, index) => {
          console.log(
            `🎥 Verification - Track ${index} (${track.kind}): ${track.readyState}`
          );
        });
      }, 100);
    } else {
      console.log('🎥 No stream found to destroy');
    }

    // Clear captured frames from memory
    session.capturedFrames.length = 0;
    console.log('🎥 Cleared captured frames from memory');

    console.log('✅ Recording session destroyed completely');
  } catch (error) {
    console.error('❌ Failed to destroy recording session:', error);
  }
}
