import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendReminderEmail, type ReminderEmailData } from '@/lib/email';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/invitations/send-reminders:
 *   post:
 *     summary: Send reminder emails for pending invitations
 *     description: Sends reminder emails to candidates with pending invitations based on criteria.
 *     tags:
 *       - Invitations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               invitationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific invitation IDs to send reminders for
 *               reminderType:
 *                 type: string
 *                 enum: [first, second, final]
 *                 description: Type of reminder to send
 *               daysBeforeExpiry:
 *                 type: number
 *                 description: Send reminders for invitations expiring within this many days
 *     responses:
 *       200:
 *         description: Reminders sent successfully.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Failed to send reminders.
 */
export async function POST(request: NextRequest) {
  try {
    const {
      invitationIds,
      reminderType = 'first',
      daysBeforeExpiry = 7,
    } = await request.json();

    let invitations;

    if (
      invitationIds &&
      Array.isArray(invitationIds) &&
      invitationIds.length > 0
    ) {
      // Send reminders for specific invitations
      invitations = await prisma.invitation.findMany({
        where: {
          id: { in: invitationIds },
          status: { in: ['PENDING', 'SENT', 'OPENED'] },
        },
        include: {
          test: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else {
      // Send reminders for invitations expiring soon
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + daysBeforeExpiry);

      invitations = await prisma.invitation.findMany({
        where: {
          status: { in: ['PENDING', 'SENT', 'OPENED'] },
          expiresAt: {
            lte: expiryThreshold,
            gte: new Date(), // Only future expiry dates
          },
        },
        include: {
          test: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    if (invitations.length === 0) {
      return NextResponse.json({
        message: 'No eligible invitations found for reminders',
        totalSent: 0,
        results: [],
      });
    }

    const results = [];

    for (const invitation of invitations) {
      try {
        const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/test/${invitation.id}`;
        const expiryDate =
          invitation.expiresAt ||
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
        const daysUntilExpiry = Math.ceil(
          (new Date(expiryDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        );

        const reminderData: ReminderEmailData = {
          candidateEmail: invitation.candidateEmail || '',
          testTitle: invitation.test.title,
          testLink,
          expiresAt: new Date(expiryDate),
          reminderType: reminderType as 'first' | 'second' | 'final',
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
        };

        const emailResult = await sendReminderEmail(reminderData);

        results.push({
          invitationId: invitation.id,
          email: invitation.candidateEmail,
          testTitle: invitation.test.title,
          daysUntilExpiry: Math.max(0, daysUntilExpiry),
          success: emailResult.success,
          ...(emailResult.messageId && { messageId: emailResult.messageId }),
          ...(emailResult.error && { error: emailResult.error }),
        });

        // Log reminder activity (you could enhance this to track reminder history)
        if (emailResult.success) {
          console.log(
            `Reminder sent: ${reminderType} reminder for ${invitation.candidateEmail} - Test: ${invitation.test.title}`
          );
        }
      } catch (error) {
        results.push({
          invitationId: invitation.id,
          email: invitation.candidateEmail,
          testTitle: invitation.test.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Reminder process completed`,
      summary: {
        totalProcessed: invitations.length,
        totalSent,
        totalFailed,
        reminderType,
      },
      results,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json(
      { error: 'Failed to send reminders' },
      { status: 500 }
    );
  }
}
