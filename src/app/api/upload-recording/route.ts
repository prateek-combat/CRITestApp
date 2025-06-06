import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads', 'recordings');
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `proctoring-${testAttemptId}-${timestamp}.webm`;
    const filepath = join(uploadsDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Update test attempt with video recording URL
    const relativePath = `/api/recordings/${filename}`;
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
