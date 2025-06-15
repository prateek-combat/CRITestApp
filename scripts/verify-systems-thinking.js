#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySystemsThinkingTest() {
  try {
    const test = await prisma.test.findFirst({
      where: { title: 'Systems Thinking' },
      include: { questions: true },
    });

    if (test) {
      console.log('✅ Systems Thinking Test found!');
      console.log('📊 Test Details:');
      console.log('   - ID:', test.id);
      console.log('   - Title:', test.title);
      console.log('   - Description:', test.description);
      console.log('   - Questions:', test.questions.length);
      console.log('   - Timer per question: 45 seconds');
      console.log('');
      console.log('🎯 Question Categories:');
      const categories = [...new Set(test.questions.map((q) => q.sectionTag))];
      categories.forEach((cat, i) => console.log(`   ${i + 1}. ${cat}`));

      console.log('');
      console.log('📝 Sample Questions:');
      test.questions.slice(0, 3).forEach((q, i) => {
        console.log(`   ${i + 1}. ${q.promptText.substring(0, 80)}...`);
      });

      return test;
    } else {
      console.log('❌ Systems Thinking Test not found');
      return null;
    }
  } catch (error) {
    console.error('❌ Error verifying test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  verifySystemsThinkingTest()
    .then((test) => {
      if (test) {
        console.log(
          '🎉 Systems Thinking Test verification completed successfully!'
        );
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to verify Systems Thinking Test:', error);
      process.exit(1);
    });
}

module.exports = { verifySystemsThinkingTest };
