import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const testAttemptId = formData.get('testAttemptId') as string;

    if (!file || !testAttemptId) {
      return NextResponse.json(
        { error: 'File and testAttemptId are required' },
        { status: 400 }
      );
    }

    // Try to find test attempt by ID first, then by invitation ID as fallback
    let testAttempt = await prisma.testAttempt.findUnique({
      where: { id: testAttemptId },
    });

    if (!testAttempt) {
      testAttempt = await prisma.testAttempt.findFirst({
        where: { invitationId: testAttemptId },
        orderBy: { startedAt: 'desc' },
      });
    }

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `proctoring-${testAttemptId}-${timestamp}.webm`;

    // Convert file to buffer and save to database
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store file in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        fileName: filename,
        mimeType: file.type,
        fileSize: buffer.length,
        data: buffer,
        fileType: 'RECORDING',
      },
    });

    // Update test attempt with video recording URL
    const relativePath = `/api/files/${uploadedFile.id}`;
    await prisma.testAttempt.update({
      where: { id: testAttempt.id },
      data: {
        videoRecordingUrl: relativePath,
      },
    });

    return NextResponse.json({
      success: true,
      filename,
      url: relativePath,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
