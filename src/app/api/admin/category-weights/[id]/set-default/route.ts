import { NextRequest, NextResponse } from 'next/server';
import { CategoryWeightService } from '@/lib/categoryWeightService';

/**
 * POST /api/admin/category-weights/[id]/set-default
 * Set a weight profile as the default
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await CategoryWeightService.setDefaultProfile(id);

    return NextResponse.json({
      success: true,
      message: 'Default weight profile updated successfully',
    });
  } catch (error) {
    console.error('Error setting default weight profile:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set default weight profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
