import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import {
  sendJobProfileInvitationEmail,
  type JobProfileInvitationEmailData,
} from '@/lib/email';
import { prisma } from '@/lib/prisma';

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

    // Fetch all job profile invitations with related data
    const invitations = await prisma.jobProfileInvitation.findMany({
      include: {
        jobProfile: {
          include: {
            positions: {
              select: {
                id: true,
                name: true,
                department: true,
              },
            },
            testWeights: {
              include: {
                test: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
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
        testAttempts: {
          select: {
            id: true,
            status: true,
            completedAt: true,
            rawScore: true,
            percentile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform the data
    const transformedInvitations = invitations.map((invitation) => ({
      id: invitation.id,
      candidateEmail: invitation.candidateEmail,
      candidateName: invitation.candidateName,
      status: invitation.status,
      emailSent: invitation.status === 'SENT' || invitation.status === 'OPENED',
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      jobProfile: {
        id: invitation.jobProfile.id,
        name: invitation.jobProfile.name,
        positions: invitation.jobProfile.positions,
        tests: invitation.jobProfile.testWeights.map((tw) => ({
          id: tw.test.id,
          title: tw.test.title,
          weight: tw.weight,
        })),
      },
      testAttempts: invitation.testAttempts,
      createdBy: invitation.createdBy,
    }));

    return NextResponse.json(transformedInvitations);
  } catch (error) {
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

    // Get the job profile with its tests
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        positions: true,
        testWeights: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    if (jobProfile.testWeights.length === 0) {
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
          // Check if invitation already exists
          const existingInvitation =
            await prisma.jobProfileInvitation.findFirst({
              where: {
                candidateEmail: email,
                jobProfileId: jobProfileId,
                status: { in: ['PENDING', 'SENT'] },
              },
            });

          if (existingInvitation) {
            results.push({
              email,
              success: false,
              error: 'Invitation already exists for this email and job profile',
            });
            summary.totalFailed++;
            continue;
          }

          const invitation = await prisma.jobProfileInvitation.create({
            data: {
              candidateEmail: email,
              jobProfileId: jobProfileId,
              createdById: session.user.id,
              expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            },
          });

          // Send email
          const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/job-profile-test/${invitation.id}`;
          const positionNames = jobProfile.positions
            .map((p) => p.name)
            .join(', ');
          const testTitles = jobProfile.testWeights
            .map((tw) => tw.test.title)
            .join(', ');

          const emailData: JobProfileInvitationEmailData = {
            candidateEmail: email,
            candidateName: email.split('@')[0], // Extract name from email
            jobProfileName: jobProfile.name,
            positions: jobProfile.positions.map((p) => p.name),
            tests: jobProfile.testWeights.map((tw) => ({
              title: tw.test.title,
              questionsCount: tw.test._count?.questions,
            })),
            customMessage:
              customMessage ||
              `You have been invited to complete the assessment for the ${jobProfile.name} position.`,
            invitationLink: testLink,
            expiresAt: invitation.expiresAt,
          };

          const emailResult = await sendJobProfileInvitationEmail(emailData);

          if (emailResult.success) {
            // Update invitation to mark email as sent
            await prisma.jobProfileInvitation.update({
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
        // Check if invitation already exists
        const existingInvitation = await prisma.jobProfileInvitation.findFirst({
          where: {
            candidateEmail: candidateEmail,
            jobProfileId: jobProfileId,
            status: { in: ['PENDING', 'SENT'] },
          },
        });

        if (existingInvitation) {
          return NextResponse.json(
            {
              error:
                'An invitation already exists for this email and job profile',
            },
            { status: 400 }
          );
        }

        const invitation = await prisma.jobProfileInvitation.create({
          data: {
            candidateEmail: candidateEmail,
            candidateName: candidateName,
            jobProfileId: jobProfileId,
            createdById: session.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          },
        });

        // Send email
        const testLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/job-profile-test/${invitation.id}`;
        const positionNames = jobProfile.positions
          .map((p) => p.name)
          .join(', ');
        const testTitles = jobProfile.testWeights
          .map((tw) => tw.test.title)
          .join(', ');

        const emailData: JobProfileInvitationEmailData = {
          candidateEmail: candidateEmail,
          candidateName: candidateEmail.split('@')[0], // Extract name from email
          jobProfileName: jobProfile.name,
          positions: jobProfile.positions.map((p) => p.name),
          tests: jobProfile.testWeights.map((tw) => ({
            title: tw.test.title,
            questionsCount: tw.test._count?.questions,
          })),
          customMessage:
            customMessage ||
            `You have been invited to complete the assessment for the ${jobProfile.name} position.`,
          invitationLink: testLink,
          expiresAt: invitation.expiresAt,
        };

        const emailResult = await sendJobProfileInvitationEmail(emailData);

        if (emailResult.success) {
          // Update invitation to mark email as sent
          await prisma.jobProfileInvitation.update({
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
    return NextResponse.json(
      { error: 'Failed to process invitations' },
      { status: 500 }
    );
  }
}
