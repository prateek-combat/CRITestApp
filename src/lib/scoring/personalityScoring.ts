// Import types will be handled differently since Prisma client may not export these yet
// import { QuestionType, PersonalityDimension as PrismaPersonalityDimension } from '@prisma/client';

// TypeScript interfaces for personality scoring
export interface PersonalityDimension {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface PersonalityScore {
  dimensionId: string;
  dimensionName: string;
  dimensionCode: string;
  averageScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  rawScores: number[];
}

export interface PersonalityProfile {
  scores: PersonalityScore[];
  overallSummary: {
    totalPersonalityQuestions: number;
    answeredPersonalityQuestions: number;
    completionRate: number;
    averageAcrossDimensions: number;
  };
}

export interface PersonalityQuestion {
  id: string;
  personalityDimensionId: string;
  answerWeights: Record<string, number> | null;
  personalityDimension?: PersonalityDimension;
}

/**
 * Validates that all personality questions have proper answer weights
 */
export function validatePersonalityQuestions(
  questions: PersonalityQuestion[]
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const question of questions) {
    if (!question.answerWeights) {
      errors.push(`Question ${question.id} is missing answer weights`);
      continue;
    }

    if (typeof question.answerWeights !== 'object') {
      errors.push(`Question ${question.id} has invalid answer weights format`);
      continue;
    }

    const weights = Object.values(question.answerWeights);
    if (weights.length === 0) {
      errors.push(`Question ${question.id} has no answer weights defined`);
      continue;
    }

    if (weights.some((weight) => typeof weight !== 'number' || weight < 0)) {
      errors.push(
        `Question ${question.id} has invalid weight values (must be non-negative numbers)`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate personality scores based on weighted answers
 */
export function calculatePersonalityScores(
  answers: Record<string, { answerIndex: number; timeTaken?: number }>,
  personalityQuestions: PersonalityQuestion[],
  dimensions: PersonalityDimension[]
): PersonalityProfile {
  // Validate questions first
  const validation = validatePersonalityQuestions(personalityQuestions);
  if (!validation.isValid) {
    throw new Error(
      `Invalid personality questions: ${validation.errors.join(', ')}`
    );
  }

  // Group questions by dimension
  const questionsByDimension = new Map<string, PersonalityQuestion[]>();
  personalityQuestions.forEach((question) => {
    const dimensionId = question.personalityDimensionId;
    if (!questionsByDimension.has(dimensionId)) {
      questionsByDimension.set(dimensionId, []);
    }
    questionsByDimension.get(dimensionId)!.push(question);
  });

  // Calculate scores for each dimension
  const personalityScores: PersonalityScore[] = [];

  for (const dimension of dimensions) {
    const dimensionQuestions = questionsByDimension.get(dimension.id) || [];
    const rawScores: number[] = [];
    let questionsAnswered = 0;

    for (const question of dimensionQuestions) {
      const answer = answers[question.id];

      if (
        answer &&
        answer.answerIndex !== undefined &&
        question.answerWeights
      ) {
        // Map answer index to answer option (A, B, C, D, E, etc.)
        const answerOption = String.fromCharCode(65 + answer.answerIndex); // 0->A, 1->B, etc.
        const weight = question.answerWeights[answerOption];

        if (weight !== undefined) {
          rawScores.push(weight);
          questionsAnswered++;
        }
      }
    }

    // Calculate average score for this dimension
    const averageScore =
      rawScores.length > 0
        ? rawScores.reduce((sum, score) => sum + score, 0) / rawScores.length
        : 0;

    personalityScores.push({
      dimensionId: dimension.id,
      dimensionName: dimension.name,
      dimensionCode: dimension.code,
      averageScore,
      questionsAnswered,
      totalQuestions: dimensionQuestions.length,
      rawScores,
    });
  }

  // Calculate overall summary
  const totalPersonalityQuestions = personalityQuestions.length;
  const answeredPersonalityQuestions = personalityScores.reduce(
    (sum, score) => sum + score.questionsAnswered,
    0
  );
  const completionRate =
    totalPersonalityQuestions > 0
      ? (answeredPersonalityQuestions / totalPersonalityQuestions) * 100
      : 0;

  const dimensionsWithScores = personalityScores.filter(
    (score) => score.questionsAnswered > 0
  );
  const averageAcrossDimensions =
    dimensionsWithScores.length > 0
      ? dimensionsWithScores.reduce(
          (sum, score) => sum + score.averageScore,
          0
        ) / dimensionsWithScores.length
      : 0;

  return {
    scores: personalityScores,
    overallSummary: {
      totalPersonalityQuestions,
      answeredPersonalityQuestions,
      completionRate,
      averageAcrossDimensions,
    },
  };
}

/**
 * Generate a textual summary of personality profile
 */
export function generatePersonalityProfileSummary(
  profile: PersonalityProfile
): string {
  const { scores, overallSummary } = profile;

  if (overallSummary.answeredPersonalityQuestions === 0) {
    return 'No personality assessment completed.';
  }

  const topDimensions = scores
    .filter((score) => score.questionsAnswered > 0)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3);

  const summaryParts = [
    `Personality assessment completion: ${overallSummary.completionRate.toFixed(1)}%`,
    `Overall personality score: ${overallSummary.averageAcrossDimensions.toFixed(2)}`,
  ];

  if (topDimensions.length > 0) {
    const topDimensionSummary = topDimensions
      .map((dim) => `${dim.dimensionName}: ${dim.averageScore.toFixed(2)}`)
      .join(', ');
    summaryParts.push(`Top dimensions: ${topDimensionSummary}`);
  }

  return summaryParts.join('. ');
}

/**
 * Helper function to prepare personality scores for database storage
 */
export function preparePersonalityScoresForStorage(
  profile: PersonalityProfile
): {
  personalityScores: Record<string, any>;
  personalityProfile: Record<string, any>;
} {
  const personalityScores: Record<string, any> = {};

  // Store scores by dimension code for easy access
  profile.scores.forEach((score) => {
    personalityScores[score.dimensionCode] = {
      averageScore: score.averageScore,
      questionsAnswered: score.questionsAnswered,
      totalQuestions: score.totalQuestions,
    };
  });

  const personalityProfile = {
    summary: generatePersonalityProfileSummary(profile),
    overallSummary: profile.overallSummary,
    detailedScores: profile.scores.map((score) => ({
      dimensionId: score.dimensionId,
      dimensionName: score.dimensionName,
      dimensionCode: score.dimensionCode,
      averageScore: score.averageScore,
      questionsAnswered: score.questionsAnswered,
      totalQuestions: score.totalQuestions,
    })),
  };

  return {
    personalityScores,
    personalityProfile,
  };
}
