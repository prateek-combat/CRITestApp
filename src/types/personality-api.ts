// TypeScript types for Personality Dimensions API

export interface PersonalityDimensionResponse {
  id: string;
  name: string;
  description: string | null;
  code: string;
  questionsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalityDimensionDetailResponse
  extends PersonalityDimensionResponse {
  questions: PersonalityQuestionSummary[];
}

export interface PersonalityQuestionSummary {
  id: string;
  promptText: string;
  testId: string;
  test: {
    id: string;
    title: string;
  };
}

export interface CreatePersonalityDimensionRequest {
  name: string;
  description?: string;
  code: string;
}

export interface UpdatePersonalityDimensionRequest {
  name?: string;
  description?: string;
  code?: string;
}

export interface PersonalityDimensionListResponse
  extends Array<PersonalityDimensionResponse> {}

export interface DeletePersonalityDimensionResponse {
  message: string;
  deletedDimension: {
    id: string;
    name: string;
    code: string;
  };
}

// Test Personality Analysis Types
export interface TestPersonalityAnalysisResponse {
  testInfo: TestInfo;
  dimensionCoverage: DimensionCoverage[];
  dimensionComparison: DimensionComparison[];
  statistics: AnalysisStatistics;
  recommendations: Recommendation[];
}

export interface TestInfo {
  id: string;
  title: string;
  description: string | null;
  totalQuestions: number;
  personalityQuestions: number;
  objectiveQuestions: number;
  createdAt: string;
}

export interface DimensionCoverage {
  dimensionId: string;
  dimensionName: string;
  dimensionCode: string;
  dimensionDescription: string | null;
  questionCount: number;
  questions: PersonalityQuestionDetail[];
}

export interface PersonalityQuestionDetail {
  id: string;
  promptText: string;
  answerOptions: string[];
  answerWeights: Record<string, number> | null;
  category: string;
  createdAt: string;
}

export interface DimensionComparison {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isUsedInTest: boolean;
  questionCount: number;
}

export interface AnalysisStatistics {
  personalityQuestionPercentage: number;
  dimensionsUsed: number;
  totalAvailableDimensions: number;
  averageQuestionsPerDimension: number;
  testType: 'OBJECTIVE' | 'PERSONALITY' | 'MIXED';
}

export interface Recommendation {
  type: 'info' | 'warning' | 'suggestion';
  category:
    | 'personality_coverage'
    | 'dimension_coverage'
    | 'dimension_depth'
    | 'test_balance';
  message: string;
}

// Error Response Types
export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: ValidationError[];
  field?: string;
  questionsCount?: number;
}

// API Response Wrappers
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: ApiErrorResponse;
    };

// Helper type for API calls
export interface PersonalityDimensionsApiClient {
  list(): Promise<PersonalityDimensionListResponse>;
  get(id: string): Promise<PersonalityDimensionDetailResponse>;
  create(
    data: CreatePersonalityDimensionRequest
  ): Promise<PersonalityDimensionResponse>;
  update(
    id: string,
    data: UpdatePersonalityDimensionRequest
  ): Promise<PersonalityDimensionResponse>;
  delete(id: string): Promise<DeletePersonalityDimensionResponse>;
  getTestAnalysis(testId: string): Promise<TestPersonalityAnalysisResponse>;
}

// Utility type for form handling
export interface PersonalityDimensionFormData {
  name: string;
  description: string;
  code: string;
}

export interface PersonalityDimensionFormErrors {
  name?: string;
  description?: string;
  code?: string;
  general?: string;
}
