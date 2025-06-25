import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;

    // Try to fetch from regular test attempts first
    let testAttempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        status: true,
        rawScore: true,
        percentile: true,
        completedAt: true,
        createdAt: true,
        test: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        invitation: {
          select: {
            candidateName: true,
            candidateEmail: true,
          },
        },
      },
    });

    let isPublicAttempt = false;

    // If not found in regular attempts, try public attempts
    if (!testAttempt) {
      const publicAttempt = await prisma.publicTestAttempt.findUnique({
        where: { id: attemptId },
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          status: true,
          rawScore: true,
          percentile: true,
          completedAt: true,
          startedAt: true,
          publicLink: {
            select: {
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
      });

      if (publicAttempt) {
        isPublicAttempt = true;
        // Restructure public attempt to match regular attempt format
        testAttempt = {
          id: publicAttempt.id,
          candidateName: publicAttempt.candidateName,
          candidateEmail: publicAttempt.candidateEmail,
          status: publicAttempt.status,
          rawScore: publicAttempt.rawScore,
          percentile: publicAttempt.percentile,
          completedAt: publicAttempt.completedAt,
          createdAt: publicAttempt.startedAt,
          test: publicAttempt.publicLink.test,
          invitation: {
            candidateName: publicAttempt.candidateName,
            candidateEmail: publicAttempt.candidateEmail,
          },
        } as any;
      }
    }

    if (!testAttempt) {
      return NextResponse.json(
        { error: 'Test attempt not found' },
        { status: 404 }
      );
    }

    // Only return basic information for public access
    const response = {
      id: testAttempt.id,
      candidateName:
        testAttempt.candidateName ||
        testAttempt.invitation?.candidateName ||
        'Unknown',
      candidateEmail:
        testAttempt.candidateEmail ||
        testAttempt.invitation?.candidateEmail ||
        'Unknown',
      status: testAttempt.status,
      rawScore: testAttempt.rawScore,
      percentile: testAttempt.percentile,
      completedAt: testAttempt.completedAt,
      createdAt: testAttempt.createdAt,
      isPublicAttempt,
      test: {
        id: testAttempt.test.id,
        title: testAttempt.test.title,
        description: testAttempt.test.description,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
