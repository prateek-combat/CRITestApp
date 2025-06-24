import { NextRequest, NextResponse } from 'next/server';
import { CategoryWeightService } from '@/lib/categoryWeightService';
import { CategoryWeights, validateCategoryWeights } from '@/types/categories';

/**
 * GET /api/admin/category-weights/[id]
 * Get a specific weight profile
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await CategoryWeightService.getProfileById(id);

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: 'Weight profile not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching weight profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch weight profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/category-weights/[id]
 * Update a weight profile
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, weights } = body;

    const updates: {
      name?: string;
      description?: string;
      weights?: CategoryWeights;
    } = {};

    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (weights !== undefined) {
      // Validate weights if provided
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
      updates.weights = weights as CategoryWeights;
    }

    const profile = await CategoryWeightService.updateProfile(id, updates);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error updating weight profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update weight profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/category-weights/[id]
 * Delete a weight profile
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CategoryWeightService.deleteProfile(id);

    return NextResponse.json({
      success: true,
      message: 'Weight profile deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting weight profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete weight profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
