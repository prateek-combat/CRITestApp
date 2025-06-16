import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * @swagger
 * /api/tests/{id}/notifications:
 *   get:
 *     summary: Get email notification settings for a test
 *     description: Retrieves the email notification configuration for a specific test.
 *     tags:
 *       - Tests
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully.
 *       403:
 *         description: Insufficient permissions.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to fetch notification settings.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Get test with notification settings
    const test = await prisma.test.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        emailNotificationsEnabled: true,
        notificationEmails: true,
        includeAnalytics: true,
      },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    return NextResponse.json({
      emailNotificationsEnabled: test.emailNotificationsEnabled,
      notificationEmails: test.notificationEmails,
      includeAnalytics: test.includeAnalytics,
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/tests/{id}/notifications:
 *   put:
 *     summary: Update email notification settings for a test
 *     description: Updates the email notification configuration for a specific test.
 *     tags:
 *       - Tests
 *       - Notifications
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Test ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotificationsEnabled:
 *                 type: boolean
 *               notificationEmails:
 *                 type: array
 *                 items:
 *                   type: string
 *               includeAnalytics:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully.
 *       403:
 *         description: Insufficient permissions.
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to update notification settings.
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin access
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { emailNotificationsEnabled, notificationEmails, includeAnalytics } =
      body;

    // Validate request data
    if (typeof emailNotificationsEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'emailNotificationsEnabled must be a boolean' },
        { status: 400 }
      );
    }

    if (!Array.isArray(notificationEmails)) {
      return NextResponse.json(
        { error: 'notificationEmails must be an array' },
        { status: 400 }
      );
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of notificationEmails) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: `Invalid email address: ${email}` },
          { status: 400 }
        );
      }
    }

    if (typeof includeAnalytics !== 'boolean') {
      return NextResponse.json(
        { error: 'includeAnalytics must be a boolean' },
        { status: 400 }
      );
    }

    // Check if test exists
    const existingTest = await prisma.test.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!existingTest) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Update notification settings
    const updatedTest = await prisma.test.update({
      where: { id },
      data: {
        emailNotificationsEnabled,
        notificationEmails,
        includeAnalytics,
      },
      select: {
        id: true,
        title: true,
        emailNotificationsEnabled: true,
        notificationEmails: true,
        includeAnalytics: true,
      },
    });

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings: {
        emailNotificationsEnabled: updatedTest.emailNotificationsEnabled,
        notificationEmails: updatedTest.notificationEmails,
        includeAnalytics: updatedTest.includeAnalytics,
      },
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
