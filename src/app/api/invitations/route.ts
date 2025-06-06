import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/invitations:
 *   get:
 *     summary: Retrieve a list of invitations
 *     description: Fetches all invitations, possibly filterable in the future.
 *     tags:
 *       - Invitations
 *     responses:
 *       200:
 *         description: A list of invitations.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Invitation'
 *       500:
 *         description: Failed to fetch invitations.
 */
export async function GET() {
  try {
    const invitations = await prisma.invitation.findMany({
      include: {
        test: {
          select: {
            id: true,
            title: true,
          },
        },
        testAttempt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedInvitations = invitations.map((invitation: any) => ({
      id: invitation.id,
      email: invitation.candidateEmail,
      status: invitation.status,
      createdAt: invitation.createdAt.toISOString(),
      completedAt: invitation.testAttempt?.completedAt?.toISOString(),
      test: {
        id: invitation.test.id,
        title: invitation.test.title,
      },
      testAttempt: invitation.testAttempt
        ? {
            videoRecordingUrl: invitation.testAttempt.videoRecordingUrl,
          }
        : null,
    }));

    return NextResponse.json(formattedInvitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/invitations:
 *   post:
 *     summary: Create a new invitation
 *     description: Adds a new test invitation to the database.
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateInvitationInput'
 *     responses:
 *       201:
 *         description: Invitation created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Invitation'
 *       400:
 *         description: Bad request (e.g., missing required fields, invalid expiry date).
 *       404:
 *         description: Test or creator user not found.
 *       500:
 *         description: Failed to create invitation.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, testId } = await request.json();

    if (!email?.trim() || !testId?.trim()) {
      return NextResponse.json(
        { error: 'Email and test ID are required' },
        { status: 400 }
      );
    }

    // Get admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@combat.test',
          passwordHash: 'dummy',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
    }

    // Check if test exists
    const test = await prisma.test.findUnique({
      where: { id: testId },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        candidateEmail: email.trim(),
        testId: testId,
        createdById: adminUser.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    return NextResponse.json({
      id: invitation.id,
      email: invitation.candidateEmail,
      status: 'PENDING',
      createdAt: invitation.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}
