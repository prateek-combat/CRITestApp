import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    // Check if user is authenticated and has access
    const session = await auth();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Only allow admin users or super admins to view recordings
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { filename } = await params;
    const filepath = join(process.cwd(), 'uploads', 'recordings', filename);

    // Read the video file
    const buffer = await readFile(filepath);

    // Return the video with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/webm',
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error serving recording:', error);
    return new NextResponse('Recording not found', { status: 404 });
  }
}
