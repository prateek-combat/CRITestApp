import { prisma } from '@/lib/prisma';
import {
  CategoryWeights,
  WeightProfile,
  PREDEFINED_WEIGHT_PROFILES,
  validateCategoryWeights,
  calculateWeightedComposite,
} from '@/types/categories';

/**
 * Service for managing category weight profiles
 */
export class CategoryWeightService {
  /**
   * Initialize system weight profiles if they don't exist
   */
  static async initializeSystemProfiles(): Promise<void> {
    try {
      for (const predefinedProfile of PREDEFINED_WEIGHT_PROFILES) {
        const existing = await prisma.categoryWeightProfile.findUnique({
          where: { name: predefinedProfile.name },
        });

        if (!existing) {
          await prisma.categoryWeightProfile.create({
            data: {
              name: predefinedProfile.name,
              description: predefinedProfile.description,
              weights: predefinedProfile.weights,
              isDefault: predefinedProfile.isDefault,
              isSystem: true, // Mark as system profile
            },
          });
        }
      }
    } catch (error) {
      console.error('Error initializing system weight profiles:', error);
      throw error;
    }
  }

  /**
   * Get all weight profiles
   */
  static async getAllProfiles(): Promise<WeightProfile[]> {
    const profiles = await prisma.categoryWeightProfile.findMany({
      orderBy: [{ isDefault: 'desc' }, { isSystem: 'desc' }, { name: 'asc' }],
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return profiles.map((profile) => ({
      id: profile.id,
      name: profile.name,
      description: profile.description || undefined,
      weights: profile.weights as CategoryWeights,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }));
  }

  /**
   * Get default weight profile
   */
  static async getDefaultProfile(): Promise<WeightProfile | null> {
    const profile = await prisma.categoryWeightProfile.findFirst({
      where: { isDefault: true },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description || undefined,
      weights: profile.weights as CategoryWeights,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Get weight profile by ID
   */
  static async getProfileById(id: string): Promise<WeightProfile | null> {
    const profile = await prisma.categoryWeightProfile.findUnique({
      where: { id },
    });

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description || undefined,
      weights: profile.weights as CategoryWeights,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Create a new weight profile
   */
  static async createProfile(
    name: string,
    weights: CategoryWeights,
    description?: string,
    createdById?: string
  ): Promise<WeightProfile> {
    // Validate weights
    const validation = validateCategoryWeights(weights);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Check if name already exists
    const existing = await prisma.categoryWeightProfile.findUnique({
      where: { name },
    });

    if (existing) {
      throw new Error(`A weight profile with name "${name}" already exists`);
    }

    const profile = await prisma.categoryWeightProfile.create({
      data: {
        name,
        description,
        weights,
        createdById,
        isSystem: false,
      },
    });

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description || undefined,
      weights: profile.weights as CategoryWeights,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Update an existing weight profile
   */
  static async updateProfile(
    id: string,
    updates: {
      name?: string;
      description?: string;
      weights?: CategoryWeights;
    }
  ): Promise<WeightProfile> {
    // Check if profile exists and is not a system profile
    const existing = await prisma.categoryWeightProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Weight profile not found');
    }

    if (existing.isSystem) {
      throw new Error('Cannot update system weight profiles');
    }

    // Validate weights if provided
    if (updates.weights) {
      const validation = validateCategoryWeights(updates.weights);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }

    // Check if new name conflicts (if name is being updated)
    if (updates.name && updates.name !== existing.name) {
      const nameConflict = await prisma.categoryWeightProfile.findUnique({
        where: { name: updates.name },
      });

      if (nameConflict) {
        throw new Error(
          `A weight profile with name "${updates.name}" already exists`
        );
      }
    }

    const profile = await prisma.categoryWeightProfile.update({
      where: { id },
      data: updates,
    });

    return {
      id: profile.id,
      name: profile.name,
      description: profile.description || undefined,
      weights: profile.weights as CategoryWeights,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * Delete a weight profile
   */
  static async deleteProfile(id: string): Promise<void> {
    // Check if profile exists and is not a system profile
    const existing = await prisma.categoryWeightProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Weight profile not found');
    }

    if (existing.isSystem) {
      throw new Error('Cannot delete system weight profiles');
    }

    if (existing.isDefault) {
      throw new Error('Cannot delete the default weight profile');
    }

    await prisma.categoryWeightProfile.delete({
      where: { id },
    });
  }

  /**
   * Set a profile as default (unsets previous default)
   */
  static async setDefaultProfile(id: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // First, unset any existing default
      await tx.categoryWeightProfile.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      // Then set the new default
      await tx.categoryWeightProfile.update({
        where: { id },
        data: { isDefault: true },
      });
    });
  }

  /**
   * Calculate weighted scores for a test attempt using a specific profile
   */
  static async calculateWeightedScores(
    categorySubScores: Record<string, { correct: number; total: number }>,
    profileId?: string
  ): Promise<{
    weightedComposite: number;
    profileName: string;
    weights: CategoryWeights;
  }> {
    let profile: WeightProfile | null;

    if (profileId) {
      profile = await this.getProfileById(profileId);
      if (!profile) {
        throw new Error(`Weight profile with ID ${profileId} not found`);
      }
    } else {
      profile = await this.getDefaultProfile();
      if (!profile) {
        throw new Error('No default weight profile found');
      }
    }

    const weightedComposite = calculateWeightedComposite(
      categorySubScores,
      profile.weights
    );

    return {
      weightedComposite,
      profileName: profile.name,
      weights: profile.weights,
    };
  }
}

// For backward compatibility and ease of use
export const categoryWeightService = CategoryWeightService;
