const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enableProctoringForTests() {
  console.log('🔧 Enabling Proctoring for Tests...\n');

  try {
    // 1. Note: Proctoring is controlled at the test attempt level, not test level
    console.log(
      '1. Proctoring is controlled per test attempt, not per test...'
    );
    console.log(
      "   ℹ️  Tests don't have a proctoring setting - it's set when attempts are created"
    );

    // 2. Reset any in-progress test attempts to allow proctoring
    console.log(
      '\n2. Resetting in-progress test attempts to enable proctoring...'
    );
    const inProgressAttempts = await prisma.testAttempt.findMany({
      where: {
        status: 'IN_PROGRESS',
        OR: [{ proctoringEnabled: false }, { permissionsGranted: false }],
      },
      select: {
        id: true,
        candidateName: true,
        test: {
          select: {
            title: true,
          },
        },
      },
    });

    if (inProgressAttempts.length > 0) {
      console.log(
        `   Found ${inProgressAttempts.length} in-progress attempts that need proctoring reset:`
      );

      for (const attempt of inProgressAttempts) {
        console.log(`   📝 ${attempt.test.title} (${attempt.candidateName})`);
      }

      const attemptsUpdated = await prisma.testAttempt.updateMany({
        where: {
          status: 'IN_PROGRESS',
          OR: [{ proctoringEnabled: false }, { permissionsGranted: false }],
        },
        data: {
          proctoringEnabled: true,
          permissionsGranted: false, // Reset to false so they can grant permissions again
          proctoringStartedAt: null, // Reset the start time
        },
      });

      console.log(
        `   ✅ Reset proctoring for ${attemptsUpdated.count} in-progress attempts`
      );
      console.log(
        `   ℹ️  Users will need to grant camera/microphone permissions again when they continue their tests`
      );
    } else {
      console.log(`   ✅ No in-progress attempts need proctoring reset`);
    }

    // 3. Do the same for public test attempts
    console.log('\n3. Resetting public test attempts...');
    const publicInProgressAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        status: 'IN_PROGRESS',
        OR: [{ proctoringEnabled: false }, { permissionsGranted: false }],
      },
      select: {
        id: true,
        candidateName: true,
      },
    });

    if (publicInProgressAttempts.length > 0) {
      const publicAttemptsUpdated = await prisma.publicTestAttempt.updateMany({
        where: {
          status: 'IN_PROGRESS',
          OR: [{ proctoringEnabled: false }, { permissionsGranted: false }],
        },
        data: {
          proctoringEnabled: true,
          permissionsGranted: false,
          proctoringStartedAt: null,
        },
      });

      console.log(
        `   ✅ Reset proctoring for ${publicAttemptsUpdated.count} public attempts`
      );
    } else {
      console.log(`   ✅ No public attempts need proctoring reset`);
    }

    // 4. Verify the changes
    console.log('\n4. Verifying changes...');
    const inProgressWithProctoring = await prisma.testAttempt.count({
      where: {
        status: 'IN_PROGRESS',
        proctoringEnabled: true,
      },
    });

    const totalInProgress = await prisma.testAttempt.count({
      where: {
        status: 'IN_PROGRESS',
      },
    });

    console.log(
      `   📊 In-progress attempts with proctoring enabled: ${inProgressWithProctoring}/${totalInProgress}`
    );

    if (inProgressWithProctoring === totalInProgress) {
      console.log(
        `   ✅ All in-progress attempts now have proctoring enabled!`
      );
    } else {
      console.log(
        `   ⚠️  ${totalInProgress - inProgressWithProctoring} in-progress attempts still have proctoring disabled`
      );
    }

    console.log('\n🎉 PROCTORING ENABLEMENT COMPLETE!');
    console.log('');
    console.log('📋 WHAT HAPPENS NOW:');
    console.log(
      '   1. All new test attempts will require camera/microphone permissions'
    );
    console.log(
      '   2. Users with in-progress tests will need to grant permissions again'
    );
    console.log('   3. Frame capture should now work correctly');
    console.log('');
    console.log('🔍 TO TEST:');
    console.log('   1. Start a new test');
    console.log('   2. Grant camera/microphone permissions');
    console.log('   3. Complete the test');
    console.log('   4. Check the analysis page for captured frames');
    console.log('');
    console.log('🚨 IF PROBLEMS PERSIST:');
    console.log('   1. Check browser developer console for JavaScript errors');
    console.log('   2. Verify camera/microphone work in other applications');
    console.log('   3. Try a different browser (Chrome/Firefox/Safari)');
    console.log('   4. Check if corporate firewall blocks camera access');
  } catch (error) {
    console.error('❌ Error enabling proctoring:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enableProctoringForTests().catch(console.error);
