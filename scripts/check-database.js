#!/usr/bin/env node

/**
 * Database check script to see what data exists
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database connection and data...\n');

  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Check tests
    console.log('📝 TESTS:');
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            invitations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (tests.length === 0) {
      console.log('   ❌ No tests found in database');
    } else {
      console.log(`   ✅ Found ${tests.length} tests:`);
      tests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.title}`);
        console.log(`      ID: ${test.id}`);
        console.log(`      Questions: ${test._count.questions}`);
        console.log(`      Invitations: ${test._count.invitations}`);
        console.log(`      Created: ${test.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check questions
    console.log('❓ QUESTIONS:');
    const questionCount = await prisma.question.count();
    console.log(`   Total questions: ${questionCount}`);

    if (questionCount > 0) {
      const sampleQuestions = await prisma.question.findMany({
        select: {
          id: true,
          promptText: true,
          category: true,
          testId: true,
        },
        take: 3,
      });

      console.log('   Sample questions:');
      sampleQuestions.forEach((q, index) => {
        console.log(`   ${index + 1}. ${q.promptText.substring(0, 50)}...`);
        console.log(`      Category: ${q.category}`);
        console.log(`      Test ID: ${q.testId}`);
        console.log('');
      });
    }

    // Check users
    console.log('👥 USERS:');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (users.length === 0) {
      console.log('   ❌ No users found in database');
    } else {
      console.log(`   ✅ Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.role})`);
        console.log(`      Name: ${user.firstName} ${user.lastName}`);
        console.log(`      Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Check invitations
    console.log('📧 INVITATIONS:');
    const invitationCount = await prisma.invitation.count();
    console.log(`   Total invitations: ${invitationCount}`);

    // Check test attempts
    console.log('🎯 TEST ATTEMPTS:');
    const attemptCount = await prisma.testAttempt.count();
    console.log(`   Total test attempts: ${attemptCount}`);

    console.log('\n🎉 Database check completed!');
  } catch (error) {
    console.error('❌ Database error:', error.message);

    if (error.code === 'P1001') {
      console.log('\n💡 Database connection failed. Possible solutions:');
      console.log('   1. Check if your Neon database is active');
      console.log('   2. Verify the DATABASE_URL in your .env file');
      console.log('   3. Check if your IP is whitelisted in Neon dashboard');
      console.log('   4. Try running: npx prisma db push');
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);
