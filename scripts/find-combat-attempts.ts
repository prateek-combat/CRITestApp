import { prisma } from '../src/lib/prisma';

async function findCombatAttempts() {
  console.log(
    'Looking for test attempts that might be related to Combat Internal role...\n'
  );

  try {
    // First, let's see all positions
    const positions = await prisma.position.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    console.log('All positions:');
    positions.forEach((p) => {
      console.log(`- ${p.name} (${p.code}) - ID: ${p.id}`);
    });

    // Find tests that might be related to combat or have attempts
    const testsWithAttempts = await prisma.test.findMany({
      where: {
        attempts: {
          some: {
            status: 'COMPLETED',
          },
        },
      },
      select: {
        id: true,
        title: true,
        positionId: true,
        position: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            attempts: {
              where: {
                status: 'COMPLETED',
              },
            },
          },
        },
      },
    });

    console.log('\n\nTests with completed attempts:');
    console.log('================================');
    testsWithAttempts.forEach((test) => {
      console.log(`\n📋 ${test.title}`);
      console.log(`   Completed attempts: ${test._count.attempts}`);
      console.log(
        `   Position: ${test.position?.name || 'Not assigned to any position'}`
      );
      console.log(`   Test ID: ${test.id}`);
      if (!test.positionId) {
        console.log(`   ⚠️  This test has no position assigned!`);
      }
    });

    // Look for any test with "combat" in name or description
    const combatRelatedTests = await prisma.test.findMany({
      where: {
        OR: [
          {
            title: {
              contains: 'combat',
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: 'combat',
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        positionId: true,
      },
    });

    console.log('\n\nTests with "combat" in name or description:');
    console.log('==========================================');
    combatRelatedTests.forEach((test) => {
      console.log(`- ${test.title} (Position: ${test.positionId || 'None'})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
findCombatAttempts();
