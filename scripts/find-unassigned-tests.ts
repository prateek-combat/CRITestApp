import { prisma } from '../src/lib/prisma';

async function findUnassignedTests() {
  console.log('Looking for tests without positions that have attempts...\n');

  try {
    // Get all tests
    const allTests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        positionId: true,
      },
    });

    console.log('Checking all tests for attempts...\n');

    for (const test of allTests) {
      const attemptCount = await prisma.testAttempt.count({
        where: {
          testId: test.id,
          status: 'COMPLETED',
        },
      });

      if (attemptCount > 0) {
        console.log(`📋 ${test.title}`);
        console.log(`   Attempts: ${attemptCount}`);
        console.log(
          `   Position: ${test.positionId ? 'Assigned' : '❌ NOT ASSIGNED'}`
        );
        console.log(`   Test ID: ${test.id}`);

        if (!test.positionId) {
          console.log(`   👉 This test needs a position assignment!\n`);
        } else {
          console.log('');
        }
      }
    }

    // Specifically check if there's a test similar to General Aptitude
    console.log(
      '\nLooking for tests with similar names to General Aptitude...'
    );
    const similarTests = await prisma.test.findMany({
      where: {
        OR: [
          { title: { contains: 'aptitude', mode: 'insensitive' } },
          { title: { contains: 'general', mode: 'insensitive' } },
          { title: { contains: 'combat', mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        positionId: true,
      },
    });

    console.log('\nSimilar tests found:');
    for (const test of similarTests) {
      const count = await prisma.testAttempt.count({
        where: { testId: test.id, status: 'COMPLETED' },
      });
      console.log(
        `- ${test.title} (${count} attempts, Position: ${test.positionId || 'None'})`
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
findUnassignedTests();
