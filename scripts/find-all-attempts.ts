import { prisma } from '../src/lib/prisma';

async function findAllAttempts() {
  console.log('Searching for all test attempts...\n');

  try {
    // Find all tests with their attempt counts
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        positionId: true,
        position: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log('All tests in the system:');
    console.log('========================\n');

    for (const test of tests) {
      const completedCount = await prisma.testAttempt.count({
        where: {
          testId: test.id,
          status: 'COMPLETED',
        },
      });

      const totalCount = await prisma.testAttempt.count({
        where: {
          testId: test.id,
        },
      });

      const publicCount = await prisma.publicTestAttempt.count({
        where: {
          publicLink: {
            testId: test.id,
          },
          status: 'COMPLETED',
        },
      });

      if (totalCount > 0 || publicCount > 0) {
        console.log(`📋 ${test.title}`);
        console.log(`   Position: ${test.position?.name || 'Not assigned'}`);
        console.log(
          `   Regular attempts: ${completedCount} completed / ${totalCount} total`
        );
        console.log(`   Public attempts: ${publicCount} completed`);
        console.log(`   Test ID: ${test.id}\n`);
      }
    }

    // Also check for attempts with the word "General" or "Aptitude"
    console.log(
      '\nSearching for attempts with "General" or "Aptitude" in test name...'
    );

    const relevantAttempts = await prisma.testAttempt.findMany({
      where: {
        OR: [
          {
            test: {
              title: {
                contains: 'General',
                mode: 'insensitive',
              },
            },
          },
          {
            test: {
              title: {
                contains: 'Aptitude',
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        candidateName: true,
        status: true,
        test: {
          select: {
            title: true,
            positionId: true,
          },
        },
      },
      take: 10,
    });

    console.log(`Found ${relevantAttempts.length} attempts:`);
    relevantAttempts.forEach((attempt) => {
      console.log(
        `- ${attempt.candidateName} took "${attempt.test.title}" (Status: ${attempt.status})`
      );
    });
  } catch (error) {
    console.error('Error finding attempts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
findAllAttempts();
