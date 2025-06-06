import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const attemptId = formData.get('attemptId') as string;

    if (!file || !attemptId) {
      return NextResponse.json(
        { error: 'File and attemptId are required' },
        { status: 400 }
      );
    }

    // Verify that the test attempt exists
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Convert file to buffer for database storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate filename
    const timestamp = Date.now();
    const filename = `proctoring-${attemptId}-${timestamp}.webm`;

    // Create ProctorAsset record with video data
    const proctorAsset = await prisma.proctorAsset.create({
      data: {
        attemptId,
        kind: 'VIDEO_FULL',
        fileName: filename,
        mimeType: file.type,
        fileSize: buffer.length,
        data: buffer,
      },
    });

    // Update TestAttempt with video recording reference (backward compatibility)
    await prisma.testAttempt.update({
      where: { id: attemptId },
      data: {
        videoRecordingUrl: `/api/recordings/database/${proctorAsset.id}`,
        proctoringEndedAt: new Date(),
      },
    });

    // Enqueue analysis job
    try {
      const { enqueueProctorAnalysis } = await import('@/lib/queue');

      await enqueueProctorAnalysis({
        assetId: proctorAsset.id,
        attemptId,
        databaseStored: true, // Flag to indicate it's in database, not S3
      });

      console.log('✅ Analysis job enqueued for asset:', proctorAsset.id);
    } catch (queueError) {
      console.warn('⚠️ Failed to enqueue analysis job:', queueError);
      // Don't fail the upload if queue is not available
    }

    return NextResponse.json({
      success: true,
      assetId: proctorAsset.id,
      url: `/api/recordings/database/${proctorAsset.id}`,
      filename,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
