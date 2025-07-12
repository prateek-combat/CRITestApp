const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTestJobProfiles() {
  try {
    console.log(
      '🔍 Checking test links and their associated job profiles...\n'
    );

    // Public link IDs from the URLs
    const publicLinks = [
      { id: 'CiK2ohHw6FpB', name: 'Mechanical Internship Test' },
      { id: 'b6xa62NBm5TV', name: 'Electronics Internship Test' },
      { id: '0_6yILZHYrzu', name: 'Software Internship Test' },
      { id: 'm04N2op0ft5I', name: 'General Aptitude Test' },
    ];

    for (const link of publicLinks) {
      console.log(`\n📋 ${link.name} (${link.id}):`);
      console.log('='.repeat(60));

      // Find the public link
      const publicLink = await prisma.publicTestLink.findUnique({
        where: { linkToken: link.id },
        include: {
          test: {
            include: {
              position: true,
            },
          },
          jobProfile: {
            include: {
              positions: true,
            },
          },
        },
      });

      if (!publicLink) {
        console.log('❌ Public link not found');
        continue;
      }

      console.log(`Test: ${publicLink.test?.title || 'N/A'}`);
      console.log(`Type: ${publicLink.type}`);

      if (publicLink.jobProfile) {
        console.log(`\n🎯 Job Profile: ${publicLink.jobProfile.name}`);
        console.log(`Job Profile ID: ${publicLink.jobProfile.id}`);
        console.log(
          `Status: ${publicLink.jobProfile.isActive ? 'Active' : 'Inactive'}`
        );

        if (publicLink.jobProfile.positions.length > 0) {
          console.log('\\nPositions in this Job Profile:');
          publicLink.jobProfile.positions.forEach((position, index) => {
            console.log(`  ${index + 1}. ${position.name} (${position.code})`);
          });
        }
      } else if (publicLink.test?.position) {
        console.log(`\n🎯 Single Position: ${publicLink.test.position.name}`);
        console.log(`Position Code: ${publicLink.test.position.code}`);
      } else {
        console.log('\n⚠️  No job profile or position linked');
      }

      // Count today's attempts (check both TestAttempt and PublicTestAttempt)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check regular test attempts through invitations
      const invitationAttempts = await prisma.testAttempt.count({
        where: {
          testId: publicLink.test?.id,
          createdAt: {
            gte: today,
          },
        },
      });

      // Check public test attempts
      const publicAttempts = await prisma.publicTestAttempt.count({
        where: {
          publicLinkId: publicLink.id,
          createdAt: {
            gte: today,
          },
        },
      });

      const totalTodayAttempts = invitationAttempts + publicAttempts;

      console.log(`\n📊 Attempts today: ${totalTodayAttempts}`);
      console.log(`   - Via invitations: ${invitationAttempts}`);
      console.log(`   - Via public link: ${publicAttempts}`);

      // Get recent public attempts
      if (publicAttempts > 0) {
        const recentAttempts = await prisma.publicTestAttempt.findMany({
          where: {
            publicLinkId: publicLink.id,
            createdAt: {
              gte: today,
            },
          },
          select: {
            candidateName: true,
            candidateEmail: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        });

        console.log('\nRecent public link attempts today:');
        recentAttempts.forEach((attempt, index) => {
          const time = attempt.createdAt.toLocaleTimeString('en-IN', {
            timeZone: 'Asia/Kolkata',
          });
          console.log(
            `  ${index + 1}. ${attempt.candidateName} (${attempt.candidateEmail})`
          );
          console.log(`     Status: ${attempt.status} | Time: ${time}`);
        });
      }
    }

    // Summary of all attempts today across all tests
    console.log('\n\n📈 SUMMARY - Total Attempts Today:');
    console.log('='.repeat(60));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let grandTotalAttempts = 0;

    for (const link of publicLinks) {
      const pl = await prisma.publicTestLink.findUnique({
        where: { linkToken: link.id },
        include: { test: true },
      });

      if (pl) {
        // Count invitation-based attempts
        const inviteCount = await prisma.testAttempt.count({
          where: {
            testId: pl.test?.id,
            createdAt: {
              gte: today,
            },
          },
        });

        // Count public link attempts
        const publicCount = await prisma.publicTestAttempt.count({
          where: {
            publicLinkId: pl.id,
            createdAt: {
              gte: today,
            },
          },
        });

        const totalForTest = inviteCount + publicCount;
        console.log(`${link.name}: ${totalForTest} attempts`);
        if (inviteCount > 0 || publicCount > 0) {
          console.log(`  - Via invitations: ${inviteCount}`);
          console.log(`  - Via public link: ${publicCount}`);
        }
        grandTotalAttempts += totalForTest;
      }
    }

    console.log(
      `\nGrand Total attempts across all tests today: ${grandTotalAttempts}`
    );
  } catch (error) {
    console.error('❌ Error checking test job profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTestJobProfiles();
