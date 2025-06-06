import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const attemptId = formData.get('attemptId') as string;
    const batchIndex = parseInt(formData.get('batchIndex') as string);
    const totalBatches = parseInt(formData.get('totalBatches') as string);

    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
    }

    console.log(
      `📸 Processing frame batch ${batchIndex + 1}/${totalBatches} for attempt ${attemptId}`
    );

    // Log all form data keys for debugging
    const allKeys = Array.from(formData.keys());
    console.log('📋 Form data keys:', allKeys);

    // Get all frame files from the form data
    const frameFiles: { index: number; file: any }[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('frame_')) {
        // Check if value is a file-like object
        const hasArrayBuffer =
          value &&
          typeof value === 'object' &&
          typeof (value as any).arrayBuffer === 'function';
        console.log(
          `🔍 Checking key: ${key}, value type: ${typeof value}, has arrayBuffer: ${hasArrayBuffer}`
        );

        if (hasArrayBuffer) {
          const frameIndex = parseInt(key.replace('frame_', ''));
          frameFiles.push({ index: frameIndex, file: value });
          console.log(`✅ Found frame file: ${key}, index: ${frameIndex}`);
        }
      }
    }

    if (frameFiles.length === 0) {
      return NextResponse.json(
        { error: 'No frame files found' },
        { status: 400 }
      );
    }

    // Sort frames by index to maintain order
    frameFiles.sort((a, b) => a.index - b.index);

    // Store each frame as a ProctorAsset
    const savedAssets = [];

    for (const { index, file } of frameFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());

      const asset = await prisma.proctorAsset.create({
        data: {
          attemptId,
          kind: 'FRAME_CAPTURE',
          fileName: `frame_${index.toString().padStart(4, '0')}.jpg`,
          mimeType: 'image/jpeg',
          fileSize: buffer.length,
          data: buffer,
          ts: new Date(),
        },
      });

      savedAssets.push(asset);
    }

    console.log(
      `✅ Saved ${savedAssets.length} frames for batch ${batchIndex + 1}/${totalBatches}`
    );

    // If this is the last batch, update the test attempt
    if (batchIndex === totalBatches - 1) {
      await prisma.testAttempt.update({
        where: { id: attemptId },
        data: {
          proctoringEndedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log(
        `✅ All ${totalBatches} frame batches uploaded successfully for attempt ${attemptId}`
      );
    }

    return NextResponse.json({
      success: true,
      batchIndex,
      frameCount: frameFiles.length,
      totalFrames: savedAssets.length,
      message: `Batch ${batchIndex + 1}/${totalBatches} uploaded successfully`,
    });
  } catch (error) {
    console.error('❌ Frame upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload frames' },
      { status: 500 }
    );
  }
}
