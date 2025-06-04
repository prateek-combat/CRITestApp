import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/admin/users - List all admin users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Add new admin user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can add new admins
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized - Super Admin required' },
        { status: 403 }
      );
    }

    const { email, firstName, lastName, role } = await request.json();

    if (!email || !role) {
      return NextResponse.json(
        { message: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin role
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: 'User updated to admin role successfully',
        user: updatedUser,
      });
    } else {
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName: firstName || '',
          lastName: lastName || '',
          passwordHash: '', // Google users don't need password
          role,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: 'Admin user created successfully',
        user: newUser,
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
