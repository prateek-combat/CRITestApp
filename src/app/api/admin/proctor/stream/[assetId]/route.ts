import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
) {
  try {
    // Check authentication and admin access
    const session = await auth();
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

    const { assetId } = await params;

    // Try to fetch from regular proctor assets first
    let asset = await prisma.proctorAsset.findUnique({
      where: { id: assetId },
    });

    // If not found, try public proctor assets
    if (!asset) {
      asset = await prisma.publicProctorAsset.findUnique({
        where: { id: assetId },
      });
    }

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Return the video data with appropriate headers for streaming
    return new NextResponse(asset.data, {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Length': asset.fileSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error streaming asset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
