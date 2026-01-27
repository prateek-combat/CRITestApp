import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authLogger } from '@/lib/logger';

// PATCH /api/admin/users/[id] - Update user role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: any = null;
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    session = admin.session;

    // Only SUPER_ADMIN can change user roles
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'SUPER_ADMIN access required' },
        { status: 403 }
      );
    }

    const { role } = await request.json();
    const resolvedParams = await params;
    const userId = resolvedParams.id;

    if (!role) {
      return NextResponse.json(
        { message: 'Role is required' },
        { status: 400 }
      );
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ message: 'Invalid role' }, { status: 400 });
    }

    // Prevent user from changing their own role
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
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
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    const resolvedParams = await params;
    authLogger.error(
      'Error updating user role',
      {
        userId: resolvedParams.id,
        adminId: session?.user?.id,
      },
      error as Error
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete admin user (removes admin access, preserves data)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session: any = null;
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    session = admin.session;

    // Only SUPER_ADMIN can delete users
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { message: 'SUPER_ADMIN access required' },
        { status: 403 }
      );
    }

    const resolvedParams = await params;
    const userId = resolvedParams.id;

    // Prevent user from deleting themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { message: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        _count: {
          select: {
            tests: true,
            invitations: true,
            publicTestLinks: true,
          },
        },
      },
    });

    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if user has created content
    const hasContent =
      existingUser._count.tests > 0 ||
      existingUser._count.invitations > 0 ||
      existingUser._count.publicTestLinks > 0;

    if (hasContent) {
      // User has created content - we cannot delete them due to foreign key constraints
      // Return an error message explaining the situation
      authLogger.warn('Attempted to delete admin user with existing content', {
        userId: userId,
        userEmail: existingUser.email,
        adminId: session.user.id,
        adminEmail: session.user.email,
        existingData: {
          tests: existingUser._count.tests,
          invitations: existingUser._count.invitations,
          publicTestLinks: existingUser._count.publicTestLinks,
        },
      });

      return NextResponse.json(
        {
          message: `Cannot delete ${existingUser.email} - user has created content (${existingUser._count.tests} tests, ${existingUser._count.invitations} invitations, ${existingUser._count.publicTestLinks} public links). To remove admin access, change their role to a non-admin role first, or delete their content.`,
          action: 'deletion_blocked',
          hasContent: true,
          contentCount: {
            tests: existingUser._count.tests,
            invitations: existingUser._count.invitations,
            publicTestLinks: existingUser._count.publicTestLinks,
          },
        },
        { status: 400 }
      );
    } else {
      // User has no content, safe to delete completely
      await prisma.user.delete({
        where: { id: userId },
      });

      authLogger.info('Admin user deleted completely', {
        deletedUserId: userId,
        deletedUserEmail: existingUser.email,
        adminId: session.user.id,
        adminEmail: session.user.email,
      });

      return NextResponse.json({
        message: `Admin user ${existingUser.email} deleted successfully.`,
        action: 'user_deleted',
      });
    }
  } catch (error) {
    const resolvedParams = await params;
    authLogger.error(
      'Error deleting admin user',
      {
        userId: resolvedParams.id,
        adminId: session?.user?.id,
      },
      error as Error
    );
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
