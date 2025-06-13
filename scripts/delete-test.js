const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteTest(testId) {
  try {
    // First check if the test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: testId },
      select: {
        id: true,
        title: true,
        isArchived: true,
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
          },
        },
      },
    });

    if (!existingTest) {
      console.log(`❌ Test with ID '${testId}' not found.`);
      return;
    }

    console.log(`🔍 Found test: "${existingTest.title}"`);
    console.log(`   ID: ${existingTest.id}`);
    console.log(`   Archived: ${existingTest.isArchived ? 'Yes' : 'No'}`);
    console.log(`   Questions: ${existingTest._count.questions}`);
    console.log(`   Invitations: ${existingTest._count.invitations}`);
    console.log(`   Attempts: ${existingTest._count.testAttempts}`);
    console.log('');

    // Confirm deletion
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise((resolve) => {
      rl.question(
        '⚠️  Are you sure you want to PERMANENTLY delete this test? (yes/no): ',
        resolve
      );
    });

    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Deletion cancelled by user');
      return;
    }

    // Delete the test
    await prisma.test.delete({
      where: { id: testId },
    });

    console.log('✅ Test deleted successfully!');
    console.log(
      `   Deleted: ${existingTest._count.questions} questions, ${existingTest._count.invitations} invitations, ${existingTest._count.testAttempts} attempts`
    );
  } catch (error) {
    console.error('❌ Error deleting test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get test ID from command line argument
const testId = process.argv[2];

if (!testId) {
  console.log('❌ Please provide a test ID');
  console.log('Usage: node scripts/delete-test.js <test-id>');
  console.log('');
  console.log('Current test ID: c45704aa-7dbd-4e97-bc6f-205ecedf120f');
  process.exit(1);
}

if (require.main === module) {
  deleteTest(testId);
}
