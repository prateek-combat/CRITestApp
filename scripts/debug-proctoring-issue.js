const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugProctoring() {
  console.log('🔍 Debugging Proctoring Permission Issues...\n');

  try {
    // 1. Check recent test attempts that should have proctoring enabled
    console.log('1. Checking recent test attempts...');
    const recentAttempts = await prisma.testAttempt.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        proctoringEnabled: true,
        permissionsGranted: true,
        status: true,
        createdAt: true,
        test: {
          select: {
            title: true,
          },
        },
      },
    });

    recentAttempts.forEach((attempt) => {
      console.log(`   📝 ${attempt.test.title} (${attempt.candidateName})`);
      console.log(`      ID: ${attempt.id}`);
      console.log(`      Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`      Permissions Granted: ${attempt.permissionsGranted}`);
      console.log(`      Status: ${attempt.status}`);
      console.log(`      Created: ${attempt.createdAt}`);
      console.log();
    });

    // 2. Check what the default test configuration is
    console.log('2. Checking test configurations...');
    const tests = await prisma.test.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        // proctoringEnabled is at the attempt level, not test level
      },
    });

    tests.forEach((test) => {
      console.log(`   📋 ${test.title}`);
      console.log(`      ID: ${test.id}`);
      console.log();
    });

    // 3. Check if there are any mechanical tests
    console.log('3. Looking for mechanical tests...');
    const mechanicalTests = await prisma.test.findMany({
      where: {
        title: {
          contains: 'mechanical',
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            testAttempts: true,
          },
        },
      },
    });

    if (mechanicalTests.length > 0) {
      console.log(`   Found ${mechanicalTests.length} mechanical test(s):`);
      mechanicalTests.forEach((test) => {
        console.log(`   🔧 ${test.title}`);
        console.log(`      ID: ${test.id}`);
        console.log(`      Attempts: ${test._count.testAttempts}`);
        console.log();
      });
    } else {
      console.log('   ❌ No mechanical tests found');
    }

    // 4. Test the permission update API logic
    console.log('4. Testing permission update logic...');
    if (recentAttempts.length > 0) {
      const testAttempt = recentAttempts[0];
      console.log(`   Testing with attempt: ${testAttempt.id}`);

      try {
        // Simulate what the frontend should do
        const updatedAttempt = await prisma.testAttempt.update({
          where: { id: testAttempt.id },
          data: {
            permissionsGranted: true,
            proctoringEnabled: true,
            proctoringStartedAt: new Date(),
          },
        });

        console.log(
          `   ✅ Successfully updated permissions for attempt ${testAttempt.id}`
        );
        console.log(
          `   Updated: proctoringEnabled=${updatedAttempt.proctoringEnabled}, permissionsGranted=${updatedAttempt.permissionsGranted}`
        );
      } catch (error) {
        console.log(`   ❌ Failed to update permissions: ${error.message}`);
      }
    }

    // 5. Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    console.log('');

    const problemAttempts = recentAttempts.filter(
      (a) => !a.proctoringEnabled || !a.permissionsGranted
    );
    if (problemAttempts.length > 0) {
      console.log('❌ ISSUES FOUND:');
      console.log(
        `   - ${problemAttempts.length} recent attempts have proctoring disabled`
      );
      console.log('   - This means the permission update API is not working');
      console.log('');
      console.log('🔧 SOLUTIONS:');
      console.log(
        '   1. Check browser developer console for API errors during test start'
      );
      console.log('   2. Verify authentication is working (session cookies)');
      console.log('   3. Test the permission API endpoint manually');
      console.log('   4. Enable verbose logging in the browser');

      console.log(
        '   5. ⚠️  CRITICAL: Test attempts have proctoring disabled!'
      );
      console.log('       Run: node scripts/enable-proctoring-for-tests.js');
    } else {
      console.log('✅ All recent attempts have proctoring properly configured');
    }
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugProctoring().catch(console.error);
