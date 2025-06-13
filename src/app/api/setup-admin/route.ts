import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { APP_URL } from '@/lib/constants';

const prisma = new PrismaClient();

export async function POST() {
  try {
    console.log('🔧 Setting up admin user...');

    // Always create or update a test admin for debugging
    const testAdminEmail = 'test@admin.com';

    // Check if test admin already exists
    let testAdmin = await prisma.user.findUnique({
      where: { email: testAdminEmail },
    });

    if (testAdmin) {
      return NextResponse.json({
        message: 'Test admin user already exists',
        email: testAdminEmail,
        password: 'admin123',
        loginUrl: `${APP_URL}/admin/login`,
      });
    }

    // Create test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: testAdminEmail,
        passwordHash: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    return NextResponse.json({
      message: 'Test admin user created successfully!',
      email: testAdminEmail,
      password: 'admin123',
      loginUrl: `${APP_URL}/admin/login`,
    });
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin user', details: String(error) },
      { status: 500 }
    );
  }
}
