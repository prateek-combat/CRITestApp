import { prisma } from '../src/lib/prisma';

async function checkGeneralAptitudeStatus() {
  try {
    // Check the position
    const position = await prisma.position.findUnique({
      where: { id: '0644ec20-4833-4d29-af83-bb7a3ee83d27' },
      select: { name: true, code: true },
    });

    console.log('Position Details:');
    console.log('- Name:', position?.name);
    console.log('- Code:', position?.code);

    // Check the test
    const test = await prisma.test.findFirst({
      where: { title: 'General Aptitude Test' },
      include: {
        position: true,
        _count: {
          select: { testAttempts: true },
        },
      },
    });

    console.log('\nTest Details:');
    console.log('- Title:', test?.title);
    console.log('- Linked Position:', test?.position?.name);
    console.log('- Total Attempts:', test?._count?.testAttempts);

    // Check for any completed attempts
    if (test) {
      const completedAttempts = await prisma.testAttempt.count({
        where: {
          testId: test.id,
          status: 'COMPLETED',
        },
      });

      console.log('- Completed Attempts:', completedAttempts);

      // Get recent attempts (if any)
      const recentAttempts = await prisma.testAttempt.findMany({
        where: { testId: test.id },
        select: {
          candidateName: true,
          candidateEmail: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (recentAttempts.length > 0) {
        console.log('\nRecent Attempts:');
        recentAttempts.forEach((attempt) => {
          console.log(
            `- ${attempt.candidateName} (${attempt.candidateEmail}): ${attempt.status} - ${attempt.createdAt}`
          );
        });
      } else {
        console.log('\nNo test attempts found for this test.');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkGeneralAptitudeStatus();
