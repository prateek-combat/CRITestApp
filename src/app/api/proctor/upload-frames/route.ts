import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/proctor/upload-frames - Store captured frames
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const formData = await request.formData();
    const attemptId = formData.get('attemptId') as string;

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
        userId: true,
      },
    });

    const isPublicAttempt = !testAttempt;

    // For regular test attempts, verify the user owns this attempt
    if (testAttempt && testAttempt.userId !== session.user.id) {
      // Allow admins to upload frames for any attempt
      if (
        session.user.role !== 'ADMIN' &&
        session.user.role !== 'SUPER_ADMIN'
      ) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
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
        // Continue with other frames even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      framesUploaded: uploadedFrames.length,
      frameIds: uploadedFrames,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload frames' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
