#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Updating timer for Mechanical Assessment 1 questions...\n');
  await prisma.$connect();

  // Get the test and its questions
  const test = await prisma.test.findUnique({
    where: { id: TEST_ID },
    include: { questions: true },
  });

  if (!test) {
    console.error('❌ Test not found');
    return;
  }

  console.log(`✅ Found test: ${test.title}`);
  console.log(`   Current questions: ${test.questions.length}`);
  console.log(`   Updating timer from 90 seconds to 40 seconds...\n`);

  // Update all questions to have 40 seconds timer
  const updateResult = await prisma.question.updateMany({
    where: {
      testId: TEST_ID,
    },
    data: {
      timerSeconds: 40,
    },
  });

  console.log(`✅ Updated ${updateResult.count} questions successfully!`);
  console.log(`\n📊 Test Summary:`);
  console.log(`   • Test: ${test.title}`);
  console.log(`   • Total Questions: ${test.questions.length}`);
  console.log(`   • Time per Question: 40 seconds`);
  console.log(
    `   • Total Test Time: ${(test.questions.length * 40) / 60} minutes`
  );
  console.log(`\n💡 All questions now have a 40-second timer!`);

  await prisma.$disconnect();
}

main().catch(console.error);
