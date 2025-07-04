import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);
    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the base URL from the request headers
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    const publicLinks = await prisma.publicTestLink.findMany({
      where: {
        timeSlotId: null, // Only get links that are not associated with a time slot
      },
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

    const formattedLinks = publicLinks.map((link: any) => ({
      id: link.id,
      testId: link.testId,
      testTitle: link.test.title,
      linkToken: link.linkToken,
      title: link.title,
      description: link.description,
      isActive: link.isActive,
      expiresAt: link.expiresAt?.toISOString(),
      maxUses: link.maxUses,
      usedCount: link.usedCount,
      attemptsCount: link._count.attempts,
      createdAt: link.createdAt.toISOString(),
      publicUrl: `${baseUrl}/public-test/${link.linkToken}`,
    }));

    return NextResponse.json(formattedLinks);
  } catch (error) {
    console.error('Error fetching public test links:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public test links' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
