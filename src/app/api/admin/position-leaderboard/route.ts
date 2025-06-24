import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LeaderboardEntry {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobProfileId: string;
  jobProfileName: string;
  positionNames: string[];
  compositeScore: number;
  individualScores: Array<{
    testId: string;
    testTitle: string;
    score: number;
    weight: number;
    weightedScore: number;
  }>;
  completedTests: number;
  totalTests: number;
  completionRate: number;
  completedAt: string | null;
  status: string;
}

// GET /api/admin/position-leaderboard - Get position-based leaderboard
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('positionId');
    const jobProfileId = searchParams.get('jobProfileId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build the query conditions
    const whereConditions: any = {};

    if (jobProfileId) {
      whereConditions.jobProfileId = jobProfileId;
    } else if (positionId) {
      // Find job profiles associated with this position
      const jobProfiles = await prisma.jobProfile.findMany({
        where: {
          positions: {
            some: { id: positionId },
          },
        },
        select: { id: true },
      });

      if (jobProfiles.length > 0) {
        whereConditions.jobProfileId = {
          in: jobProfiles.map((jp) => jp.id),
        };
      } else {
        // No job profiles for this position, return empty
        return NextResponse.json([]);
      }
    }

    // Get all job profile invitations with their test attempts
    const jobProfileInvitations = await prisma.jobProfileInvitation.findMany({
      where: whereConditions,
      include: {
        jobProfile: {
          include: {
            positions: true,
            testWeights: {
              include: {
                test: true,
              },
            },
          },
        },
        testAttempts: {
          where: {
            status: 'COMPLETED',
          },
          include: {
            test: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    // Calculate composite scores and build leaderboard entries
    const leaderboardEntries: LeaderboardEntry[] = [];

    for (const invitation of jobProfileInvitations) {
      const jobProfile = invitation.jobProfile;
      const testWeights = jobProfile.testWeights;
      const completedAttempts = invitation.testAttempts;

      // Calculate individual test scores and weights
      const individualScores = testWeights.map((tw) => {
        const attempt = completedAttempts.find(
          (att) => att.testId === tw.testId
        );
        const score = attempt?.rawScore || 0;
        const weightedScore = score * tw.weight;

        return {
          testId: tw.testId,
          testTitle: tw.test.title,
          score,
          weight: tw.weight,
          weightedScore,
        };
      });

      // Calculate composite score
      const totalWeight = testWeights.reduce((sum, tw) => sum + tw.weight, 0);
      const totalWeightedScore = individualScores.reduce(
        (sum, is) => sum + is.weightedScore,
        0
      );
      const compositeScore =
        totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

      // Calculate completion stats
      const completedTests = completedAttempts.length;
      const totalTests = testWeights.length;
      const completionRate =
        totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

      // Get the latest completion date
      const completedAt =
        completedAttempts.length > 0
          ? completedAttempts
              .map((att) => att.completedAt)
              .filter((date) => date !== null)
              .sort(
                (a, b) => new Date(b!).getTime() - new Date(a!).getTime()
              )[0]
          : null;

      // Determine status
      let status = 'IN_PROGRESS';
      if (completedTests === totalTests) {
        status = 'COMPLETED';
      } else if (completedTests === 0) {
        status = 'PENDING';
      }

      leaderboardEntries.push({
        id: invitation.id,
        candidateName: invitation.candidateName || 'Unknown',
        candidateEmail: invitation.candidateEmail,
        jobProfileId: jobProfile.id,
        jobProfileName: jobProfile.name,
        positionNames: jobProfile.positions.map((p) => p.name),
        compositeScore: Math.round(compositeScore * 100) / 100, // Round to 2 decimal places
        individualScores,
        completedTests,
        totalTests,
        completionRate: Math.round(completionRate * 100) / 100,
        completedAt: completedAt?.toISOString() || null,
        status,
      });
    }

    // Sort by composite score (descending), then by completion rate
    leaderboardEntries.sort((a, b) => {
      if (a.compositeScore !== b.compositeScore) {
        return b.compositeScore - a.compositeScore;
      }
      return b.completionRate - a.completionRate;
    });

    return NextResponse.json(leaderboardEntries);
  } catch (error) {
    console.error('Error fetching position leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch position leaderboard' },
      { status: 500 }
    );
  }
}
