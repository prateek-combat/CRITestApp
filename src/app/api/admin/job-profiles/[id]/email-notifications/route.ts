import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptionsSimple } from '@/lib/auth-simple';
import { prisma } from '@/lib/prisma';

// GET - Fetch email notification settings for a job profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobProfileId } = params;

    // Check if user has admin access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if job profile exists
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Fetch email notification settings
    const settings = await prisma.emailNotificationSettings.findUnique({
      where: { jobProfileId },
    });

    if (!settings) {
      return NextResponse.json({ settings: null }, { status: 200 });
    }

    return NextResponse.json({
      settings: {
        id: settings.id,
        emails: settings.emails as string[],
        isEnabled: settings.isEnabled,
        subject: settings.subject,
        template: settings.template,
      },
    });
  } catch (error) {
    console.error('Error fetching email notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update email notification settings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptionsSimple);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: jobProfileId } = params;
    const body = await request.json();
    const { emails, isEnabled, subject, template } = body;

    // Validate input
    if (!Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails must be an array' },
        { status: 400 }
      );
    }

    if (typeof isEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'isEnabled must be a boolean' },
        { status: 400 }
      );
    }

    if (!subject || typeof subject !== 'string') {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!template || typeof template !== 'string') {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(
      (email: string) => !emailRegex.test(email)
    );
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if user has admin access
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if job profile exists
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
    });

    if (!jobProfile) {
      return NextResponse.json(
        { error: 'Job profile not found' },
        { status: 404 }
      );
    }

    // Create or update settings
    const settings = await prisma.emailNotificationSettings.upsert({
      where: { jobProfileId },
      update: {
        emails,
        isEnabled,
        subject,
        template,
        updatedAt: new Date(),
      },
      create: {
        jobProfileId,
        emails,
        isEnabled,
        subject,
        template,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      settings: {
        id: settings.id,
        emails: settings.emails as string[],
        isEnabled: settings.isEnabled,
        subject: settings.subject,
        template: settings.template,
      },
    });
  } catch (error) {
    console.error('Error saving email notification settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
