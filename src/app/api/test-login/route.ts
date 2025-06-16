import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email, password, debugKey } = await request.json();

    if (debugKey !== 'debug-oauth-2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    console.log('Testing login for:', email);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        email,
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    return NextResponse.json({
      success: passwordMatch,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      },
      passwordMatch,
      passwordHashLength: user.passwordHash.length,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
