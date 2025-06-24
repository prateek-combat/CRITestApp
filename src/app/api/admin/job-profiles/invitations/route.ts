import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { PrismaClient } from '@prisma/client';
import { sendInvitationEmail, type InvitationEmailData } from '@/lib/email';

const prisma = new PrismaClient();

// GET /api/admin/job-profiles/invitations - Get all job profile invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all invitations with related data
    const invitations = await prisma.invitation.findMany({
      include: {
        test: {
          select: {
            id: true,
            title: true,
            positions: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data to include job profile information
    const transformedInvitations = invitations.map((invitation) => ({
      id: invitation.id,
      candidateEmail: invitation.candidateEmail,
      candidateName: invitation.candidateName,
      status: invitation.status,
      emailSent: invitation.status === 'SENT' || invitation.status === 'OPENED',
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      test: invitation.test,
      jobProfile: invitation.test?.positions?.[0]
        ? {
            id: invitation.test.positions[0].id,
            name: invitation.test.positions[0].name,
          }
        : null,
      jobProfiles: invitation.test?.positions || [],
      testAttempts: [], // TODO: Add test attempts data if needed
      createdBy: invitation.createdBy,
    }));

    return NextResponse.json(transformedInvitations);
  } catch (error) {
    console.error('Error fetching job profile invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/job-profiles/invitations - Create job profile invitations
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (
      !session?.user ||
      !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      jobProfileId,
      candidateEmail,
      candidateName,
      customMessage,
      emailText,
    } = body;

    if (!jobProfileId) {
      return NextResponse.json(
        { error: 'Job profile ID is required' },
        { status: 400 }
      );
    }

    // Get the job profile (position) with its tests
    const jobProfile = await prisma.position.findUnique({
      where: { id: jobProfileId },
      include: {
        testsMany: true,
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    if (jobProfile.testsMany.length === 0) {
      return NextResponse.json(
        { error: 'Job profile has no tests assigned' },
        { status: 400 }
      );
    }

    let results = [];
    let summary = {
      totalCreated: 0,
      totalFailed: 0,
      totalEmailsSent: 0,
      totalEmailsFailed: 0,
    };

    if (emailText) {
      // Bulk invitation handling
      const emails = emailText
        .split(/[,\n]/)
        .map((email: string) => email.trim())
        .filter((email: string) => email && email.includes('@'));

      for (const email of emails) {
        try {
          // For now, create invitations for the first test in the job profile
          // In a full implementation, you'd create a job profile invitation that tracks all tests
          const firstTest = jobProfile.testsMany[0];

          // Check if invitation already exists
          const existingInvitation = await prisma.invitation.findFirst({
            where: {
              candidateEmail: email,
              testId: firstTest.id,
              status: { in: ['PENDING', 'SENT'] },
            },
          });

          if (existingInvitation) {
            results.push({
              email,
              success: false,
              error: 'Invitation already exists for this email and test',
            });
            summary.totalFailed++;
            continue;
          }

          const invitation = await prisma.invitation.create({
            data: {
              candidateEmail: email,
              testId: firstTest.id,
              createdById: session.user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
          });

          // Send email
          const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/test/${invitation.id}`;
          const emailData: InvitationEmailData = {
            candidateEmail: email,
            testTitle: `${jobProfile.name} - ${firstTest.title}`,
            testLink,
            expiresAt: invitation.expiresAt,
            companyName: 'Combat Robotics India',
            customMessage:
              customMessage ||
              `You have been invited to complete the assessment for the ${jobProfile.name} position.`,
          };

          const emailResult = await sendInvitationEmail(emailData);

          if (emailResult.success) {
            // Update invitation to mark email as sent
            await prisma.invitation.update({
              where: { id: invitation.id },
              data: {
                status: 'SENT',
              },
            });
            summary.totalEmailsSent++;
          } else {
            summary.totalEmailsFailed++;
          }

          results.push({
            email,
            success: true,
            invitationId: invitation.id,
            emailSent: emailResult.success,
            emailError: emailResult.error,
          });
          summary.totalCreated++;
        } catch (error) {
          console.error(`Failed to create invitation for ${email}:`, error);
          results.push({
            email,
            success: false,
            error: 'Failed to create invitation',
          });
          summary.totalFailed++;
        }
      }
    } else if (candidateEmail) {
      // Single invitation handling
      try {
        const firstTest = jobProfile.testsMany[0];

        // Check if invitation already exists
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            candidateEmail: candidateEmail,
            testId: firstTest.id,
            status: { in: ['PENDING', 'SENT'] },
          },
        });

        if (existingInvitation) {
          return NextResponse.json(
            {
              error: 'An invitation already exists for this email and test',
            },
            { status: 400 }
          );
        }

        const invitation = await prisma.invitation.create({
          data: {
            candidateEmail: candidateEmail,
            candidateName: candidateName,
            testId: firstTest.id,
            createdById: session.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        });

        // Send email
        const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/test/${invitation.id}`;
        const emailData: InvitationEmailData = {
          candidateEmail: candidateEmail,
          testTitle: `${jobProfile.name} - ${firstTest.title}`,
          testLink,
          expiresAt: invitation.expiresAt,
          companyName: 'Combat Robotics India',
          customMessage:
            customMessage ||
            `You have been invited to complete the assessment for the ${jobProfile.name} position.`,
        };

        const emailResult = await sendInvitationEmail(emailData);

        if (emailResult.success) {
          // Update invitation to mark email as sent
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: {
              status: 'SENT',
            },
          });
          summary.totalEmailsSent = 1;
        } else {
          summary.totalEmailsFailed = 1;
        }

        results.push({
          email: candidateEmail,
          success: true,
          invitationId: invitation.id,
          emailSent: emailResult.success,
          emailError: emailResult.error,
        });
        summary.totalCreated = 1;
      } catch (error) {
        console.error(
          `Failed to create invitation for ${candidateEmail}:`,
          error
        );
        results.push({
          email: candidateEmail,
          success: false,
          error: 'Failed to create invitation',
        });
        summary.totalFailed = 1;
      }
    } else {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      results,
      summary,
      message: emailText
        ? `Bulk invitations processed: ${summary.totalCreated} created, ${summary.totalEmailsSent} emails sent`
        : `Invitation ${summary.totalEmailsSent > 0 ? 'sent' : 'created'} successfully`,
    });
  } catch (error) {
    console.error('Error processing job profile invitations:', error);
    return NextResponse.json(
      { error: 'Failed to process invitations' },
      { status: 500 }
    );
  }
}
