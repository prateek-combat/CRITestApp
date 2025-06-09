import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url, 'http://localhost');
    const searchParams = url.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || '1'));
    const pageSize = Math.min(
      100,
      Math.max(10, Number(searchParams.get('pageSize') || '25'))
    );
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const invitationId = searchParams.get('invitationId');
    const testId = searchParams.get('testId');
    const search = searchParams.get('search')?.trim();
    const sortBy = searchParams.get('sortBy') || 'rank';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    // Build where conditions for filtering
    let whereConditions = ['1=1'];

    if (dateFrom) {
      whereConditions.push(`"completedAt" >= '${dateFrom}'::timestamp`);
    }
    if (dateTo) {
      whereConditions.push(`"completedAt" <= '${dateTo}'::timestamp`);
    }
    if (invitationId) {
      whereConditions.push(`"invitationId" = '${invitationId}'`);
    }
    if (testId) {
      // Validate UUID format to prevent SQL injection
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(testId)) {
        return NextResponse.json(
          { message: 'Invalid testId format' },
          { status: 400 }
        );
      }
      whereConditions.push(`"testId" = '${testId}'`);
    }
    if (search) {
      // Escape special characters to prevent SQL injection
      const escapedSearch = search.replace(/'/g, "''");
      whereConditions.push(
        `("candidateName" ILIKE '%${escapedSearch}%' OR "candidateEmail" ILIKE '%${escapedSearch}%')`
      );
    }

    const whereClause = whereConditions.join(' AND ');

    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case 'composite':
        orderByClause = `"composite" ${sortOrder.toUpperCase()}`;
        break;
      case 'candidateName':
        orderByClause = `"candidateName" ${sortOrder.toUpperCase()}`;
        break;
      case 'completedAt':
        orderByClause = `"completedAt" ${sortOrder.toUpperCase()}`;
        break;
      case 'durationSeconds':
        orderByClause = `"durationSeconds" ${sortOrder.toUpperCase()}`;
        break;
      default:
        orderByClause = '"rank" ASC';
    }

    try {
      // First, try to use the view
      const [rows, totalResult, statsResult] = await Promise.all([
        prisma.$queryRawUnsafe(`
          SELECT 
            "attemptId",
            "invitationId", 
            "candidateName",
            "candidateEmail",
            "completedAt",
            "durationSeconds",
            "scoreLogical",
            "scoreVerbal", 
            "scoreNumerical",
            "scoreAttention",
            "scoreOther",
            "composite",
            "percentile",
            "rank"
          FROM vw_candidate_scores 
          WHERE ${whereClause}
          ORDER BY ${orderByClause}
          LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
        `),
        prisma.$queryRawUnsafe(`
          SELECT COUNT(*) as count
          FROM vw_candidate_scores 
          WHERE ${whereClause}
        `),
        // Stats query
        prisma.$queryRawUnsafe(`
          SELECT 
            COUNT(*) as totalCandidates,
            ROUND(AVG("composite")::numeric, 1) as avgScore,
            MAX("composite") as topScore,
            COUNT(CASE WHEN "completedAt" >= date_trunc('month', CURRENT_DATE) THEN 1 END) as thisMonth
          FROM vw_candidate_scores 
          WHERE ${whereClause}
        `),
      ]);

      const total = Number((totalResult as any)[0]?.count || 0);
      const stats = (statsResult as any)[0] || {};

      // Convert BigInt values to numbers for JSON serialization
      const serializedRows = (rows as any[]).map((row: any) => ({
        ...row,
        durationSeconds: Number(row.durationSeconds),
        scoreLogical: Number(row.scoreLogical),
        scoreVerbal: Number(row.scoreVerbal),
        scoreNumerical: Number(row.scoreNumerical),
        scoreAttention: Number(row.scoreAttention),
        scoreOther: Number(row.scoreOther),
        composite: Number(row.composite),
        percentile: Number(row.percentile),
        rank: Number(row.rank),
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / pageSize);
      const hasNext = page < totalPages;
      const hasPrevious = page > 1;

      return NextResponse.json({
        rows: serializedRows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasNext,
          hasPrevious,
        },
        filters: {
          dateFrom,
          dateTo,
          invitationId,
          testId,
          search,
          sortBy,
          sortOrder,
        },
        stats: {
          totalCandidates: Number(stats.totalCandidates || 0),
          avgScore: Number(stats.avgScore || 0),
          topScore: Number(stats.topScore || 0),
          thisMonth: Number(stats.thisMonth || 0),
        },
      });
    } catch (viewError) {
      console.warn(
        '[API /admin/leaderboard] View query failed, falling back to direct table query:',
        viewError
      );

      // Log the specific error for debugging
      console.warn('View error details:', {
        message:
          viewError instanceof Error ? viewError.message : 'Unknown error',
        testId,
        whereClause,
      });

      // Fallback: Query both TestAttempt and PublicTestAttempt tables directly if view fails
      const whereCondition: any = {
        status: 'COMPLETED',
        completedAt: { not: null },
      };

      // Add search filter for both regular and public attempts
      if (search) {
        whereCondition.OR = [
          { candidateName: { contains: search, mode: 'insensitive' } },
          { candidateEmail: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (dateFrom) {
        whereCondition.completedAt = {
          ...whereCondition.completedAt,
          gte: new Date(dateFrom),
        };
      }

      if (dateTo) {
        whereCondition.completedAt = {
          ...whereCondition.completedAt,
          lte: new Date(dateTo),
        };
      }

      // For regular invitations, filter by invitationId if specified
      const regularWhereCondition = { ...whereCondition };
      if (invitationId) {
        regularWhereCondition.invitationId = invitationId;
      }

      // Add testId filter for regular attempts
      if (testId) {
        regularWhereCondition.testId = testId;
      }

      // For public attempts, we need to filter by testId through the publicLink
      const publicWhereCondition = { ...whereCondition };
      if (testId) {
        publicWhereCondition.publicLink = {
          testId: testId,
        };
      }

      // Query both regular and public test attempts
      const [testAttempts, publicTestAttempts] = await Promise.all([
        prisma.testAttempt.findMany({
          where: regularWhereCondition,
          include: {
            invitation: true,
            submittedAnswers: {
              include: {
                question: true,
              },
            },
            test: {
              include: {
                questions: true,
              },
            },
          },
          orderBy:
            sortBy === 'completedAt'
              ? { completedAt: sortOrder }
              : { createdAt: 'desc' },
        }),
        prisma.publicTestAttempt.findMany({
          where: publicWhereCondition,
          include: {
            publicLink: {
              include: {
                test: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
            submittedAnswers: {
              include: {
                question: true,
              },
            },
          },
          orderBy:
            sortBy === 'completedAt'
              ? { completedAt: sortOrder }
              : { createdAt: 'desc' },
        }),
      ]);

      // Process regular test attempts
      const processRegularAttempt = (attempt: any, index: number) => {
        const scores = attempt.categorySubScores as any;

        // Calculate percentage scores with fallback to rawScore/percentile if available
        let scoreLogical = 0;
        let scoreVerbal = 0;
        let scoreNumerical = 0;
        let scoreAttention = 0;
        let scoreOther = 0;
        let composite = 0;

        if (scores && typeof scores === 'object') {
          scoreLogical = scores?.LOGICAL
            ? (scores.LOGICAL.correct / Math.max(scores.LOGICAL.total, 1)) * 100
            : 0;
          scoreVerbal = scores?.VERBAL
            ? (scores.VERBAL.correct / Math.max(scores.VERBAL.total, 1)) * 100
            : 0;
          scoreNumerical = scores?.NUMERICAL
            ? (scores.NUMERICAL.correct / Math.max(scores.NUMERICAL.total, 1)) *
              100
            : 0;
          scoreAttention = scores?.ATTENTION_TO_DETAIL
            ? (scores.ATTENTION_TO_DETAIL.correct /
                Math.max(scores.ATTENTION_TO_DETAIL.total, 1)) *
              100
            : 0;
          scoreOther = scores?.OTHER
            ? (scores.OTHER.correct / Math.max(scores.OTHER.total, 1)) * 100
            : 0;

          // Only calculate composite if we have valid category scores
          const validScores = [
            scoreLogical,
            scoreVerbal,
            scoreNumerical,
            scoreAttention,
            scoreOther,
          ].filter((s) => s > 0);
          if (validScores.length > 0) {
            composite =
              validScores.reduce((sum, score) => sum + score, 0) /
              validScores.length;
          }
        }

        // Fallback: Use percentile or rawScore if category scores aren't available
        if (composite === 0 && attempt.percentile != null) {
          composite = Number(attempt.percentile);
        } else if (composite === 0 && attempt.rawScore != null) {
          // Calculate approximate percentage from raw score
          // This is a fallback - ideally we'd know the total questions
          composite = Math.min(Number(attempt.rawScore) * 10, 100); // Assume max 10 questions as fallback
        }

        // Enhanced fallback: Calculate scores from submitted answers if available
        // Changed condition to run when category scores are missing (0 or NaN) OR when composite is 0
        const hasValidCategoryScores = [
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          scoreOther,
        ].some((score) => !isNaN(score) && score > 0);
        if (
          (composite === 0 || !hasValidCategoryScores) &&
          attempt.submittedAnswers &&
          attempt.submittedAnswers.length > 0
        ) {
          const submittedAnswers = attempt.submittedAnswers;
          const correctAnswers = submittedAnswers.filter(
            (answer: any) => answer.isCorrect
          ).length;

          // Only update composite if it's currently 0
          if (composite === 0) {
            composite = (correctAnswers / submittedAnswers.length) * 100;
          }

          // Calculate category scores from submitted answers
          const categoryTotals: Record<string, number> = {};
          const categoryCorrect: Record<string, number> = {};

          submittedAnswers.forEach((submittedAnswer: any) => {
            const category = submittedAnswer.question?.category;
            if (category) {
              categoryTotals[category] = (categoryTotals[category] || 0) + 1;
              if (submittedAnswer.isCorrect) {
                categoryCorrect[category] =
                  (categoryCorrect[category] || 0) + 1;
              }
            }
          });

          // Update individual category scores
          if (categoryTotals.LOGICAL) {
            scoreLogical =
              ((categoryCorrect.LOGICAL || 0) / categoryTotals.LOGICAL) * 100;
          }
          if (categoryTotals.VERBAL) {
            scoreVerbal =
              ((categoryCorrect.VERBAL || 0) / categoryTotals.VERBAL) * 100;
          }
          if (categoryTotals.NUMERICAL) {
            scoreNumerical =
              ((categoryCorrect.NUMERICAL || 0) / categoryTotals.NUMERICAL) *
              100;
          }
          if (categoryTotals.ATTENTION_TO_DETAIL) {
            scoreAttention =
              ((categoryCorrect.ATTENTION_TO_DETAIL || 0) /
                categoryTotals.ATTENTION_TO_DETAIL) *
              100;
          }
          if (categoryTotals.OTHER) {
            scoreOther =
              ((categoryCorrect.OTHER || 0) / categoryTotals.OTHER) * 100;
          }
        }

        const durationSeconds =
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : 0;

        return {
          attemptId: attempt.id,
          invitationId: attempt.invitationId,
          candidateName:
            attempt.candidateName ||
            attempt.invitation?.candidateName ||
            'Anonymous',
          candidateEmail:
            attempt.candidateEmail || attempt.invitation?.candidateEmail || '',
          completedAt: attempt.completedAt,
          durationSeconds,
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          scoreOther,
          composite,
          percentile: 50, // Default percentile for fallback
          rank: 0, // Will be calculated after combining and sorting
          isPublicAttempt: false,
        };
      };

      // Process public test attempts
      const processPublicAttempt = (attempt: any, index: number) => {
        const scores = attempt.categorySubScores as any;

        // Calculate percentage scores with fallback to rawScore/percentile if available
        let scoreLogical = 0;
        let scoreVerbal = 0;
        let scoreNumerical = 0;
        let scoreAttention = 0;
        let scoreOther = 0;
        let composite = 0;

        if (scores && typeof scores === 'object') {
          scoreLogical = scores?.LOGICAL
            ? (scores.LOGICAL.correct / Math.max(scores.LOGICAL.total, 1)) * 100
            : 0;
          scoreVerbal = scores?.VERBAL
            ? (scores.VERBAL.correct / Math.max(scores.VERBAL.total, 1)) * 100
            : 0;
          scoreNumerical = scores?.NUMERICAL
            ? (scores.NUMERICAL.correct / Math.max(scores.NUMERICAL.total, 1)) *
              100
            : 0;
          scoreAttention = scores?.ATTENTION_TO_DETAIL
            ? (scores.ATTENTION_TO_DETAIL.correct /
                Math.max(scores.ATTENTION_TO_DETAIL.total, 1)) *
              100
            : 0;
          scoreOther = scores?.OTHER
            ? (scores.OTHER.correct / Math.max(scores.OTHER.total, 1)) * 100
            : 0;

          // Only calculate composite if we have valid category scores
          const validScores = [
            scoreLogical,
            scoreVerbal,
            scoreNumerical,
            scoreAttention,
            scoreOther,
          ].filter((s) => s > 0);
          if (validScores.length > 0) {
            composite =
              validScores.reduce((sum, score) => sum + score, 0) /
              validScores.length;
          }
        }

        // Fallback: Use percentile or rawScore if category scores aren't available
        if (composite === 0 && attempt.percentile != null) {
          composite = Number(attempt.percentile);
        } else if (composite === 0 && attempt.rawScore != null) {
          // Calculate approximate percentage from raw score
          // This is a fallback - ideally we'd know the total questions
          composite = Math.min(Number(attempt.rawScore) * 10, 100); // Assume max 10 questions as fallback
        }

        // Enhanced fallback: Calculate scores from submitted answers if available
        // Changed condition to run when category scores are missing (0 or NaN) OR when composite is 0
        const hasValidCategoryScores = [
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          scoreOther,
        ].some((score) => !isNaN(score) && score > 0);
        if (
          (composite === 0 || !hasValidCategoryScores) &&
          attempt.submittedAnswers &&
          attempt.submittedAnswers.length > 0
        ) {
          const submittedAnswers = attempt.submittedAnswers;
          const correctAnswers = submittedAnswers.filter(
            (answer: any) => answer.isCorrect
          ).length;

          // Only update composite if it's currently 0
          if (composite === 0) {
            composite = (correctAnswers / submittedAnswers.length) * 100;
          }

          // Calculate category scores from submitted answers
          const categoryTotals: Record<string, number> = {};
          const categoryCorrect: Record<string, number> = {};

          submittedAnswers.forEach((submittedAnswer: any) => {
            const category = submittedAnswer.question?.category;
            if (category) {
              categoryTotals[category] = (categoryTotals[category] || 0) + 1;
              if (submittedAnswer.isCorrect) {
                categoryCorrect[category] =
                  (categoryCorrect[category] || 0) + 1;
              }
            }
          });

          // Update individual category scores
          if (categoryTotals.LOGICAL) {
            scoreLogical =
              ((categoryCorrect.LOGICAL || 0) / categoryTotals.LOGICAL) * 100;
          }
          if (categoryTotals.VERBAL) {
            scoreVerbal =
              ((categoryCorrect.VERBAL || 0) / categoryTotals.VERBAL) * 100;
          }
          if (categoryTotals.NUMERICAL) {
            scoreNumerical =
              ((categoryCorrect.NUMERICAL || 0) / categoryTotals.NUMERICAL) *
              100;
          }
          if (categoryTotals.ATTENTION_TO_DETAIL) {
            scoreAttention =
              ((categoryCorrect.ATTENTION_TO_DETAIL || 0) /
                categoryTotals.ATTENTION_TO_DETAIL) *
              100;
          }
          if (categoryTotals.OTHER) {
            scoreOther =
              ((categoryCorrect.OTHER || 0) / categoryTotals.OTHER) * 100;
          }
        }

        const durationSeconds =
          attempt.completedAt && attempt.startedAt
            ? Math.floor(
                (attempt.completedAt.getTime() - attempt.startedAt.getTime()) /
                  1000
              )
            : 0;

        return {
          attemptId: attempt.id,
          invitationId: null, // Public attempts don't have invitations
          candidateName: attempt.candidateName || 'Anonymous',
          candidateEmail: attempt.candidateEmail || '',
          completedAt: attempt.completedAt,
          durationSeconds,
          scoreLogical,
          scoreVerbal,
          scoreNumerical,
          scoreAttention,
          scoreOther,
          composite,
          percentile: 50, // Default percentile for fallback
          rank: 0, // Will be calculated after combining and sorting
          isPublicAttempt: true,
        };
      };

      // Process both types of attempts
      const regularRows = testAttempts.map(processRegularAttempt);
      const publicRows = publicTestAttempts.map(processPublicAttempt);

      // Combine and sort all attempts by composite score
      const allAttempts = [...regularRows, ...publicRows];
      allAttempts.sort((a, b) => b.composite - a.composite);

      // Assign ranks after sorting
      const processedRows = allAttempts.map((attempt, index) => ({
        ...attempt,
        rank: index + 1,
      }));

      // Apply additional sorting if needed (already sorted by composite)
      if (sortBy === 'completedAt') {
        processedRows.sort((a, b) => {
          const aTime = new Date(a.completedAt).getTime();
          const bTime = new Date(b.completedAt).getTime();
          return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
        });
      } else if (sortBy === 'candidateName') {
        processedRows.sort((a, b) => {
          const comparison = a.candidateName.localeCompare(b.candidateName);
          return sortOrder === 'desc' ? -comparison : comparison;
        });
      } else if (sortBy === 'durationSeconds') {
        processedRows.sort((a, b) => {
          return sortOrder === 'desc'
            ? b.durationSeconds - a.durationSeconds
            : a.durationSeconds - b.durationSeconds;
        });
      }

      // Get total count for both tables with the same filters
      const [regularTotal, publicTotal] = await Promise.all([
        prisma.testAttempt.count({
          where: regularWhereCondition,
        }),
        prisma.publicTestAttempt.count({
          where: publicWhereCondition,
        }),
      ]);

      const total = regularTotal + publicTotal;

      // Calculate stats
      const allStats = {
        totalCandidates: total,
        avgScore:
          allAttempts.length > 0
            ? allAttempts.reduce((sum, a) => sum + a.composite, 0) /
              allAttempts.length
            : 0,
        topScore:
          allAttempts.length > 0
            ? Math.max(...allAttempts.map((a) => a.composite))
            : 0,
        thisMonth: allAttempts.filter((a) => {
          const completedAt = new Date(a.completedAt);
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          return completedAt >= startOfMonth;
        }).length,
      };

      // Apply pagination after sorting
      const paginatedRows = processedRows.slice(
        (page - 1) * pageSize,
        page * pageSize
      );

      return NextResponse.json({
        rows: paginatedRows,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page < Math.ceil(total / pageSize),
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
        },
        stats: {
          totalCandidates: Math.round(allStats.totalCandidates),
          avgScore: Math.round(allStats.avgScore * 10) / 10,
          topScore: Math.round(allStats.topScore * 10) / 10,
          thisMonth: allStats.thisMonth,
        },
      });
    }
  } catch (error) {
    console.error('[API /admin/leaderboard] Error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch leaderboard data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
