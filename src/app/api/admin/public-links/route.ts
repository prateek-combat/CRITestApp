import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicLinks = await prisma.publicTestLink.findMany({
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(publicLinks);
  } catch (error) {
    console.error('Error fetching public links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public links' },
      { status: 500 }
    );
  }
}
