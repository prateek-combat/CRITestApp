import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { CategoryWeightService } from '@/lib/categoryWeightService';
import {
  calculateWeightedComposite,
  calculateUnweightedComposite,
  CategoryWeights,
} from '@/types/categories';
import { logger } from '@/lib/logger';

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
    const jobProfileId = searchParams.get('jobProfileId');

    // Support single test, position-based, and job profile-based filtering
    if (!testId && !positionId && !positionIds && !jobProfileId) {
      return NextResponse.json(
        {
          error: 'testId, positionId, positionIds, or jobProfileId is required',
        },
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
    let jobProfile: any = null;
    let testWeights: any = {};

    if (testId) {
      // Single test filter
      testFilterCondition = { testId };
    } else if (jobProfileId) {
      // Job profile filter - get the job profile and its test weights
      try {
        jobProfile = await prisma.jobProfile.findUnique({
          where: { id: jobProfileId },
          include: {
            testWeights: {
              include: {
                test: true,
              },
            },
            positions: true,
          },
        });

        if (!jobProfile) {
          return NextResponse.json(
            { error: 'Job profile not found' },
            { status: 404 }
          );
        }

        // Extract test IDs and weights from job profile
        const testIds = jobProfile.testWeights.map((tw: any) => tw.testId);
        testWeights = Object.fromEntries(
          jobProfile.testWeights.map((tw: any) => [tw.testId, tw.weight])
        );

        testFilterCondition = {
          testId: { in: testIds },
        };
      } catch (error) {
        logger.error(
          'Failed to fetch job profile for leaderboard',
          {
            operation: 'fetch_job_profile_leaderboard',
            jobProfileId,
            method: 'GET',
            path: '/api/admin/leaderboard',
          },
          error as Error
        );
        return NextResponse.json(
          { error: 'Failed to fetch job profile' },
          { status: 500 }
        );
      }
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
      ...(testId || jobProfileId
        ? testFilterCondition
        : { test: testFilterCondition.test }),
    };
    if (invitationId) {
      regularWhere.invitationId = invitationId;
    }

    // Public test attempts where clause (need to join through publicLink)
    const publicWhere = {
      ...baseWhere,
      publicLink:
        testId || jobProfileId
          ? testFilterCondition
          : { test: testFilterCondition.test },
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
          riskScore: true,
          proctoringEnabled: true,
          testId: true, // Add testId for job profile scoring
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
          riskScore: true,
          proctoringEnabled: true,
          publicLink: {
            select: {
              title: true,
              testId: true, // Add testId for job profile scoring
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
    let totalTestQuestions = 0;

    if (testId) {
      totalTestQuestions = await prisma.question.count({ where: { testId } });
    } else if (jobProfileId && jobProfile) {
      // For job profiles, count questions across all tests
      const testIds = jobProfile.testWeights.map((tw: any) => tw.testId);
      totalTestQuestions = await prisma.question.count({
        where: { testId: { in: testIds } },
      });
    } else if (positionId) {
      totalTestQuestions = await prisma.question.count({
        where: { test: { positionId } },
      });
    } else if (positionIds && positionIds.length > 0) {
      totalTestQuestions = await prisma.question.count({
        where: { test: { positionId: { in: positionIds } } },
      });
    }

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
      // Read individual weight parameters from the URL as a priority
      const individualWeights: Partial<CategoryWeights> = {};
      searchParams.forEach((value, key) => {
        if (key.startsWith('weight_')) {
          const category = key.replace('weight_', '').toUpperCase();
          const weight = parseInt(value, 10);
          if (!isNaN(weight)) {
            individualWeights[category as keyof CategoryWeights] = weight;
          }
        }
      });

      if (Object.keys(individualWeights).length > 0) {
        weights = { ...weights, ...individualWeights };
        weightProfile = {
          id: 'custom-individual',
          name: 'Custom URL Weights',
          description: 'Weights provided via URL parameters',
          weights: weights,
        };
      } else if (customWeightsParam) {
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
          logger.warn('Failed to parse custom weights, using fallback', {
            operation: 'parse_custom_weights',
            customWeightsParam,
            method: 'GET',
            path: '/api/admin/leaderboard',
          });
          // Fall back to profile or default weights
        }
      } else if (weightProfileId) {
        weightProfile =
          await CategoryWeightService.getProfileById(weightProfileId);
        if (weightProfile) {
          weights = weightProfile.weights;
        }
      } else {
        // Use default profile if no specific profile requested
        const defaultProfile = await CategoryWeightService.getDefaultProfile();
        if (defaultProfile) {
          weightProfile = defaultProfile;
          weights = defaultProfile.weights;
        }
      }
    } catch (error) {
      logger.warn('Failed to fetch weight profile, using default weights', {
        operation: 'fetch_weight_profile',
        weightProfileId,
        method: 'GET',
        path: '/api/admin/leaderboard',
      });
      // Continue with default weights
    }

    // Get total questions per category for the test (to handle skipped questions correctly)
    let categoryQuestionCounts: any;

    if (testId) {
      // Single test filter
      categoryQuestionCounts = await prisma.question.groupBy({
        by: ['category'],
        where: { testId },
        _count: { id: true },
      });
    } else if (jobProfileId && jobProfile) {
      // Job profile filter - get questions from all tests in the job profile
      const testIds = jobProfile.testWeights.map((tw: any) => tw.testId);
      categoryQuestionCounts = await prisma.question.groupBy({
        by: ['category'],
        where: { testId: { in: testIds } },
        _count: { id: true },
      });
    } else if (positionId) {
      // Single position filter
      categoryQuestionCounts = await prisma.question.groupBy({
        by: ['category'],
        where: { test: { positionId } },
        _count: { id: true },
      });
    } else if (positionIds && positionIds.length > 0) {
      // Multiple positions filter
      categoryQuestionCounts = await prisma.question.groupBy({
        by: ['category'],
        where: { test: { positionId: { in: positionIds } } },
        _count: { id: true },
      });
    } else {
      // Fallback
      categoryQuestionCounts = [];
    }

    const totalQuestionsByCategory: Record<string, number> = {};
    categoryQuestionCounts.forEach((item: any) => {
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
      if (attempt.submittedAnswers && attempt.submittedAnswers.length > 0) {
        // Normal case: calculate from submitted answers
        for (const answer of attempt.submittedAnswers) {
          const category = answer.question.category;
          if (!category || !categoryScores[category]) continue;

          if (answer.isCorrect) {
            categoryScores[category].correct++;
          }
        }
      } else if (
        attempt.rawScore !== null &&
        attempt.rawScore !== undefined &&
        totalTestQuestions > 0
      ) {
        // Fallback case: when rawScore exists but no submitted answers
        // This handles legacy data where submitted answers weren't properly saved
        const rawScore = attempt.rawScore; // TypeScript null check
        const scorePercentage = (rawScore / totalTestQuestions) * 100;

        // Distribute the score proportionally across categories based on question count
        Object.entries(categoryScores).forEach(([category, score]) => {
          if (score.total > 0) {
            // Calculate correct answers proportionally
            score.correct = Math.round(
              (rawScore * score.total) / totalTestQuestions
            );
          }
        });
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
      let weightedComposite = calculateWeightedComposite(
        categoryScoresForWeighting,
        weights
      );

      // Calculate unweighted composite using equal weights (for consistent comparison)
      let unweightedComposite = calculateUnweightedComposite(
        categoryScoresForWeighting
      );

      // NEW: Calculate job profile composite score if we're in job profile mode
      let jobProfileComposite = weightedComposite; // Default to category-based score

      if (jobProfile && Object.keys(testWeights).length > 0) {
        // For job profile scoring, we need to get the test-specific score
        // and weight it according to the job profile test weights
        const testId =
          attempt.type === 'regular'
            ? (attempt as any).testId // Get testId from regular attempt
            : (attempt as any).publicLink?.testId; // Get testId from public attempt

        if (testId && testWeights[testId]) {
          // Use the raw score for this specific test, weighted by job profile weight
          const testScore = attempt.rawScore || 0;
          const testWeight = testWeights[testId];

          // For job profile mode, we'll calculate a weighted average across all tests
          // This will be done at the candidate level, not individual test level
          // For now, use the individual test score with its weight
          jobProfileComposite = testScore * testWeight;
        }
      }

      // Additional fallback: if no submitted answers but rawScore exists, use rawScore percentage
      if (
        (!attempt.submittedAnswers || attempt.submittedAnswers.length === 0) &&
        attempt.rawScore !== null &&
        attempt.rawScore !== undefined &&
        totalTestQuestions > 0
      ) {
        const rawScorePercentage =
          (attempt.rawScore / totalTestQuestions) * 100;
        // Use raw score percentage as composite score for all cases when no submitted answers
        weightedComposite = rawScorePercentage;
        unweightedComposite = rawScorePercentage;
        // For job profile mode, also set the job profile composite
        if (jobProfile && Object.keys(testWeights).length > 0) {
          jobProfileComposite = rawScorePercentage;
        }
      }

      return {
        ...attempt,
        scoreLogical: categoryScores['LOGICAL']?.percentage || 0,
        scoreVerbal: categoryScores['VERBAL']?.percentage || 0,
        scoreNumerical: categoryScores['NUMERICAL']?.percentage || 0,
        scoreAttention: categoryScores['ATTENTION_TO_DETAIL']?.percentage || 0,
        scoreOther: categoryScores['OTHER']?.percentage || 0,
        composite: jobProfile ? jobProfileComposite : weightedComposite, // Use job profile composite if available
        compositeUnweighted: unweightedComposite, // Use consistent category-based unweighted score
        percentile: 0, // Will be calculated after we have all scores
        testWeight:
          jobProfile && Object.keys(testWeights).length > 0
            ? testWeights[(attempt as any).testId] || 1
            : 1,
        jobProfileName: jobProfile?.name || null,
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
        testWeight: (attempt as any).testWeight || 1,
        jobProfileName: (attempt as any).jobProfileName || null,
        riskScore:
          (attempt as any).riskScore !== undefined
            ? (attempt as any).riskScore
            : null,
        proctoringEnabled: (attempt as any).proctoringEnabled === true,
      };
    });

    // Get stats from both tables
    let regularStatsWhere: any = { status: 'COMPLETED' };
    let publicStatsWhere: any = { status: 'COMPLETED' };

    if (testId) {
      regularStatsWhere.testId = testId;
      publicStatsWhere.publicLink = { testId };
    } else if (positionId) {
      regularStatsWhere.test = { positionId };
      publicStatsWhere.publicLink = { test: { positionId } };
    } else if (positionIds && positionIds.length > 0) {
      regularStatsWhere.test = { positionId: { in: positionIds } };
      publicStatsWhere.publicLink = {
        test: { positionId: { in: positionIds } },
      };
    }

    const [regularStats, publicStats] = await Promise.all([
      prisma.testAttempt.findMany({
        where: regularStatsWhere,
        select: { rawScore: true, completedAt: true },
      }),
      prisma.publicTestAttempt.findMany({
        where: publicStatsWhere,
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
    const { searchParams } = new URL(request.url);
    const errorTestId = searchParams.get('testId');
    const errorPositionId = searchParams.get('positionId');
    const errorJobProfileId = searchParams.get('jobProfileId');
    const errorInvitationId = searchParams.get('invitationId');

    logger.error(
      'Failed to fetch leaderboard data',
      {
        operation: 'fetch_leaderboard',
        testId: errorTestId,
        positionId: errorPositionId,
        jobProfileId: errorJobProfileId,
        invitationId: errorInvitationId,
        method: 'GET',
        path: '/api/admin/leaderboard',
      },
      error as Error
    );
    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data.',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
