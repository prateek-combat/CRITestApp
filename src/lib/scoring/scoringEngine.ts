import { QuestionCategory } from '@prisma/client';
import {
  calculatePersonalityScores,
  PersonalityProfile,
  PersonalityDimension,
  PersonalityQuestion,
  preparePersonalityScoresForStorage,
} from './personalityScoring';

// Extended to support both objective and personality tests
export type TestType = 'OBJECTIVE' | 'PERSONALITY' | 'MIXED';

export interface ObjectiveResult {
  rawScore: number;
  percentile: number;
  categorySubScores: Record<string, { correct: number; total: number }>;
}

export interface CombinedScoringResult {
  testType: TestType;
  rawScore: number;
  percentile?: number;
  categorySubScores: any;
  personalityScores?: Record<string, any>;
  personalityProfile?: Record<string, any>;
}

// Legacy interface for backward compatibility
export interface ScoringResult extends CombinedScoringResult {}

export interface EnhancedQuestion {
  id: string;
  category: QuestionCategory;
  correctAnswerIndex?: number | null;
  questionType?: 'OBJECTIVE' | 'PERSONALITY';
  personalityDimensionId?: string | null;
  answerWeights?: Record<string, number> | null;
  personalityDimension?: PersonalityDimension;
}

/**
 * Main scoring function that handles both objective and personality tests
 */
export async function calculateTestScore(
  testType: TestType,
  answers: Record<string, { answerIndex: number; timeTaken?: number }>,
  questions: EnhancedQuestion[],
  personalityDimensions?: PersonalityDimension[]
): Promise<CombinedScoringResult> {
  // Separate questions by type
  const objectiveQuestions = questions.filter(
    (q) => !q.questionType || q.questionType === 'OBJECTIVE'
  );
  const personalityQuestions = questions.filter(
    (q) => q.questionType === 'PERSONALITY'
  ) as PersonalityQuestion[];

  // Detect actual test type based on questions
  let actualTestType: TestType = testType;
  if (
    testType === 'MIXED' ||
    (objectiveQuestions.length > 0 && personalityQuestions.length > 0)
  ) {
    actualTestType = 'MIXED';
  } else if (
    personalityQuestions.length > 0 &&
    objectiveQuestions.length === 0
  ) {
    actualTestType = 'PERSONALITY';
  } else {
    actualTestType = 'OBJECTIVE';
  }

  // Calculate objective scores
  let objectiveResult: ObjectiveResult | null = null;
  if (objectiveQuestions.length > 0) {
    const objectiveScoring = calculateObjectiveScore(
      answers,
      objectiveQuestions
    );
    objectiveResult = {
      rawScore: objectiveScoring.rawScore,
      percentile: objectiveScoring.percentile || 0,
      categorySubScores: objectiveScoring.categorySubScores,
    };
  }

  // Calculate personality scores
  let personalityResult: PersonalityProfile | null = null;
  if (personalityQuestions.length > 0 && personalityDimensions) {
    try {
      personalityResult = calculatePersonalityScores(
        answers,
        personalityQuestions,
        personalityDimensions
      );
    } catch (error) {
      console.warn('Error calculating personality scores:', error);
      // Continue with objective scoring only
    }
  }

  // Combine results
  const result: CombinedScoringResult = {
    testType: actualTestType,
    rawScore: objectiveResult?.rawScore || 0,
    percentile: objectiveResult?.percentile,
    categorySubScores: objectiveResult?.categorySubScores || {},
  };

  // Add personality results if available
  if (personalityResult) {
    const personalityStorage =
      preparePersonalityScoresForStorage(personalityResult);
    result.personalityScores = personalityStorage.personalityScores;
    result.personalityProfile = personalityStorage.personalityProfile;
  }

  return result;
}

/**
 * Calculate scores for objective tests (legacy function maintained for compatibility)
 */
function calculateObjectiveScore(
  answers: Record<string, { answerIndex: number; timeTaken?: number }>,
  questions: Array<{
    id: string;
    category: QuestionCategory;
    correctAnswerIndex?: number | null;
  }>
): ScoringResult {
  let correctAnswers = 0;

  // Initialize category scores
  const categorySubScores: Record<string, { correct: number; total: number }> =
    {
      LOGICAL: { correct: 0, total: 0 },
      VERBAL: { correct: 0, total: 0 },
      NUMERICAL: { correct: 0, total: 0 },
      ATTENTION_TO_DETAIL: { correct: 0, total: 0 },
      OTHER: { correct: 0, total: 0 },
    };

  // Count total questions per category
  questions.forEach((q) => {
    const category = q.category;
    if (categorySubScores[category]) {
      categorySubScores[category].total++;
    }
  });

  // Calculate correct answers and category scores
  for (const question of questions) {
    const answer = answers[question.id];
    const category = question.category;

    if (
      answer &&
      answer.answerIndex !== undefined &&
      question.correctAnswerIndex !== null
    ) {
      const isCorrect = answer.answerIndex === question.correctAnswerIndex;

      if (isCorrect) {
        correctAnswers++;
        if (categorySubScores[category]) {
          categorySubScores[category].correct++;
        }
      }
    }
  }

  const totalQuestions = questions.length;
  const rawScore = correctAnswers;
  const percentile =
    totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  return {
    testType: 'OBJECTIVE',
    rawScore,
    percentile,
    categorySubScores,
  };
}

/**
 * Helper function to prepare submitted answers data for database storage
 * Enhanced to handle both objective and personality questions
 */
export function prepareSubmittedAnswers(
  answers: Record<string, { answerIndex: number; timeTaken?: number }>,
  questions: EnhancedQuestion[],
  testType: TestType
): Array<{
  questionId: string;
  selectedAnswerIndex: number;
  isCorrect: boolean | null;
  timeTakenSeconds: number;
}> {
  return Object.entries(answers).map(([questionId, answer]) => {
    const question = questions.find((q) => q.id === questionId);

    let isCorrect: boolean | null = null;

    // Calculate isCorrect for objective questions only
    if (
      question?.questionType !== 'PERSONALITY' &&
      question?.correctAnswerIndex !== null &&
      question?.correctAnswerIndex !== undefined
    ) {
      isCorrect = answer.answerIndex === question.correctAnswerIndex;
    }
    // For personality questions, isCorrect remains null as there's no "correct" answer

    return {
      questionId,
      selectedAnswerIndex: answer.answerIndex,
      isCorrect,
      timeTakenSeconds: answer.timeTaken || 0,
    };
  });
}

/**
 * Legacy function maintained for backward compatibility
 * Routes to the new calculateTestScore function
 */
export async function calculateObjectiveTestScore(
  answers: Record<string, { answerIndex: number; timeTaken?: number }>,
  questions: Array<{
    id: string;
    category: QuestionCategory;
    correctAnswerIndex?: number | null;
  }>
): Promise<ScoringResult> {
  return calculateTestScore('OBJECTIVE', answers, questions);
}
