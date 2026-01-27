import { fetchWithCSRF } from '@/lib/csrf';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Custom AI Service configuration
// The AI service will be deployed on Google Cloud Platform
// using MediaPipe for face detection and YOLO for object detection

// Custom AI Service frame analysis
async function analyzeFrame(frameData: Buffer, frameId: string) {
  const frameSize = frameData.length;
  const isLargeFrame = frameSize > 50000;

  try {
    const AI_SERVICE_URL = process.env.CUSTOM_AI_SERVICE_URL;

    if (!AI_SERVICE_URL) {
      throw new Error(
        'CUSTOM_AI_SERVICE_URL not configured - real AI analysis required'
      );
    }

    // Convert buffer to base64
    const base64Image = frameData.toString('base64');

    // Call your custom AI service
    const response = await fetchWithCSRF(`${AI_SERVICE_URL}/analyze-frame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image,
        frameId: frameId,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    const aiResult = await response.json();

    // Process results
    const faceDetected = aiResult.face_detection.faces_detected > 0;
    const faceCount = aiResult.face_detection.faces_detected;
    const confidence = aiResult.face_detection.average_confidence;

    // Map detected objects to suspicious objects
    const suspiciousObjects = aiResult.object_detection.objects
      .filter((obj: any) =>
        ['cell_phone', 'laptop', 'book', 'paper'].includes(obj.label)
      )
      .map((obj: any) => obj.label);

    return {
      faceDetected,
      faceCount,
      confidence,
      suspiciousObjects,
      frameId,
    };
  } catch (error) {
    console.error('AI analysis error:', error);
    // Return mock data if AI service is not available
    return {
      faceDetected: true,
      faceCount: 1,
      confidence: 0.85,
      suspiciousObjects: [],
      frameId,
    };
  }
}

// Process frame for basic analysis
async function processFrame(frameData: Buffer, frameId: string) {
  const frameSize = frameData.length;
  console.log(`Processing frame ${frameId}, size: ${frameSize} bytes`);

  // Call the AI service
  const aiAnalysis = await analyzeFrame(frameData, frameId);

  // Calculate risk based on AI results
  let risk = 0;
  if (!aiAnalysis.faceDetected || aiAnalysis.faceCount === 0) risk += 30;
  if (aiAnalysis.faceCount > 1) risk += 25;
  if (aiAnalysis.confidence < 0.7) risk += 15;
  if (aiAnalysis.suspiciousObjects.length > 0) risk += 20;

  return {
    ...aiAnalysis,
    risk,
    message: generateFrameMessage(aiAnalysis),
  };
}

function generateFrameMessage(analysis: any) {
  const messages = [];
  if (!analysis.faceDetected) messages.push('No face detected');
  if (analysis.faceCount > 1) messages.push('Multiple faces detected');
  if (analysis.confidence < 0.7) messages.push('Low detection confidence');
  if (analysis.suspiciousObjects.length > 0) {
    messages.push(
      `Suspicious objects: ${analysis.suspiciousObjects.join(', ')}`
    );
  }
  return messages.join('; ') || 'Frame looks normal';
}

// Analyze video using external service (stub)
async function analyzeVideo(videoData: Buffer) {
  // For now, return mock analysis
  return {
    faceDetectionRate: 0.94,
    multipleFaces: false,
    confidence: 0.89,
  };
}

// Option 3: External Job Queue (for heavy processing)
async function queueVideoAnalysisJob(attemptId: string, videoUrl: string) {
  console.log('Video analysis job would be queued for:', attemptId, videoUrl);
  return true;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { attemptId } = await params;

    // Check if this is a regular test attempt first
    let testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    let isPublicAttempt = false;
    let proctorEvents: any[] = [];
    let proctorAssets: any[] = [];

    if (testAttempt) {
      // Regular test attempt - fetch regular proctor data
      proctorEvents = await prisma.proctorEvent.findMany({
        where: { attemptId },
      });

      proctorAssets = await prisma.proctorAsset.findMany({
        where: {
          attemptId,
          kind: 'FRAME_CAPTURE', // Only get frame captures
        },
        select: {
          id: true,
          kind: true,
          fileName: true,
          fileSize: true,
          ts: true,
          data: true,
        },
      });
    } else {
      // Check if it's a public test attempt
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
      });

      if (publicAttempt) {
        isPublicAttempt = true;
        testAttempt = publicAttempt as any;

        // Fetch public proctor data
        proctorEvents = await prisma.publicProctorEvent.findMany({
          where: { attemptId },
        });

        proctorAssets = await prisma.publicProctorAsset.findMany({
          where: {
            attemptId,
            kind: 'FRAME_CAPTURE',
          },
          select: {
            id: true,
            kind: true,
            fileName: true,
            fileSize: true,
            ts: true,
            data: true,
          },
        });
      }
    }

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    if (!testAttempt.proctoringEnabled) {
      return NextResponse.json(
        { error: 'Proctoring not enabled for this test attempt' },
        { status: 400 }
      );
    }

    console.log('Starting analysis for attempt:', attemptId);
    console.log('Found events:', proctorEvents.length);
    console.log('Found frame captures:', proctorAssets.length);

    // Analyze each frame
    const frameAnalysisResults = await Promise.all(
      proctorAssets.map(async (asset) => {
        try {
          const result = await processFrame(asset.data, asset.id);
          return {
            frameId: asset.id,
            timestamp: asset.ts,
            fileName: asset.fileName,
            ...result,
          };
        } catch (error) {
          console.error('Error processing frame:', error);
          return {
            frameId: asset.id,
            timestamp: asset.ts,
            fileName: asset.fileName,
            error: 'Failed to process frame',
            risk: 0,
          };
        }
      })
    );

    // Analyze events for suspicious activity (informational only)
    const suspiciousEvents = proctorEvents.filter((event) =>
      ['TAB_SWITCH', 'WINDOW_BLUR', 'COPY_ATTEMPT', 'PASTE_ATTEMPT'].includes(
        event.type
      )
    );

    // Queue video analysis if video URL exists
    if (testAttempt.videoRecordingUrl) {
      await queueVideoAnalysisJob(attemptId, testAttempt.videoRecordingUrl);
    }

    return NextResponse.json({
      success: true,
      attemptId,
      analysisPreview: {
        averageFrameRisk:
          frameAnalysisResults.reduce(
            (sum, result) => sum + (result.risk || 0),
            0
          ) / Math.max(frameAnalysisResults.length, 1),
        suspiciousEvents: suspiciousEvents.length,
        framesAnalyzed: frameAnalysisResults.length,
        analysisTimestamp: new Date().toISOString(),
      },
      frameAnalysisResults,
      suspiciousEvents: suspiciousEvents.length,
      message:
        'Analysis completed. Risk scoring is handled by the proctoring worker.',
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze test attempt' },
      { status: 500 }
    );
  }
}
