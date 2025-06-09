/**
 * Example usage of the combined scoring engine
 * This file demonstrates how to use both objective and personality scoring
 */

import { calculateTestScore, prepareSubmittedAnswers } from './scoringEngine';
import { PersonalityDimension } from './personalityScoring';
import { QuestionCategory } from '@prisma/client';

// Example usage function
export async function exampleScoringUsage() {
  // Example personality dimensions
  const personalityDimensions: PersonalityDimension[] = [
    {
      id: '1',
      name: 'Safety-First Risk Management',
      code: 'SAFETY_RISK_MGMT',
      description: 'Measures approach to safety and risk assessment',
    },
    {
      id: '2',
      name: 'Leadership Potential',
      code: 'LEADERSHIP',
      description: 'Evaluates leadership qualities and decision-making',
    },
  ];

  // Example mixed questions (both objective and personality)
  const questions = [
    // Objective question
    {
      id: 'obj1',
      category: 'LOGICAL' as QuestionCategory,
      correctAnswerIndex: 2,
      questionType: 'OBJECTIVE' as const,
    },
    // Personality question for Safety dimension
    {
      id: 'pers1',
      category: 'LOGICAL' as QuestionCategory,
      questionType: 'PERSONALITY' as const,
      personalityDimensionId: '1',
      answerWeights: {
        A: 5, // Strongly safety-focused
        B: 4, // Moderately safety-focused
        C: 3, // Neutral
        D: 2, // Less safety-focused
        E: 1, // Not safety-focused
      },
    },
    // Personality question for Leadership dimension
    {
      id: 'pers2',
      category: 'VERBAL' as QuestionCategory,
      questionType: 'PERSONALITY' as const,
      personalityDimensionId: '2',
      answerWeights: {
        A: 1, // Poor leadership
        B: 2, // Below average leadership
        C: 3, // Average leadership
        D: 4, // Good leadership
        E: 5, // Excellent leadership
      },
    },
  ];

  // Example candidate answers
  const answers = {
    obj1: { answerIndex: 2, timeTaken: 30 }, // Correct objective answer
    pers1: { answerIndex: 0, timeTaken: 45 }, // Answer 'A' = weight 5 for safety
    pers2: { answerIndex: 3, timeTaken: 40 }, // Answer 'D' = weight 4 for leadership
  };

  try {
    // Calculate combined scores
    const result = await calculateTestScore(
      'MIXED',
      answers,
      questions,
      personalityDimensions
    );

    console.log('Scoring Results:', {
      testType: result.testType,
      objectiveScore: {
        rawScore: result.rawScore,
        percentile: result.percentile,
        categoryBreakdown: result.categorySubScores,
      },
      personalityScores: result.personalityScores,
      personalityProfile: result.personalityProfile,
    });

    // Prepare data for database storage
    const submittedAnswers = prepareSubmittedAnswers(
      answers,
      questions,
      'MIXED'
    );

    console.log('Submitted Answers for DB:', submittedAnswers);

    return result;
  } catch (error) {
    console.error('Error in scoring:', error);
    throw error;
  }
}

// Example of objective-only test (backward compatibility)
export async function exampleObjectiveOnlyTest() {
  const objectiveQuestions = [
    {
      id: 'obj1',
      category: 'LOGICAL' as QuestionCategory,
      correctAnswerIndex: 1,
      questionType: 'OBJECTIVE' as const,
    },
    {
      id: 'obj2',
      category: 'NUMERICAL' as QuestionCategory,
      correctAnswerIndex: 0,
      questionType: 'OBJECTIVE' as const,
    },
  ];

  const answers = {
    obj1: { answerIndex: 1, timeTaken: 25 }, // Correct
    obj2: { answerIndex: 2, timeTaken: 35 }, // Incorrect
  };

  const result = await calculateTestScore(
    'OBJECTIVE',
    answers,
    objectiveQuestions
  );

  console.log('Objective-only Results:', {
    rawScore: result.rawScore,
    percentile: result.percentile,
    categoryScores: result.categorySubScores,
  });

  return result;
}

// Example of personality-only test
export async function examplePersonalityOnlyTest() {
  const personalityDimensions: PersonalityDimension[] = [
    {
      id: '1',
      name: 'Communication Style',
      code: 'COMMUNICATION',
      description: 'Evaluates communication preferences and effectiveness',
    },
  ];

  const personalityQuestions = [
    {
      id: 'pers1',
      category: 'VERBAL' as QuestionCategory,
      questionType: 'PERSONALITY' as const,
      personalityDimensionId: '1',
      answerWeights: {
        A: 5, // Excellent communicator
        B: 4, // Good communicator
        C: 3, // Average communicator
        D: 2, // Below average
        E: 1, // Poor communicator
      },
    },
    {
      id: 'pers2',
      category: 'VERBAL' as QuestionCategory,
      questionType: 'PERSONALITY' as const,
      personalityDimensionId: '1',
      answerWeights: {
        A: 1, // Avoids communication
        B: 2, // Reluctant communicator
        C: 3, // Neutral
        D: 4, // Proactive communicator
        E: 5, // Highly proactive
      },
    },
  ];

  const answers = {
    pers1: { answerIndex: 1, timeTaken: 30 }, // Answer 'B' = weight 4
    pers2: { answerIndex: 4, timeTaken: 25 }, // Answer 'E' = weight 5
  };

  const result = await calculateTestScore(
    'PERSONALITY',
    answers,
    personalityQuestions,
    personalityDimensions
  );

  console.log('Personality-only Results:', {
    testType: result.testType,
    personalityScores: result.personalityScores,
    personalityProfile: result.personalityProfile,
  });

  return result;
}
