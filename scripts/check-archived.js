const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkArchived() {
  try {
    console.log('🗄️ Checking archived tests...\n');

    const archived = await prisma.test.findMany({
      where: { isArchived: true },
      select: {
        id: true,
        title: true,
        archivedAt: true,
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
          },
        },
      },
      orderBy: { archivedAt: 'desc' },
    });

    console.log('🗄️ Archived Tests:');
    if (archived.length === 0) {
      console.log('   ❌ No archived tests found');
    } else {
      archived.forEach((test, i) => {
        console.log(`${i + 1}. ${test.title}`);
        console.log(`   ID: ${test.id}`);
        console.log(`   Questions: ${test._count.questions}`);
        console.log(`   Invitations: ${test._count.invitations}`);
        console.log(`   Attempts: ${test._count.testAttempts}`);
        console.log(`   Archived: ${test.archivedAt?.toISOString()}`);
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
  checkArchived();
}
