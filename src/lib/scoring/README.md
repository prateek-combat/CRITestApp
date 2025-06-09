# Scoring Engine Documentation

This directory contains the comprehensive scoring system for the testing platform, supporting both objective (right/wrong) questions and personality assessment questions with weighted scoring.

## Files Overview

- `scoringEngine.ts` - Main scoring engine that handles both objective and personality scoring
- `personalityScoring.ts` - Dedicated personality scoring engine with weighted calculations
- `example-usage.ts` - Usage examples and demonstration code

## Features

### 1. **Dual Scoring System**
- **Objective Scoring**: Traditional right/wrong answers with percentile calculations
- **Personality Scoring**: Weighted scoring per personality dimension
- **Mixed Tests**: Combines both objective and personality questions in a single test

### 2. **Personality Dimensions**
- Create custom personality dimensions (e.g., "Safety-First Risk Management")
- Each dimension has a unique code and description
- Questions are linked to specific dimensions

### 3. **Weighted Scoring**
- Each personality question has answer weights (e.g., {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1})
- Calculates average scores per dimension
- Tracks number of questions answered vs. total questions

### 4. **Comprehensive Results**
- Raw scores and percentiles for objective questions
- Personality scores per dimension with averages
- Detailed personality profile with summary
- Category breakdowns for objective questions

## TypeScript Interfaces

### Core Interfaces

```typescript
interface PersonalityDimension {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface PersonalityScore {
  dimensionId: string;
  dimensionName: string;
  dimensionCode: string;
  averageScore: number;
  questionsAnswered: number;
  totalQuestions: number;
  rawScores: number[];
}

interface CombinedScoringResult {
  testType: 'OBJECTIVE' | 'PERSONALITY' | 'MIXED';
  rawScore: number;
  percentile?: number;
  categorySubScores: any;
  personalityScores?: Record<string, any>;
  personalityProfile?: Record<string, any>;
}
```

## Usage Examples

### 1. Mixed Test (Objective + Personality)

```typescript
import { calculateTestScore } from './scoringEngine';

const personalityDimensions = [
  {
    id: '1',
    name: 'Safety-First Risk Management',
    code: 'SAFETY_RISK_MGMT',
    description: 'Measures approach to safety and risk assessment'
  }
];

const questions = [
  // Objective question
  {
    id: 'obj1',
    category: 'LOGICAL',
    correctAnswerIndex: 2,
    questionType: 'OBJECTIVE'
  },
  // Personality question
  {
    id: 'pers1',
    category: 'LOGICAL',
    questionType: 'PERSONALITY',
    personalityDimensionId: '1',
    answerWeights: {
      'A': 5, // Strongly safety-focused
      'B': 4, // Moderately safety-focused  
      'C': 3, // Neutral
      'D': 2, // Less safety-focused
      'E': 1  // Not safety-focused
    }
  }
];

const answers = {
  'obj1': { answerIndex: 2, timeTaken: 30 }, // Correct answer
  'pers1': { answerIndex: 0, timeTaken: 45 } // Answer 'A' = weight 5
};

const result = await calculateTestScore('MIXED', answers, questions, personalityDimensions);
```

### 2. Objective-Only Test (Backward Compatible)

```typescript
const objectiveQuestions = [
  {
    id: 'obj1',
    category: 'LOGICAL',
    correctAnswerIndex: 1,
    questionType: 'OBJECTIVE'
  }
];

const answers = {
  'obj1': { answerIndex: 1, timeTaken: 25 }
};

const result = await calculateTestScore('OBJECTIVE', answers, objectiveQuestions);
```

### 3. Personality-Only Test

```typescript
const result = await calculateTestScore('PERSONALITY', answers, personalityQuestions, dimensions);
```

## Personality Scoring Algorithm

### 1. **Answer Weight Mapping**
- Answer indices (0, 1, 2, 3, 4) map to answer options (A, B, C, D, E)
- Each option has a weight (typically 1-5 scale)
- Example: `{"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}`

### 2. **Dimension Score Calculation**
```
Dimension Average = Sum of all answer weights / Number of questions answered
```

### 3. **Overall Personality Score**
```
Overall Average = Sum of all dimension averages / Number of dimensions with scores
```

### 4. **Completion Tracking**
- Tracks questions answered vs. total questions per dimension
- Calculates overall completion rate
- Handles partial completions gracefully

## Database Storage

### Personality Scores Format
```json
{
  "SAFETY_RISK_MGMT": {
    "averageScore": 4.2,
    "questionsAnswered": 5,
    "totalQuestions": 6
  },
  "LEADERSHIP": {
    "averageScore": 3.8,
    "questionsAnswered": 4,
    "totalQuestions": 4
  }
}
```

### Personality Profile Format
```json
{
  "summary": "Personality assessment completion: 90.0%. Overall personality score: 4.00. Top dimensions: Safety-First Risk Management: 4.20, Leadership: 3.80",
  "overallSummary": {
    "totalPersonalityQuestions": 10,
    "answeredPersonalityQuestions": 9,
    "completionRate": 90.0,
    "averageAcrossDimensions": 4.0
  },
  "detailedScores": [...]
}
```

## Validation

### Question Validation
- Ensures all personality questions have answer weights
- Validates weight format and values
- Checks for non-negative numeric weights
- Provides detailed error messages

### Error Handling
- Graceful degradation if personality scoring fails
- Continues with objective scoring only
- Logs warnings for debugging
- Validates input data integrity

## Backward Compatibility

The new system maintains full backward compatibility:
- Existing objective tests continue to work unchanged
- Legacy functions are preserved and route to new system
- Database schema is extended, not modified
- All existing APIs remain functional

## Migration Guide

### For Existing Tests
1. No changes required for pure objective tests
2. Add `questionType: 'OBJECTIVE'` for clarity (optional)
3. Existing scoring calls work without modification

### For New Personality Tests
1. Create personality dimensions in database
2. Set `questionType: 'PERSONALITY'` on personality questions
3. Add `personalityDimensionId` and `answerWeights` to questions
4. Pass personality dimensions to scoring function

### For Mixed Tests
1. Mix both question types in the same test
2. Use `testType: 'MIXED'` when calling scoring function
3. System automatically detects and handles both types 