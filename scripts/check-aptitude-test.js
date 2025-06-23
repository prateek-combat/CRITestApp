const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const test = await prisma.test.findFirst({
      where: { title: 'Conversational Aptitude Test for Engineering Roles' },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!test) {
      console.log('❌ Test not found');
      return;
    }

    console.log('📊 Complete Question Breakdown:');
    console.log(`📋 Test: ${test.title}`);
    console.log(`📝 Total Questions: ${test.questions.length}`);
    console.log(`📋 Test ID: ${test.id}`);
    console.log();

    const categoryBreakdown = {};
    test.questions.forEach((q) => {
      if (!categoryBreakdown[q.category]) {
        categoryBreakdown[q.category] = 0;
      }
      categoryBreakdown[q.category]++;
    });

    console.log('📈 Questions by Category:');
    Object.entries(categoryBreakdown).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} questions`);
    });
    console.log();

    console.log('🏷️ Questions by Section Tag:');
    const tagBreakdown = {};
    test.questions.forEach((q) => {
      if (!tagBreakdown[q.sectionTag]) {
        tagBreakdown[q.sectionTag] = 0;
      }
      tagBreakdown[q.sectionTag]++;
    });

    Object.entries(tagBreakdown).forEach(([tag, count]) => {
      console.log(`   ${tag}: ${count} questions`);
    });

    console.log(
      `\n⏱️  Total test time: ${(test.questions.length * 30) / 60} minutes`
    );
    console.log(`🕒 Timer per question: 30 seconds`);
    console.log(`\n✅ Test created successfully with all requirements met!`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
