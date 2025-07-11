import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/job-profile-invitations/[id] - Get a specific job profile invitation (public endpoint)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the job profile invitation
    const invitation = await prisma.jobProfileInvitation.findUnique({
      where: { id },
      include: {
        jobProfile: {
          include: {
            positions: true,
            testWeights: {
              include: {
                test: {
                  select: {
                    id: true,
                    title: true,
                    description: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is expired
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 410 }
      );
    }

    // Check if invitation is still valid (not completed or cancelled)
    if (
      invitation.status === 'COMPLETED' ||
      invitation.status === 'CANCELLED'
    ) {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 410 }
      );
    }

    // Update status to OPENED if it's the first time being accessed
    if (invitation.status === 'SENT' || invitation.status === 'PENDING') {
      await prisma.jobProfileInvitation.update({
        where: { id },
        data: { status: 'OPENED' },
      });
    }

    // Transform the response to match the expected format
    const response = {
      id: invitation.id,
      candidateEmail: invitation.candidateEmail,
      candidateName: invitation.candidateName,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      jobProfile: {
        id: invitation.jobProfile.id,
        name: invitation.jobProfile.name,
        description: invitation.jobProfile.description,
        positions: invitation.jobProfile.positions.map((position: any) => ({
          id: position.id,
          name: position.name,
          department: position.department,
        })),
        tests: invitation.jobProfile.testWeights.map((testWeight: any) => ({
          id: testWeight.test.id,
          title: testWeight.test.title,
          description: testWeight.test.description,
          weight: testWeight.weight,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching job profile invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 }
    );
  }
}
