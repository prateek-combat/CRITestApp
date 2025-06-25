import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the uploaded file in the database
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        data: true,
      },
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Return the file with appropriate headers
    return new NextResponse(uploadedFile.data, {
      status: 200,
      headers: {
        'Content-Type': uploadedFile.mimeType,
        'Content-Length': uploadedFile.fileSize.toString(),
        'Content-Disposition': `inline; filename="${uploadedFile.fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
