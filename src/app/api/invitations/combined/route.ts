import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Fetch regular invitations with test attempts
    const invitations = await prisma.invitation.findMany({
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        testAttempt: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            rawScore: true,
            percentile: true,
            videoRecordingUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Fetch public test attempts
    const publicAttempts = await prisma.publicTestAttempt.findMany({
      include: {
        publicLink: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform regular invitations to unified format
    const transformedInvitations = invitations.map((inv) => ({
      id: inv.id,
      type: 'invitation' as const,
      email: inv.candidateEmail || 'No email',
      candidateName: inv.candidateName,
      status: inv.status,
      createdAt: inv.createdAt.toISOString(),
      completedAt:
        inv.testAttempt?.completedAt?.toISOString() ||
        inv.updatedAt.toISOString(),
      test: inv.test,
      testAttempt: inv.testAttempt
        ? {
            id: inv.testAttempt.id,
            status: inv.testAttempt.status,
            completedAt: inv.testAttempt.completedAt?.toISOString(),
            rawScore: inv.testAttempt.rawScore,
            percentile: inv.testAttempt.percentile,
            videoRecordingUrl: inv.testAttempt.videoRecordingUrl,
          }
        : null,
      publicLinkTitle: null,
    }));

    // Transform public attempts to unified format
    const transformedPublicAttempts = publicAttempts.map((attempt) => ({
      id: attempt.id,
      type: 'public' as const,
      email: attempt.candidateEmail,
      candidateName: attempt.candidateName,
      status:
        attempt.status === 'COMPLETED'
          ? 'COMPLETED'
          : attempt.status === 'IN_PROGRESS'
            ? 'OPENED'
            : 'PENDING',
      createdAt: attempt.createdAt.toISOString(),
      completedAt:
        attempt.completedAt?.toISOString() || attempt.updatedAt.toISOString(),
      test: attempt.publicLink.test,
      testAttempt: {
        id: attempt.id,
        status: attempt.status,
        completedAt: attempt.completedAt?.toISOString(),
        rawScore: attempt.rawScore,
        percentile: attempt.percentile,
        videoRecordingUrl: attempt.videoRecordingUrl,
      },
      publicLinkTitle: attempt.publicLink.title,
    }));

    // Combine and sort by creation date (most recent first)
    const combinedData = [
      ...transformedInvitations,
      ...transformedPublicAttempts,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(combinedData);
  } catch (error) {
    console.error('Error fetching combined invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations and public attempts' },
      { status: 500 }
    );
  }
}
