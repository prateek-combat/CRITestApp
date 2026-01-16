import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/proctor/upload-frames - Store captured frames
export async function POST(request: NextRequest) {
  try {
    // Authentication is optional for public test attempts
    const session = await auth();
    const formData = await request.formData();
    const attemptId = formData.get('attemptId') as string;
    const assetKindInput = (formData.get('assetKind') as string)?.toUpperCase();
    const assetKind =
      assetKindInput === 'SCREENSHOT' ? 'SCREENSHOT' : 'FRAME_CAPTURE';

    if (!attemptId) {
      return NextResponse.json(
        { error: 'attemptId is required' },
        { status: 400 }
      );
    }

    // Get all frame files - they are sent as frame_0, frame_1, etc.
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('frame_') && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No frames provided' },
        { status: 400 }
      );
    }

    // Check if this is a regular test attempt or public test attempt
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
      },
    });

    const isPublicAttempt = !testAttempt;

    // For regular test attempts, require authentication
    if (!isPublicAttempt && !session) {
      return NextResponse.json(
        { error: 'Authentication required for regular tests' },
        { status: 401 }
      );
    }

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
          kind: assetKind,
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
        // Continue with other frames even if one fails
        console.error('Failed to process frame:', error);
      }
    }

    return NextResponse.json({
      success: true,
      framesUploaded: uploadedFrames.length,
      frameIds: uploadedFrames,
    });
  } catch (error) {
    console.error('Upload frames error:', error);
    return NextResponse.json(
      { error: 'Failed to upload frames' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
