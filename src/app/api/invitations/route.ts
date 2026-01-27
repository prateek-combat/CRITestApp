import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import {
  sendInvitationEmail,
  sendBulkInvitations,
  parseMultipleEmails,
  validateEmail,
  type InvitationEmailData,
} from '@/lib/email';
import { APP_URL } from '@/lib/constants';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { requireAdmin } from '@/lib/auth';

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
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

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
            id: invitation.testAttempt.id,
            videoRecordingUrl: invitation.testAttempt.videoRecordingUrl,
          }
        : null,
    }));

    return NextResponse.json(formattedInvitations);
  } catch (error) {
    logger.error(
      'Failed to fetch invitations',
      {
        operation: 'get_invitations',
        service: 'invitations',
        method: 'GET',
        path: '/api/invitations',
      },
      error as Error
    );
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
 *     summary: Create a new invitation or bulk invitations
 *     description: Adds new test invitation(s) to the database and optionally sends email(s).
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/CreateInvitationInput'
 *               - $ref: '#/components/schemas/CreateBulkInvitationInput'
 *     responses:
 *       201:
 *         description: Invitation(s) created successfully.
 *       400:
 *         description: Bad request (e.g., missing required fields, invalid emails).
 *       404:
 *         description: Test not found.
 *       500:
 *         description: Failed to create invitation(s).
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if ('response' in admin) {
      return admin.response;
    }
    const session = admin.session;

    if (!session.user.id) {
      return NextResponse.json(
        { error: 'Authenticated user is missing an identifier' },
        { status: 400 }
      );
    }

    const actingUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!actingUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Check if this is a bulk invitation request
    if (body.emails || body.emailText) {
      return await handleBulkInvitations(body, actingUser);
    } else {
      return await handleSingleInvitation(body, actingUser);
    }
  } catch (error) {
    logger.error(
      'Failed to process invitation request',
      {
        operation: 'process_invitation_request',
        service: 'invitations',
        method: 'POST',
        path: '/api/invitations',
      },
      error as Error
    );
    return NextResponse.json(
      { error: 'Failed to process invitation request' },
      { status: 500 }
    );
  }
}

// Handle single invitation
async function handleSingleInvitation(body: any, actingUser: Pick<User, 'id'>) {
  const { email, testId, sendEmail = true, customMessage } = body;

  if (!email?.trim() || !testId?.trim()) {
    return NextResponse.json(
      { error: 'Email and test ID are required' },
      { status: 400 }
    );
  }

  if (!validateEmail(email.trim())) {
    return NextResponse.json(
      { error: 'Invalid email address' },
      { status: 400 }
    );
  }

  // Check if test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  // Check if invitation already exists for this email and test
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      candidateEmail: email.trim(),
      testId: testId,
      status: {
        in: ['PENDING', 'SENT', 'OPENED'],
      },
    },
  });

  if (existingInvitation) {
    return NextResponse.json(
      { error: 'An active invitation already exists for this email and test' },
      { status: 400 }
    );
  }

  // Create invitation
  const invitation = await prisma.invitation.create({
    data: {
      candidateEmail: email.trim(),
      testId: testId,
      createdById: actingUser.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  let emailResult = null;

  // Send email if requested
  if (sendEmail) {
    const testLink = `${APP_URL}/test/${invitation.id}`;

    const emailData: InvitationEmailData = {
      candidateEmail: email.trim(),
      testTitle: test.title,
      testLink,
      expiresAt: invitation.expiresAt,
      customMessage,
    };

    emailResult = await sendInvitationEmail(emailData);

    // Update invitation status if email was sent successfully
    if (emailResult.success) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'SENT' },
      });
    }
  }

  return NextResponse.json(
    {
      id: invitation.id,
      email: invitation.candidateEmail,
      status: emailResult?.success ? 'SENT' : 'PENDING',
      createdAt: invitation.createdAt.toISOString(),
      emailSent: sendEmail,
      emailResult: emailResult
        ? {
            success: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error,
          }
        : null,
    },
    { status: 201 }
  );
}

// Handle bulk invitations
async function handleBulkInvitations(body: any, actingUser: Pick<User, 'id'>) {
  const { emails, emailText, testId, sendEmail = true, customMessage } = body;

  if (!testId?.trim()) {
    return NextResponse.json({ error: 'Test ID is required' }, { status: 400 });
  }

  // Parse emails
  let emailList: string[] = [];

  if (emails && Array.isArray(emails)) {
    emailList = emails;
  } else if (emailText && typeof emailText === 'string') {
    const { valid, invalid } = parseMultipleEmails(emailText);
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: 'Some email addresses are invalid',
          invalidEmails: invalid,
        },
        { status: 400 }
      );
    }
    emailList = valid;
  } else {
    return NextResponse.json(
      { error: 'Either emails array or emailText is required' },
      { status: 400 }
    );
  }

  if (emailList.length === 0) {
    return NextResponse.json(
      { error: 'No valid email addresses provided' },
      { status: 400 }
    );
  }

  // Check if test exists
  const test = await prisma.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    return NextResponse.json({ error: 'Test not found' }, { status: 404 });
  }

  const results: any[] = [];
  const emailInvitations: InvitationEmailData[] = [];

  // Process each email
  for (const email of emailList) {
    try {
      // Check if invitation already exists
      const existingInvitation = await prisma.invitation.findFirst({
        where: {
          candidateEmail: email.trim(),
          testId: testId,
          status: {
            in: ['PENDING', 'SENT', 'OPENED'],
          },
        },
      });

      if (existingInvitation) {
        results.push({
          email: email.trim(),
          success: false,
          error: 'Active invitation already exists',
          invitationId: null,
        });
        continue;
      }

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          candidateEmail: email.trim(),
          testId: testId,
          createdById: actingUser.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Prepare for bulk email sending
      if (sendEmail) {
        const testLink = `${APP_URL}/test/${invitation.id}`;

        emailInvitations.push({
          candidateEmail: email.trim(),
          testTitle: test.title,
          testLink,
          expiresAt: invitation.expiresAt,
          customMessage,
        });
      }

      results.push({
        email: email.trim(),
        success: true,
        invitationId: invitation.id,
        status: 'PENDING',
      });
    } catch (error) {
      results.push({
        email: email.trim(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        invitationId: null,
      });
    }
  }

  // Send bulk emails if requested
  let emailResults = null;
  if (sendEmail && emailInvitations.length > 0) {
    emailResults = await sendBulkInvitations(emailInvitations);

    // Update invitation statuses based on email results
    for (const emailResult of emailResults.results) {
      const invitation = results.find(
        (r) => r.email === emailResult.email && r.success
      );
      if (invitation && emailResult.success) {
        // Update status in database
        await prisma.invitation.update({
          where: { id: invitation.invitationId },
          data: { status: 'SENT' },
        });
        invitation.status = 'SENT';
        invitation.emailSent = true;
      }
    }
  }

  const totalCreated = results.filter((r) => r.success).length;
  const totalFailed = results.filter((r) => !r.success).length;
  const totalEmailsSent = emailResults?.totalSent || 0;
  const totalEmailsFailed = emailResults?.totalFailed || 0;

  return NextResponse.json(
    {
      message: `Bulk invitation process completed`,
      summary: {
        totalProcessed: emailList.length,
        totalCreated,
        totalFailed,
        totalEmailsSent,
        totalEmailsFailed,
      },
      results,
      emailResults: emailResults
        ? {
            success: emailResults.success,
            totalSent: emailResults.totalSent,
            totalFailed: emailResults.totalFailed,
            details: emailResults.results,
          }
        : null,
    },
    { status: 201 }
  );
}
