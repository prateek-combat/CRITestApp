#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function enableProctoringForAllTests() {
  try {
    console.log('🔄 Enabling proctoring for all tests and test attempts...');

    // Update all test attempts to enable proctoring
    const testAttemptsResult = await prisma.testAttempt.updateMany({
      where: {
        proctoringEnabled: false,
      },
      data: {
        proctoringEnabled: true,
      },
    });

    console.log(
      `✅ Updated ${testAttemptsResult.count} test attempts to enable proctoring`
    );

    // Update all public test attempts to enable proctoring
    const publicTestAttemptsResult = await prisma.publicTestAttempt.updateMany({
      where: {
        proctoringEnabled: false,
      },
      data: {
        proctoringEnabled: true,
      },
    });

    console.log(
      `✅ Updated ${publicTestAttemptsResult.count} public test attempts to enable proctoring`
    );

    // Reset permission status for incomplete attempts so they'll be asked for permissions again
    const incompleteAttemptsResult = await prisma.testAttempt.updateMany({
      where: {
        status: 'IN_PROGRESS',
        permissionsGranted: false,
      },
      data: {
        permissionsGranted: false,
        proctoringStartedAt: null,
      },
    });

    console.log(
      `✅ Reset permissions for ${incompleteAttemptsResult.count} incomplete test attempts`
    );

    // Reset permission status for incomplete public attempts
    const incompletePublicAttemptsResult =
      await prisma.publicTestAttempt.updateMany({
        where: {
          status: 'IN_PROGRESS',
          permissionsGranted: false,
        },
        data: {
          permissionsGranted: false,
          proctoringStartedAt: null,
        },
      });

    console.log(
      `✅ Reset permissions for ${incompletePublicAttemptsResult.count} incomplete public test attempts`
    );

    console.log('🎉 Proctoring has been enabled for all tests!');
    console.log('📋 Summary:');
    console.log(`   - Test attempts updated: ${testAttemptsResult.count}`);
    console.log(
      `   - Public test attempts updated: ${publicTestAttemptsResult.count}`
    );
    console.log(
      `   - Incomplete attempts reset: ${incompleteAttemptsResult.count}`
    );
    console.log(
      `   - Incomplete public attempts reset: ${incompletePublicAttemptsResult.count}`
    );
  } catch (error) {
    console.error('❌ Error enabling proctoring:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enableProctoringForAllTests();
