import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CategoryWeightService } from '@/lib/categoryWeightService';
import {
  calculateWeightedComposite,
  calculateUnweightedComposite,
  CategoryWeights,
} from '@/types/categories';

export const revalidate = 0; // Disable caching for this route

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const positionId = searchParams.get('positionId');
    const positionIds = searchParams
      .get('positionIds')
      ?.split(',')
      .filter(Boolean);

    // Support both single test and position-based filtering
    if (!testId && !positionId && !positionIds) {
      return NextResponse.json(
        { error: 'testId, positionId, or positionIds is required' },
        { status: 400 }
      );
    }

    // Vercel's edge runtime might not have this, provide a fallback.
    const timezone = searchParams.get('timezone') || 'UTC';

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || '10'),
      100
    );
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'composite';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invitationId = searchParams.get('invitationId');

    // NEW: Weight profile parameter for configurable scoring
    const weightProfileId = searchParams.get('weightProfile');
    const customWeightsParam = searchParams.get('customWeights');

    // Build where clauses for both regular and public attempts
    const baseWhere: any = {
      status: 'COMPLETED',
    };

    if (search) {
      baseWhere.OR = [
        { candidateEmail: { contains: search, mode: 'insensitive' } },
        { candidateName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (dateFrom || dateTo) {
      baseWhere.completedAt = {};
      if (dateFrom) baseWhere.completedAt.gte = new Date(dateFrom);
      if (dateTo) baseWhere.completedAt.lte = new Date(dateTo);
    }

    // Build test filtering conditions
    let testFilterCondition: any = {};

    if (testId) {
      // Single test filter
      testFilterCondition = { testId };
    } else if (positionId) {
      // Single position filter
      testFilterCondition = {
        test: { positionId },
      };
    } else if (positionIds && positionIds.length > 0) {
      // Multiple positions filter
      testFilterCondition = {
        test: { positionId: { in: positionIds } },
      };
    }

    // Regular test attempts where clause
    const regularWhere = {
      ...baseWhere,
      ...(testId ? { testId } : { test: testFilterCondition.test }),
    };
    if (invitationId) {
      regularWhere.invitationId = invitationId;
    }

    // Public test attempts where clause (need to join through publicLink)
    const publicWhere = {
      ...baseWhere,
      publicLink: testId ? { testId } : { test: testFilterCondition.test },
    };

    const orderBy: any = {
      [sortBy === 'composite' ? 'rawScore' : sortBy]: sortOrder,
    };

    // For calculated fields, we'll sort after fetching data
    const isCalculatedField = [
      'scoreLogical',
      'scoreVerbal',
      'scoreNumerical',
      'scoreAttention',
      'scoreOther',
      'rank',
    ].includes(sortBy);

    // Use default sorting for database fields, or no sorting for calculated fields
    const dbOrderBy = isCalculatedField ? { rawScore: 'desc' } : orderBy;

    // Fetch both regular and public attempts
    const [regularAttempts, publicAttempts] = await Promise.all([
      prisma.testAttempt.findMany({
        where: regularWhere,
        orderBy: dbOrderBy,
        select: {
          id: true,
          invitationId: true,
          candidateName: true,
          candidateEmail: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          percentile: true,
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: { select: { category: true } },
            },
          },
        },
      }),
      prisma.publicTestAttempt.findMany({
        where: publicWhere,
        orderBy: dbOrderBy,
        select: {
          id: true,
          candidateName: true,
          candidateEmail: true,
          completedAt: true,
          startedAt: true,
          rawScore: true,
          percentile: true,
          publicLink: {
            select: {
              title: true,
            },
          },
          submittedAnswers: {
            select: {
              isCorrect: true,
              question: { select: { category: true } },
            },
          },
        },
      }),
    ]);

    // Combine and normalize the data
    const allAttempts = [
      ...regularAttempts.map((attempt) => ({
        ...attempt,
        type: 'regular' as const,
        submittedAnswers: attempt.submittedAnswers,
      })),
      ...publicAttempts.map((attempt) => ({
        ...attempt,
        type: 'public' as const,
        invitationId: null, // Public attempts don't have invitations
        submittedAnswers: attempt.submittedAnswers,
      })),
    ];

    // Get total questions for the test(s) to calculate percentages
    const totalTestQuestions = testId
      ? await prisma.question.count({ where: { testId } })
      : await prisma.question.count({
          where: {
            test: positionId
              ? { positionId }
              : positionIds && positionIds.length > 0
                ? { positionId: { in: positionIds } }
                : undefined,
          },
        });

    // NEW: Get weight profile for configurable scoring
    let weightProfile = null;
    let weights: CategoryWeights = {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    }; // Default equal weights

    try {
      // Check for custom weights first
      if (customWeightsParam) {
        try {
          const customWeights = JSON.parse(customWeightsParam);
          // Validate the custom weights structure
          if (
            customWeights &&
            typeof customWeights === 'object' &&
            typeof customWeights.LOGICAL === 'number' &&
            typeof customWeights.VERBAL === 'number' &&
            typeof customWeights.NUMERICAL === 'number' &&
            typeof customWeights.ATTENTION_TO_DETAIL === 'number' &&
            typeof customWeights.OTHER === 'number'
          ) {
            weights = customWeights;
            weightProfile = {
              id: 'custom',
              name: 'Custom Weights',
              description: 'Custom weight configuration',
              weights: customWeights,
            };
          }
        } catch (parseError) {
          console.warn('Error parsing custom weights:', parseError);
          // Fall back to profile or default weights
        }
      }

      // If no custom weights or parsing failed, try weight profile
      if (!customWeightsParam || weightProfile?.id !== 'custom') {
        if (weightProfileId) {
          weightProfile =
            await CategoryWeightService.getProfileById(weightProfileId);
          if (weightProfile) {
            weights = weightProfile.weights;
          }
        } else {
          // Use default profile if no specific profile requested
          const defaultProfile =
            await CategoryWeightService.getDefaultProfile();
          if (defaultProfile) {
            weightProfile = defaultProfile;
            weights = defaultProfile.weights;
          }
        }
      }
    } catch (error) {
      console.warn(
        'Error fetching weight profile, using default weights:',
        error
      );
      // Continue with default weights
    }

    // Get total questions per category for the test (to handle skipped questions correctly)
    const categoryQuestionCounts = await prisma.question.groupBy({
      by: ['category'],
      where: { testId },
      _count: { id: true },
    });

    const totalQuestionsByCategory: Record<string, number> = {};
    categoryQuestionCounts.forEach((item) => {
      if (item.category) {
        totalQuestionsByCategory[item.category] = item._count.id;
      }
    });

    // Calculate scores for all attempts first
    const processedAttempts = allAttempts.map((attempt, index) => {
      const categoryScores: Record<
        string,
        { correct: number; total: number; percentage: number }
      > = {};

      // Initialize all categories with total questions from test
      Object.entries(totalQuestionsByCategory).forEach(([category, total]) => {
        categoryScores[category] = { correct: 0, total, percentage: 0 };
      });

      // Count correct answers for each category
      for (const answer of attempt.submittedAnswers) {
        const category = answer.question.category;
        if (!category || !categoryScores[category]) continue;

        if (answer.isCorrect) {
          categoryScores[category].correct++;
        }
      }

      // Calculate percentages based on total questions in test (not just answered)
      Object.keys(categoryScores).forEach((category) => {
        const score = categoryScores[category];
        score.percentage =
          score.total > 0 ? (score.correct / score.total) * 100 : 0;
      });

      // NEW: Calculate consistent category-based scores
      const categoryScoresForWeighting: Record<
        string,
        { correct: number; total: number }
      > = {};
      Object.entries(categoryScores).forEach(([category, score]) => {
        categoryScoresForWeighting[category] = {
          correct: score.correct,
          total: score.total,
        };
      });

      // Calculate weighted composite score using configurable weights
      const weightedComposite = calculateWeightedComposite(
        categoryScoresForWeighting,
        weights
      );

      // Calculate unweighted composite using equal weights (for consistent comparison)
      const unweightedComposite = calculateUnweightedComposite(
        categoryScoresForWeighting
      );

      return {
        ...attempt,
        scoreLogical: categoryScores['LOGICAL']?.percentage || 0,
        scoreVerbal: categoryScores['VERBAL']?.percentage || 0,
        scoreNumerical: categoryScores['NUMERICAL']?.percentage || 0,
        scoreAttention: categoryScores['ATTENTION_TO_DETAIL']?.percentage || 0,
        scoreOther: categoryScores['OTHER']?.percentage || 0,
        composite: weightedComposite, // Use weighted composite score
        compositeUnweighted: unweightedComposite, // Use consistent category-based unweighted score
        percentile: 0, // Will be calculated after we have all scores
      };
    });

    // Calculate percentiles based on composite scores
    // Sort by composite score to determine rankings
    const sortedByScore = [...processedAttempts].sort(
      (a, b) => b.composite - a.composite
    );

    // Calculate percentile for each attempt
    processedAttempts.forEach((attempt) => {
      // Find how many candidates scored lower than this candidate
      const candidatesWithLowerScores = processedAttempts.filter(
        (other) => other.composite < attempt.composite
      ).length;

      // Percentile = (number of candidates with lower scores / total candidates) * 100
      const percentile =
        processedAttempts.length > 1
          ? Math.round(
              (candidatesWithLowerScores / (processedAttempts.length - 1)) * 100
            )
          : 100; // If only one candidate, they're at 100th percentile

      attempt.percentile = percentile;
    });

    // Sort processed results by the requested field
    processedAttempts.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'rank':
          // For rank, sort by composite score (descending = rank 1 is highest score)
          aValue = a.composite;
          bValue = b.composite;
          // Reverse the sort order for rank (higher score = lower rank number)
          return sortOrder === 'asc' ? bValue - aValue : aValue - bValue;
        case 'composite':
          aValue = a.composite;
          bValue = b.composite;
          break;
        case 'scoreLogical':
          aValue = a.scoreLogical;
          bValue = b.scoreLogical;
          break;
        case 'scoreVerbal':
          aValue = a.scoreVerbal;
          bValue = b.scoreVerbal;
          break;
        case 'scoreNumerical':
          aValue = a.scoreNumerical;
          bValue = b.scoreNumerical;
          break;
        case 'scoreAttention':
          aValue = a.scoreAttention;
          bValue = b.scoreAttention;
          break;
        case 'scoreOther':
          aValue = a.scoreOther;
          bValue = b.scoreOther;
          break;
        case 'percentile':
          aValue = a.percentile;
          bValue = b.percentile;
          break;
        case 'candidateName':
          aValue = a.candidateName?.toLowerCase() || '';
          bValue = b.candidateName?.toLowerCase() || '';
          break;
        case 'completedAt':
          aValue = new Date(a.completedAt || 0).getTime();
          bValue = new Date(b.completedAt || 0).getTime();
          break;
        default:
          aValue = a[sortBy as keyof typeof a] || 0;
          bValue = b[sortBy as keyof typeof b] || 0;
      }

      // Handle string vs number comparison (skip for rank since it's handled above)
      if (sortBy === 'rank') {
        return 0; // Already handled above
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'desc'
          ? bValue.localeCompare(aValue)
          : aValue.localeCompare(bValue);
      } else {
        const numA = Number(aValue) || 0;
        const numB = Number(bValue) || 0;
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      }
    });

    // Apply pagination
    const total = processedAttempts.length;
    const paginatedAttempts = processedAttempts.slice(
      (page - 1) * pageSize,
      page * pageSize
    );

    const leaderboardData = paginatedAttempts.map((attempt, index) => {
      return {
        attemptId: attempt.id,
        invitationId: attempt.invitationId,
        candidateName: attempt.candidateName || 'Unknown',
        candidateEmail: attempt.candidateEmail || 'unknown@example.com',
        completedAt: attempt.completedAt,
        durationSeconds:
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : 0,
        scoreLogical: attempt.scoreLogical,
        scoreVerbal: attempt.scoreVerbal,
        scoreNumerical: attempt.scoreNumerical,
        scoreAttention: attempt.scoreAttention,
        scoreOther: attempt.scoreOther,
        composite: attempt.composite,
        compositeUnweighted: attempt.compositeUnweighted, // NEW: Include unweighted score for comparison
        percentile: attempt.percentile,
        rank: index + 1 + (page - 1) * pageSize,
        type: attempt.type, // Add type to distinguish regular vs public
      };
    });

    // Get stats from both tables
    const [regularStats, publicStats] = await Promise.all([
      prisma.testAttempt.findMany({
        where: { testId, status: 'COMPLETED' },
        select: { rawScore: true, completedAt: true },
      }),
      prisma.publicTestAttempt.findMany({
        where: {
          status: 'COMPLETED',
          publicLink: { testId },
        },
        select: { rawScore: true, completedAt: true },
      }),
    ]);

    const allStatsAttempts = [...regularStats, ...publicStats];
    const validScores = allStatsAttempts
      .map((a) => a.rawScore)
      .filter((s) => s !== null) as number[];

    const thisMonthCount = allStatsAttempts.filter(
      (a) => a.completedAt && a.completedAt.getMonth() === new Date().getMonth()
    ).length;

    // Convert raw scores to percentages for stats using the already fetched totalTestQuestions
    const avgScorePercentage =
      validScores.length > 0 && totalTestQuestions > 0
        ? Math.round(
            (validScores.reduce((a, b) => a + b, 0) /
              validScores.length /
              totalTestQuestions) *
              1000
          ) / 10 // Round to 1 decimal place
        : 0;

    const topScorePercentage =
      validScores.length > 0 && totalTestQuestions > 0
        ? Math.round((Math.max(...validScores) / totalTestQuestions) * 1000) /
          10
        : 0;

    return NextResponse.json({
      rows: leaderboardData,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        hasNext: page * pageSize < total,
        hasPrevious: page > 1,
      },
      filters: {
        dateFrom,
        dateTo,
        invitationId,
        testId,
        search,
        sortBy,
        sortOrder,
        weightProfile: weightProfileId,
      },
      weightProfile: weightProfile
        ? {
            id: weightProfile.id,
            name: weightProfile.name,
            description: weightProfile.description,
            weights: weightProfile.weights,
          }
        : null,
      stats: {
        totalCandidates: total,
        avgScore: avgScorePercentage,
        topScore: topScorePercentage,
        thisMonth: thisMonthCount,
      },
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    // Vercel logs are often the only way to see this in production
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
