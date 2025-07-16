import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await auth();
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find the uploaded file in the database with related data
    const uploadedFile = await prisma.uploadedFile.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        data: true,
        uploadedBy: true,
        question: {
          select: {
            id: true,
            test: {
              select: {
                id: true,
                createdBy: true,
              },
            },
          },
        },
      },
    });

    if (!uploadedFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check authorization
    const isAdmin =
      session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const isOwner = uploadedFile.uploadedBy === session.user.id;
    const isTestCreator =
      uploadedFile.question?.test?.createdBy === session.user.id;

    // Allow access if:
    // 1. User is an admin
    // 2. User uploaded the file
    // 3. User created the test that contains this file
    // 4. User is taking a test that contains this file (handled by test attempt check below)
    if (!isAdmin && !isOwner && !isTestCreator) {
      // Check if user has an active test attempt for a test containing this file
      const hasActiveAttempt = await prisma.testAttempt.findFirst({
        where: {
          userId: session.user.id,
          test: {
            questions: {
              some: {
                files: {
                  some: {
                    id: uploadedFile.id,
                  },
                },
              },
            },
          },
          status: {
            in: ['NOT_STARTED', 'IN_PROGRESS'],
          },
        },
      });

      if (!hasActiveAttempt) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Set security headers
    const headers = new Headers({
      'Content-Type': uploadedFile.mimeType,
      'Content-Length': uploadedFile.fileSize.toString(),
      'Content-Disposition': `inline; filename="${uploadedFile.fileName}"`,
      'Cache-Control': 'private, max-age=3600', // Cache for 1 hour, private
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    });

    // Return the file with appropriate headers
    return new NextResponse(uploadedFile.data, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('File serving error:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
