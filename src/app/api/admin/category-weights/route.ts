import { NextRequest, NextResponse } from 'next/server';
import { CategoryWeightService } from '@/lib/categoryWeightService';
import { CategoryWeights, validateCategoryWeights } from '@/types/categories';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/category-weights
 * Get all weight profiles
 */
export async function GET() {
  try {
    const profiles = await CategoryWeightService.getAllProfiles();

    return NextResponse.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    logger.error(
      'Failed to fetch weight profiles',
      {
        operation: 'get_weight_profiles',
        service: 'admin_category_weights',
        method: 'GET',
        path: '/api/admin/category-weights',
      },
      error as Error
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weight profiles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/category-weights
 * Create a new weight profile
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, weights } = body;

    // Validate required fields
    if (!name || !weights) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name and weights are required',
        },
        { status: 400 }
      );
    }

    // Validate weights format
    const validation = validateCategoryWeights(weights as CategoryWeights);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // Create the profile
    const profile = await CategoryWeightService.createProfile(
      name,
      weights as CategoryWeights,
      description
    );

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error(
      'Failed to create weight profile',
      {
        operation: 'create_weight_profile',
        service: 'admin_category_weights',
        method: 'POST',
        path: '/api/admin/category-weights',
      },
      error as Error
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create weight profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
