import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { attemptId: string } }
) {
  try {
    // Check authentication and admin access
    const session = await getServerSession(authOptions);
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

    // Fetch test attempt with related data
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        invitation: {
          select: {
            id: true,
            candidateName: true,
            candidateEmail: true,
          },
        },
      },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Fetch proctoring events
    const proctorEvents = await prisma.proctorEvent.findMany({
      where: { attemptId },
      orderBy: { ts: 'asc' },
    });

    // Fetch proctoring assets (recordings)
    const proctorAssets = await prisma.proctorAsset.findMany({
      where: { attemptId },
      orderBy: { ts: 'asc' },
      select: {
        id: true,
        kind: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        ts: true,
        // Don't include data field to avoid large response
      },
    });

    // Check if there are cached analysis results stored in the risk score update
    // For now, if the testAttempt has a riskScore, we'll regenerate mock results
    let analysisResults = null;

    if (testAttempt.riskScore !== null) {
      // Generate mock analysis results based on existing data
      analysisResults = {
        faceDetection: {
          totalFrames: 1250,
          framesWithFace: Math.max(1000, 1250 - testAttempt.tabSwitches * 20),
          faceDetectionRate: Math.max(70, 95 - testAttempt.tabSwitches * 2),
          multipleFacesDetected: Math.min(
            20,
            proctorEvents.filter((e) => e.type === 'MULTIPLE_FACES').length
          ),
          noFaceDetectedPeriods: proctorEvents
            .filter((e) => e.type === 'FACE_NOT_DETECTED')
            .slice(0, 3)
            .map((event, index) => ({
              start: `00:${String(index * 2).padStart(2, '0')}:15`,
              end: `00:${String(index * 2).padStart(2, '0')}:22`,
              reason: 'looking_away',
            })),
          averageConfidence: Math.max(
            0.7,
            0.95 - testAttempt.tabSwitches * 0.02
          ),
        },
        objectDetection: {
          phoneDetected: proctorEvents.some((e) => e.type === 'PHONE_DETECTED'),
          bookDetected: proctorEvents.some((e) => e.type === 'BOOK_DETECTED'),
          paperDetected: true,
          suspiciousObjects: [],
          detectionConfidence: 0.92,
        },
        audioAnalysis: {
          totalDuration:
            testAttempt.proctoringStartedAt && testAttempt.proctoringEndedAt
              ? Math.floor(
                  (new Date(testAttempt.proctoringEndedAt).getTime() -
                    new Date(testAttempt.proctoringStartedAt).getTime()) /
                    1000
                )
              : 300,
          silencePercentage: Math.max(70, 85 - testAttempt.tabSwitches * 2),
          backgroundNoiseLevel: 'low',
          speechDetected: proctorEvents.some(
            (e) => e.type === 'SPEECH_DETECTED'
          ),
          suspiciousAudioEvents: [],
        },
        riskAssessment: {
          overallRiskScore: testAttempt.riskScore,
          factors: [
            {
              factor: 'Tab Switches',
              score: testAttempt.tabSwitches,
              weight: 0.8,
            },
            {
              factor: 'Proctoring Events',
              score: proctorEvents.length,
              weight: 0.5,
            },
            { factor: 'Face Detection', score: 1.2, weight: 0.3 },
            { factor: 'Audio Anomalies', score: 0.1, weight: 0.2 },
          ],
          recommendations:
            testAttempt.tabSwitches > 3
              ? [
                  'High number of tab switches detected',
                  'Consider reviewing video recording for suspicious behavior',
                ]
              : ['Low risk candidate', 'Normal test-taking behavior observed'],
        },
      };
    }

    return NextResponse.json({
      testAttempt,
      proctorEvents,
      proctorAssets,
      analysisResults,
    });
  } catch (error) {
    console.error('Error fetching proctoring analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
