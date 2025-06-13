#!/usr/bin/env node

/**
 * Quick setup script for local admin user
 * Run this when you can't connect to the database but need to test OAuth
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupLocalAdmin() {
  console.log('🔧 Setting up local admin user for OAuth testing...');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@combatrobotics.in' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@combatrobotics.in',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    console.log('   Password: admin123');
    console.log('');
    console.log(
      '🎉 You can now sign in with Google using admin@combatrobotics.in'
    );
  } catch (error) {
    console.error('❌ Error setting up admin user:', error.message);

    if (error.code === 'P1001') {
      console.log('');
      console.log('💡 Database connection failed. For local testing:');
      console.log('   1. Use the development bypass in auth.ts');
      console.log('   2. Sign in with any @combatrobotics.in Google account');
      console.log(
        '   3. The system will automatically grant SUPER_ADMIN access'
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

setupLocalAdmin().catch(console.error);
