import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

// Simplified debug version of PUT route to isolate Vercel issues
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[DEBUG] Starting simplified PUT route');
    
    const session = await getServerSession(authOptionsSimple);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      console.log('[DEBUG] Auth failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[DEBUG] Auth passed');
    const { id } = await params;
    const body = await request.json();
    console.log('[DEBUG] Request parsed, ID:', id);
    
    // Simple validation
    if (!body.name || !body.positionIds?.length || !body.testIds?.length) {
      console.log('[DEBUG] Validation failed');
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
    }
    
    console.log('[DEBUG] Validation passed');
    
    // Test simple database connection first
    try {
      console.log('[DEBUG] Testing database connection...');
      const testQuery = await prisma.jobProfile.findUnique({
        where: { id },
        select: { id: true, name: true }
      });
      console.log('[DEBUG] Database connection test result:', !!testQuery);
    } catch (dbError) {
      console.log('[DEBUG] Database connection failed:', dbError);
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    
    // Try the update without transaction first
    try {
      console.log('[DEBUG] Attempting simple update...');
      const updated = await prisma.jobProfile.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
        },
        select: { id: true, name: true, updatedAt: true }
      });
      console.log('[DEBUG] Simple update successful');
      
      return NextResponse.json({
        success: true,
        message: 'Debug update successful',
        data: updated
      });
    } catch (updateError) {
      console.log('[DEBUG] Simple update failed:', updateError);
      return NextResponse.json({ 
        error: 'Update failed',
        details: updateError instanceof Error ? updateError.message : String(updateError)
      }, { status: 500 });
    }
    
  } catch (error) {
    console.log('[DEBUG] Route failed:', {
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3) : undefined,
    });
    return NextResponse.json({ 
      error: 'Debug route failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
