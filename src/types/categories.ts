import { QuestionCategory } from '@prisma/client';

// Export the Prisma enum directly
export { QuestionCategory };

// Common question categories with display names
export const CATEGORY_DISPLAY_NAMES: Record<QuestionCategory, string> = {
  LOGICAL: 'Logical Reasoning',
  VERBAL: 'Verbal Ability',
  NUMERICAL: 'Numerical Aptitude',
  ATTENTION_TO_DETAIL: 'Attention to Detail',
  OTHER: 'Other',
};

// Helper function to get display name for category
export function getCategoryDisplayName(category: QuestionCategory): string {
  return CATEGORY_DISPLAY_NAMES[category] || category;
}

// All available categories
export const ALL_CATEGORIES = Object.values(QuestionCategory);

// Default categories for backward compatibility (excluding OTHER for default selection)
export const DEFAULT_CATEGORIES: QuestionCategory[] = [
  QuestionCategory.LOGICAL,
  QuestionCategory.VERBAL,
  QuestionCategory.NUMERICAL,
  QuestionCategory.ATTENTION_TO_DETAIL,
];

// Check if category is a core category (not OTHER)
export function isCoreCategory(category: QuestionCategory): boolean {
  return DEFAULT_CATEGORIES.includes(category);
}

// ==================== NEW: CONFIGURABLE CATEGORY WEIGHTS ====================

/**
 * Interface for category weight configuration
 */
export interface CategoryWeights {
  LOGICAL: number;
  VERBAL: number;
  NUMERICAL: number;
  ATTENTION_TO_DETAIL: number;
  OTHER: number;
}

/**
 * Interface for a weight profile (named configuration)
 */
export interface WeightProfile {
  id: string;
  name: string;
  description?: string;
  weights: CategoryWeights;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Predefined weight profiles for common use cases
 */
export const PREDEFINED_WEIGHT_PROFILES: Omit<
  WeightProfile,
  'id' | 'createdAt' | 'updatedAt'
>[] = [
  {
    name: 'Equal Weights (Current)',
    description: 'All categories have equal importance (20% each)',
    weights: {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    },
    isDefault: true,
  },
  {
    name: 'Verbal Focused',
    description: 'High emphasis on verbal ability for communication roles',
    weights: {
      LOGICAL: 15,
      VERBAL: 50,
      NUMERICAL: 15,
      ATTENTION_TO_DETAIL: 15,
      OTHER: 5,
    },
    isDefault: false,
  },
  {
    name: 'Logical Reasoning Priority',
    description: 'Emphasis on logical thinking for technical roles',
    weights: {
      LOGICAL: 45,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 10,
      OTHER: 5,
    },
    isDefault: false,
  },
  {
    name: 'Analytical Balance',
    description: 'Balanced focus on logical and numerical abilities',
    weights: {
      LOGICAL: 30,
      VERBAL: 15,
      NUMERICAL: 35,
      ATTENTION_TO_DETAIL: 15,
      OTHER: 5,
    },
    isDefault: false,
  },
  {
    name: 'Detail-Oriented',
    description: 'High emphasis on attention to detail for quality roles',
    weights: {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 15,
      ATTENTION_TO_DETAIL: 40,
      OTHER: 5,
    },
    isDefault: false,
  },
];

/**
 * Validate that category weights sum to 100%
 */
export function validateCategoryWeights(weights: CategoryWeights): {
  isValid: boolean;
  error?: string;
} {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

  if (Math.abs(total - 100) > 0.01) {
    // Allow for small floating point errors
    return {
      isValid: false,
      error: `Weights must sum to 100%. Current total: ${total}%`,
    };
  }

  // Check for negative weights
  const negativeWeights = Object.entries(weights).filter(
    ([_, weight]) => weight < 0
  );
  if (negativeWeights.length > 0) {
    return {
      isValid: false,
      error: `Weights cannot be negative. Found: ${negativeWeights.map(([cat, weight]) => `${cat}: ${weight}%`).join(', ')}`,
    };
  }

  return { isValid: true };
}

/**
 * Get default weight profile
 */
export function getDefaultWeights(): CategoryWeights {
  return (
    PREDEFINED_WEIGHT_PROFILES.find((profile) => profile.isDefault)
      ?.weights || {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    }
  );
}

/**
 * Calculate weighted composite score from category scores
 */
export function calculateWeightedComposite(
  categoryScores: Record<string, { correct: number; total: number }>,
  weights: CategoryWeights
): number {
  let weightedSum = 0;
  let totalValidWeight = 0;

  Object.entries(weights).forEach(([category, weight]) => {
    const categoryData = categoryScores[category];
    if (categoryData && categoryData.total > 0) {
      const categoryPercentage =
        (categoryData.correct / categoryData.total) * 100;
      weightedSum += categoryPercentage * (weight / 100);
      totalValidWeight += weight;
    }
  });

  // Normalize by actual valid weights (in case some categories have no questions)
  return totalValidWeight > 0 ? (weightedSum * 100) / totalValidWeight : 0;
}

// ==================== END NEW SECTION ====================

// Common question categories - users can use these or create custom ones
export const COMMON_CATEGORIES = {
  LOGICAL: 'LOGICAL',
  VERBAL: 'VERBAL',
  NUMERICAL: 'NUMERICAL',
  ATTENTION_TO_DETAIL: 'ATTENTION_TO_DETAIL',
  SPATIAL: 'SPATIAL',
  GENERAL_KNOWLEDGE: 'GENERAL_KNOWLEDGE',
  TECHNICAL: 'TECHNICAL',
  ANALYTICAL: 'ANALYTICAL',
  CREATIVE: 'CREATIVE',
  LEADERSHIP: 'LEADERSHIP',
} as const;

export type CommonCategory = keyof typeof COMMON_CATEGORIES;

// Helper function to check if a category is a common one
export function isCommonCategory(category: string): category is CommonCategory {
  return Object.values(COMMON_CATEGORIES).includes(category as any);
}

// Default categories for backward compatibility
export const DEFAULT_CATEGORIES_LEGACY = [
  COMMON_CATEGORIES.LOGICAL,
  COMMON_CATEGORIES.VERBAL,
  COMMON_CATEGORIES.NUMERICAL,
  COMMON_CATEGORIES.ATTENTION_TO_DETAIL,
];

// Legacy type for backward compatibility
export type QuestionCategoryLegacy = CommonCategory | string;
