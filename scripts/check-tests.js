const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTests() {
  try {
    console.log('🔍 Checking all tests in database...\n');

    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        isArchived: true,
        createdAt: true,
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log('📋 All Tests in Database:');
    if (tests.length === 0) {
      console.log('   ❌ No tests found');
    } else {
      tests.forEach((test, index) => {
        console.log(`${index + 1}. ${test.title}`);
        console.log(`   ID: ${test.id}`);
        console.log(`   Created: ${test.createdAt.toISOString()}`);
        console.log(`   Archived: ${test.isArchived ? 'Yes' : 'No'}`);
        console.log(`   Questions: ${test._count.questions}`);
        console.log(`   Invitations: ${test._count.invitations}`);
        console.log(`   Attempts: ${test._count.testAttempts}`);
        console.log('');
      });
    }

    // Also check users
    console.log('👥 Checking admin users...\n');
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    if (users.length === 0) {
      console.log('   ❌ No admin users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(
          `   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() ||
            'Not set'
        );
        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkTests();
}

module.exports = { checkTests };
