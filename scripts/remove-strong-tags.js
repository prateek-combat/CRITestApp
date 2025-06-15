#!/usr/bin/env node

/**
 * Script to remove <strong> tags from all answer options in all tests
 * This script cleans up the formatting while preserving other HTML tags like <code>
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Removing <strong> tags from all test answers...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get all tests with their questions
    const tests = await prisma.test.findMany({
      include: {
        questions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`📋 Found ${tests.length} tests to process\n`);

    let totalQuestionsUpdated = 0;
    let totalAnswersUpdated = 0;

    for (const test of tests) {
      console.log(`🔧 Processing: ${test.title}`);
      console.log(`   📝 Questions: ${test.questions.length}`);

      let questionsUpdatedInTest = 0;
      let answersUpdatedInTest = 0;

      for (const question of test.questions) {
        const originalAnswers = question.answerOptions;
        const cleanedAnswers = originalAnswers.map((answer) => {
          // Remove <strong> and </strong> tags but preserve other HTML
          return answer.replace(/<\/?strong>/g, '');
        });

        // Check if any answers were actually changed
        const hasChanges = originalAnswers.some(
          (original, index) => original !== cleanedAnswers[index]
        );

        if (hasChanges) {
          await prisma.question.update({
            where: { id: question.id },
            data: { answerOptions: cleanedAnswers },
          });

          questionsUpdatedInTest++;

          // Count how many individual answers were changed
          originalAnswers.forEach((original, index) => {
            if (original !== cleanedAnswers[index]) {
              answersUpdatedInTest++;
            }
          });
        }
      }

      console.log(
        `   ✅ Updated ${questionsUpdatedInTest} questions (${answersUpdatedInTest} answers)`
      );
      totalQuestionsUpdated += questionsUpdatedInTest;
      totalAnswersUpdated += answersUpdatedInTest;
    }

    console.log(`\n🎉 Successfully removed <strong> tags from all tests!`);
    console.log(`\n📊 Summary:`);
    console.log(`   • Tests processed: ${tests.length}`);
    console.log(`   • Questions updated: ${totalQuestionsUpdated}`);
    console.log(`   • Individual answers cleaned: ${totalAnswersUpdated}`);
    console.log(
      `\n✨ All answer options now have clean formatting without bold emphasis!`
    );
    console.log(`💡 Note: <code> tags and other HTML formatting preserved`);
  } catch (error) {
    console.error('❌ Error removing strong tags:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
