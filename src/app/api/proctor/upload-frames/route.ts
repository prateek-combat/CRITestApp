import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/proctor/upload-frames - Store captured frames
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const attemptId = formData.get('attemptId') as string;
    const files = formData.getAll('frames') as File[];

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No frames provided' },
        { status: 400 }
      );
    }

    // Check if this is a regular test attempt or public test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true },
    });

    const isPublicAttempt = !testAttempt;

    if (isPublicAttempt) {
      // Check if public test attempt exists
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: { id: true },
      });

      if (!publicAttempt) {
        return NextResponse.json(
          { error: 'Test attempt not found' },
          { status: 404 }
        );
      }
    }

    const uploadedFrames = [];

    // Process each frame
    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());

        const frameData = {
          attemptId,
          kind: 'FRAME_CAPTURE',
          fileName: file.name,
          mimeType: file.type,
          fileSize: buffer.length,
          data: buffer,
          ts: new Date(),
        };

        if (isPublicAttempt) {
          const asset = await prisma.publicProctorAsset.create({
            data: frameData,
          });
          uploadedFrames.push(asset.id);
        } else {
          const asset = await prisma.proctorAsset.create({
            data: frameData,
          });
          uploadedFrames.push(asset.id);
        }
      } catch (error) {
        console.error('Error processing frame:', error);
        // Continue with other frames even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      framesUploaded: uploadedFrames.length,
      frameIds: uploadedFrames,
    });
  } catch (error) {
    console.error('Error uploading frames:', error);
    return NextResponse.json(
      { error: 'Failed to upload frames' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
