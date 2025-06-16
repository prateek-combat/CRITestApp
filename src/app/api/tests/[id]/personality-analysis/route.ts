import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/tests/{id}/personality-analysis:
 *   get:
 *     summary: Get personality analysis for a test
 *     description: Provides analysis of personality questions distribution and dimension coverage for a specific test.
 *     tags:
 *       - Tests
 *       - Personality Analysis
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The test ID
 *     responses:
 *       200:
 *         description: Personality analysis data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testInfo:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     totalQuestions:
 *                       type: number
 *                     personalityQuestions:
 *                       type: number
 *                     objectiveQuestions:
 *                       type: number
 *                 dimensionCoverage:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       dimensionId:
 *                         type: string
 *                       dimensionName:
 *                         type: string
 *                       dimensionCode:
 *                         type: string
 *                       questionCount:
 *                         type: number
 *                       questions:
 *                         type: array
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     personalityQuestionPercentage:
 *                       type: number
 *                     dimensionsUsed:
 *                       type: number
 *                     averageQuestionsPerDimension:
 *                       type: number
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Internal server error.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: testId } = await params;

    // Get test with all questions and personality dimensions
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        questions: {
          include: {
            personalityDimension: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ message: 'Test not found' }, { status: 404 });
    }

    // Separate questions by type
    const personalityQuestions = test.questions.filter(
      (q) => q.questionType === 'PERSONALITY'
    );
    const objectiveQuestions = test.questions.filter(
      (q) => q.questionType !== 'PERSONALITY'
    );

    // Group personality questions by dimension
    const dimensionMap = new Map();

    personalityQuestions.forEach((question) => {
      if (question.personalityDimension) {
        const dimensionId = question.personalityDimension.id;
        if (!dimensionMap.has(dimensionId)) {
          dimensionMap.set(dimensionId, {
            dimensionId: question.personalityDimension.id,
            dimensionName: question.personalityDimension.name,
            dimensionCode: question.personalityDimension.code,
            dimensionDescription: question.personalityDimension.description,
            questionCount: 0,
            questions: [],
          });
        }

        const dimensionData = dimensionMap.get(dimensionId);
        dimensionData.questionCount++;
        dimensionData.questions.push({
          id: question.id,
          promptText: question.promptText,
          answerOptions: question.answerOptions,
          answerWeights: question.answerWeights,
          category: question.category,
          createdAt: question.createdAt.toISOString(),
        });
      }
    });

    const dimensionCoverage = Array.from(dimensionMap.values());

    // Calculate statistics
    const totalQuestions = test._count.questions;
    const personalityQuestionCount = personalityQuestions.length;
    const objectiveQuestionCount = objectiveQuestions.length;

    const personalityQuestionPercentage =
      totalQuestions > 0
        ? Math.round((personalityQuestionCount / totalQuestions) * 100 * 10) /
          10
        : 0;

    const dimensionsUsed = dimensionCoverage.length;
    const averageQuestionsPerDimension =
      dimensionsUsed > 0
        ? Math.round((personalityQuestionCount / dimensionsUsed) * 10) / 10
        : 0;

    // Get all available personality dimensions for comparison
    const allDimensions = await prisma.personalityDimension.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Mark which dimensions are used vs available
    const dimensionComparison = allDimensions.map((dim) => ({
      id: dim.id,
      name: dim.name,
      code: dim.code,
      description: dim.description,
      isUsedInTest: dimensionMap.has(dim.id),
      questionCount: dimensionMap.has(dim.id)
        ? dimensionMap.get(dim.id).questionCount
        : 0,
    }));

    const analysis = {
      testInfo: {
        id: test.id,
        title: test.title,
        description: test.description,
        totalQuestions,
        personalityQuestions: personalityQuestionCount,
        objectiveQuestions: objectiveQuestionCount,
        createdAt: test.createdAt.toISOString(),
      },
      dimensionCoverage,
      dimensionComparison,
      statistics: {
        personalityQuestionPercentage,
        dimensionsUsed,
        totalAvailableDimensions: allDimensions.length,
        averageQuestionsPerDimension,
        testType:
          personalityQuestionCount > 0 && objectiveQuestionCount > 0
            ? 'MIXED'
            : personalityQuestionCount > 0
              ? 'PERSONALITY'
              : 'OBJECTIVE',
      },
      recommendations: generateRecommendations({
        totalQuestions,
        personalityQuestionCount,
        objectiveQuestionCount,
        dimensionsUsed,
        totalAvailableDimensions: allDimensions.length,
        averageQuestionsPerDimension,
      }),
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error fetching personality analysis:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on the personality analysis
 */
function generateRecommendations(stats: {
  totalQuestions: number;
  personalityQuestionCount: number;
  objectiveQuestionCount: number;
  dimensionsUsed: number;
  totalAvailableDimensions: number;
  averageQuestionsPerDimension: number;
}) {
  const recommendations = [];

  // Check for personality question coverage
  if (stats.personalityQuestionCount === 0) {
    recommendations.push({
      type: 'info',
      category: 'personality_coverage',
      message:
        'This test contains only objective questions. Consider adding personality assessment questions for a more comprehensive evaluation.',
    });
  } else if (stats.personalityQuestionCount < 5) {
    recommendations.push({
      type: 'warning',
      category: 'personality_coverage',
      message: `Only ${stats.personalityQuestionCount} personality questions found. Consider adding more for better personality assessment reliability.`,
    });
  }

  // Check dimension coverage
  if (stats.dimensionsUsed === 0) {
    recommendations.push({
      type: 'info',
      category: 'dimension_coverage',
      message: 'No personality dimensions are covered in this test.',
    });
  } else if (stats.dimensionsUsed < stats.totalAvailableDimensions * 0.5) {
    recommendations.push({
      type: 'suggestion',
      category: 'dimension_coverage',
      message: `Only ${stats.dimensionsUsed} out of ${stats.totalAvailableDimensions} available personality dimensions are used. Consider expanding dimension coverage for a more comprehensive personality profile.`,
    });
  }

  // Check questions per dimension
  if (
    stats.averageQuestionsPerDimension > 0 &&
    stats.averageQuestionsPerDimension < 3
  ) {
    recommendations.push({
      type: 'warning',
      category: 'dimension_depth',
      message: `Average of ${stats.averageQuestionsPerDimension} questions per dimension. Consider adding more questions per dimension for better reliability (recommended: 3-5 questions per dimension).`,
    });
  } else if (stats.averageQuestionsPerDimension > 10) {
    recommendations.push({
      type: 'suggestion',
      category: 'dimension_depth',
      message: `High number of questions per dimension (${stats.averageQuestionsPerDimension}). Consider distributing questions across more dimensions for broader coverage.`,
    });
  }

  // Check overall test balance
  if (stats.personalityQuestionCount > 0 && stats.objectiveQuestionCount > 0) {
    const personalityPercentage =
      (stats.personalityQuestionCount / stats.totalQuestions) * 100;
    if (personalityPercentage > 80) {
      recommendations.push({
        type: 'info',
        category: 'test_balance',
        message:
          'This test is heavily personality-focused. Consider if this balance aligns with your assessment goals.',
      });
    } else if (personalityPercentage < 20) {
      recommendations.push({
        type: 'info',
        category: 'test_balance',
        message:
          'This test is heavily objective-focused. Consider adding more personality questions if personality assessment is important.',
      });
    }
  }

  return recommendations;
}
