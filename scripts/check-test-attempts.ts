import { prisma } from '../src/lib/prisma';

async function checkTestAttempts() {
  console.log('Checking test attempts for General Aptitude Test...\n');

  try {
    // First, verify the test-position link
    const test = await prisma.test.findFirst({
      where: {
        title: {
          contains: 'General Aptitude',
          mode: 'insensitive',
        },
      },
      include: {
        position: true,
      },
    });

    if (!test) {
      console.error('General Aptitude Test not found!');
      return;
    }

    console.log(`Test: ${test.title}`);
    console.log(`Test ID: ${test.id}`);
    console.log(`Linked to Position: ${test.position?.name || 'None'}`);
    console.log(`Position ID: ${test.positionId || 'None'}\n`);

    // Check for test attempts
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        testId: test.id,
        status: 'COMPLETED',
      },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        status: true,
        completedAt: true,
        rawScore: true,
        test: {
          select: {
            title: true,
            positionId: true,
          },
        },
      },
      take: 10,
    });

    console.log(`\nFound ${testAttempts.length} completed test attempts:`);

    if (testAttempts.length > 0) {
      testAttempts.forEach((attempt, index) => {
        console.log(
          `\n${index + 1}. ${attempt.candidateName} (${attempt.candidateEmail})`
        );
        console.log(`   Status: ${attempt.status}`);
        console.log(`   Score: ${attempt.rawScore}`);
        console.log(`   Completed: ${attempt.completedAt}`);
        console.log(`   Test Position ID: ${attempt.test.positionId}`);
      });
    }

    // Count total attempts
    const totalCompleted = await prisma.testAttempt.count({
      where: {
        testId: test.id,
        status: 'COMPLETED',
      },
    });

    const totalAll = await prisma.testAttempt.count({
      where: {
        testId: test.id,
      },
    });

    console.log(`\nTotal completed attempts: ${totalCompleted}`);
    console.log(`Total all attempts: ${totalAll}`);

    // Check public test attempts as well
    const publicAttempts = await prisma.publicTestAttempt.count({
      where: {
        publicLink: {
          testId: test.id,
        },
        status: 'COMPLETED',
      },
    });

    console.log(`Public test attempts: ${publicAttempts}`);

    // Check if there are any attempts for the Combat Internal position
    const positionAttempts = await prisma.testAttempt.count({
      where: {
        test: {
          positionId: '0644ec20-4833-4d29-af83-bb7a3ee83d27',
        },
        status: 'COMPLETED',
      },
    });

    console.log(
      `\nTotal attempts for Combat Internal position: ${positionAttempts}`
    );

    // List all tests for this position
    const testsForPosition = await prisma.test.findMany({
      where: {
        positionId: '0644ec20-4833-4d29-af83-bb7a3ee83d27',
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log(`\nAll tests for Combat Internal position:`);
    for (const t of testsForPosition) {
      const attemptCount = await prisma.testAttempt.count({
        where: {
          testId: t.id,
          status: 'COMPLETED',
        },
      });
      console.log(`- ${t.title} (${attemptCount} completed attempts)`);
    }
  } catch (error) {
    console.error('Error checking test attempts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkTestAttempts();
