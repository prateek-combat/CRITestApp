import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
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

    const { assetId } = await params;

    // Get the video data from database
    const proctorAsset = await prisma.proctorAsset.findUnique({
      where: { id: assetId },
      select: {
        data: true,
        mimeType: true,
        fileName: true,
        fileSize: true,
      },
    });

    if (!proctorAsset) {
      return new NextResponse('Recording not found', { status: 404 });
    }

    // Return the video with appropriate headers
    return new NextResponse(proctorAsset.data, {
      headers: {
        'Content-Type': proctorAsset.mimeType,
        'Content-Length': proctorAsset.fileSize.toString(),
        'Content-Disposition': `inline; filename="${proctorAsset.fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    console.error('Error serving recording:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
