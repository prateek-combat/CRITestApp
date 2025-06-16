import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdminAuth } from '@/lib/auth-middleware';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authError = await requireAdminAuth(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);

    // Parse filters from query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const testIds = searchParams.get('testIds');
    const invitationType = searchParams.get('invitationType');
    const minCognitive = searchParams.get('minCognitive');
    const maxCognitive = searchParams.get('maxCognitive');

    // Build base query conditions
    const whereConditions: any = {
      status: 'COMPLETED',
      personalityScores: {
        not: null,
      },
    };

    // Apply date filter
    if (startDate && endDate) {
      whereConditions.completedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Apply test filter
    if (testIds) {
      whereConditions.testId = {
        in: testIds.split(','),
      };
    }

    // Apply invitation type filter
    if (invitationType && invitationType !== 'all') {
      if (invitationType === 'invitation') {
        whereConditions.invitationId = { not: null };
      } else if (invitationType === 'public') {
        whereConditions.invitationId = null;
      }
    }

    // Fetch test attempts with personality data
    const testAttempts = await prisma.testAttempt.findMany({
      where: whereConditions,
      include: {
        test: {
          include: {
            questions: {
              include: {
                personalityDimension: true,
              },
            },
          },
        },
      },
    });

    // Process the data
    const rawPersonalityData: Array<{
      dimensionCode: string;
      dimensionName: string;
      score: number;
      cognitiveScore: number;
      date: string;
      testId: string;
    }> = [];

    const dimensionMap = new Map<
      string,
      {
        name: string;
        scores: number[];
        testIds: Set<string>;
      }
    >();

    // Extract personality data
    testAttempts.forEach((attempt: any) => {
      if (attempt.personalityScores) {
        const personalityScores = attempt.personalityScores as Record<
          string,
          number
        >;
        const totalQuestions = attempt.test.questions.length;
        const cognitivePercentage =
          totalQuestions > 0
            ? ((attempt.rawScore || 0) / totalQuestions) * 100
            : 0;

        // Apply cognitive score filter if specified
        if (minCognitive && maxCognitive) {
          const min = parseFloat(minCognitive);
          const max = parseFloat(maxCognitive);
          if (cognitivePercentage < min || cognitivePercentage > max) {
            return; // Skip this attempt
          }
        }

        Object.entries(personalityScores).forEach(([dimensionCode, score]) => {
          const dimension = attempt.test.questions.find(
            (q: any) => q.personalityDimension?.code === dimensionCode
          )?.personalityDimension;

          if (dimension) {
            const dimensionName = dimension.name;

            rawPersonalityData.push({
              dimensionCode,
              dimensionName,
              score: Number(score),
              cognitiveScore: cognitivePercentage,
              date: attempt.completedAt?.toISOString().split('T')[0] || '',
              testId: attempt.testId,
            });

            if (!dimensionMap.has(dimensionCode)) {
              dimensionMap.set(dimensionCode, {
                name: dimensionName,
                scores: [],
                testIds: new Set(),
              });
            }

            const dimData = dimensionMap.get(dimensionCode)!;
            dimData.scores.push(Number(score));
            dimData.testIds.add(attempt.testId);
          }
        });
      }
    });

    // Calculate dimension analytics
    const dimensionAnalytics = Array.from(dimensionMap.entries())
      .map(([code, data]) => {
        const averageScore =
          data.scores.reduce((sum, score) => sum + score, 0) /
          data.scores.length;

        // Calculate distribution
        const distribution = [
          { scoreRange: '1.0-1.5', count: 0 },
          { scoreRange: '1.5-2.0', count: 0 },
          { scoreRange: '2.0-2.5', count: 0 },
          { scoreRange: '2.5-3.0', count: 0 },
          { scoreRange: '3.0-3.5', count: 0 },
          { scoreRange: '3.5-4.0', count: 0 },
          { scoreRange: '4.0-4.5', count: 0 },
          { scoreRange: '4.5-5.0', count: 0 },
        ];

        data.scores.forEach((score) => {
          if (score >= 1.0 && score < 1.5) distribution[0].count++;
          else if (score >= 1.5 && score < 2.0) distribution[1].count++;
          else if (score >= 2.0 && score < 2.5) distribution[2].count++;
          else if (score >= 2.5 && score < 3.0) distribution[3].count++;
          else if (score >= 3.0 && score < 3.5) distribution[4].count++;
          else if (score >= 3.5 && score < 4.0) distribution[5].count++;
          else if (score >= 4.0 && score < 4.5) distribution[6].count++;
          else if (score >= 4.5 && score <= 5.0) distribution[7].count++;
        });

        return {
          dimensionCode: code,
          dimensionName: data.name,
          averageScore,
          sampleCount: data.scores.length,
          distribution: distribution.map((d) => ({
            ...d,
            percentage: (d.count / data.scores.length) * 100,
          })),
          testCount: data.testIds.size,
        };
      })
      .sort((a, b) => b.sampleCount - a.sampleCount);

    // Calculate correlations (simplified)
    const correlationMatrix: Array<{
      dimension1: string;
      dimension2: string;
      correlation: number;
      sampleSize: number;
    }> = [];

    const dimensionCodes = Array.from(dimensionMap.keys());
    for (let i = 0; i < dimensionCodes.length; i++) {
      for (let j = i + 1; j < dimensionCodes.length; j++) {
        const dim1 = dimensionCodes[i];
        const dim2 = dimensionCodes[j];

        // Find matching scores from same attempts
        const pairs: Array<{ score1: number; score2: number }> = [];

        testAttempts.forEach((attempt: any) => {
          if (attempt.personalityScores) {
            const scores = attempt.personalityScores as Record<string, number>;
            if (scores[dim1] && scores[dim2]) {
              pairs.push({
                score1: Number(scores[dim1]),
                score2: Number(scores[dim2]),
              });
            }
          }
        });

        if (pairs.length > 5) {
          const correlation = calculatePearsonCorrelation(
            pairs.map((p) => p.score1),
            pairs.map((p) => p.score2)
          );

          correlationMatrix.push({
            dimension1: dim1,
            dimension2: dim2,
            correlation,
            sampleSize: pairs.length,
          });
        }
      }
    }

    // Calculate trends (monthly aggregation)
    const trendData: Array<{
      date: string;
      dimensionCode: string;
      averageScore: number;
      sampleCount: number;
    }> = [];

    const monthlyData = new Map<string, Map<string, number[]>>();

    rawPersonalityData.forEach((data) => {
      const monthKey = data.date.substring(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, new Map());
      }

      const monthData = monthlyData.get(monthKey)!;
      if (!monthData.has(data.dimensionCode)) {
        monthData.set(data.dimensionCode, []);
      }

      monthData.get(data.dimensionCode)!.push(data.score);
    });

    monthlyData.forEach((dimensionData, monthKey) => {
      dimensionData.forEach((scores, dimensionCode) => {
        const averageScore =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        trendData.push({
          date: monthKey,
          dimensionCode,
          averageScore,
          sampleCount: scores.length,
        });
      });
    });

    // Calculate cognitive comparison
    const cognitiveComparison: Array<{
      dimension: string;
      highCognitive: number;
      lowCognitive: number;
      difference: number;
    }> = [];

    const cognitiveThreshold = 70;

    dimensionCodes.forEach((dimensionCode) => {
      const highCognitiveScores = rawPersonalityData
        .filter(
          (data) =>
            data.dimensionCode === dimensionCode &&
            data.cognitiveScore >= cognitiveThreshold
        )
        .map((data) => data.score);

      const lowCognitiveScores = rawPersonalityData
        .filter(
          (data) =>
            data.dimensionCode === dimensionCode &&
            data.cognitiveScore < cognitiveThreshold
        )
        .map((data) => data.score);

      if (highCognitiveScores.length > 0 && lowCognitiveScores.length > 0) {
        const highAvg =
          highCognitiveScores.reduce((sum, score) => sum + score, 0) /
          highCognitiveScores.length;
        const lowAvg =
          lowCognitiveScores.reduce((sum, score) => sum + score, 0) /
          lowCognitiveScores.length;

        cognitiveComparison.push({
          dimension: dimensionMap.get(dimensionCode)?.name || dimensionCode,
          highCognitive: highAvg,
          lowCognitive: lowAvg,
          difference: highAvg - lowAvg,
        });
      }
    });

    // Summary statistics
    const uniqueTestIds = new Set(rawPersonalityData.map((d) => d.testId));
    const dates = rawPersonalityData.map((d) => d.date).filter((d) => d);

    return NextResponse.json({
      dimensionAnalytics,
      correlationMatrix,
      trendData: trendData.sort((a, b) => a.date.localeCompare(b.date)),
      cognitiveComparison: cognitiveComparison.sort(
        (a, b) => Math.abs(b.difference) - Math.abs(a.difference)
      ),
      dimensionPopularity: dimensionAnalytics.map((d) => ({
        dimension: d.dimensionName,
        testCount: d.testCount,
        sampleCount: d.sampleCount,
      })),
      summary: {
        totalAttempts: testAttempts.length,
        uniqueDimensions: dimensionAnalytics.length,
        uniqueTests: uniqueTestIds.size,
        dateRange: {
          start:
            dates.length > 0
              ? Math.min(...dates.map((d) => new Date(d).getTime()))
              : null,
          end:
            dates.length > 0
              ? Math.max(...dates.map((d) => new Date(d).getTime()))
              : null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching personality analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch personality analytics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to calculate Pearson correlation coefficient
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n !== y.length || n === 0) return 0;

  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const sumYY = y.reduce((sum, val) => sum + val * val, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}
