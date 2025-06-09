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
