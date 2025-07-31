#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyRaceConditionFix(attemptId) {
  console.log('🔍 Verifying Race Condition Fix...\n');

  try {
    // Get the specified test attempt or the most recent one
    const latestAttempt = await prisma.testAttempt.findFirst({
      where: attemptId ? { id: attemptId } : undefined,
      include: {
        submittedAnswers: {
          include: {
            question: true,
          },
          orderBy: {
            submittedAt: 'asc',
          },
        },
        invitation: {
          include: {
            test: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (!latestAttempt) {
      console.log('❌ No test attempts found');
      return;
    }

    const test = latestAttempt.invitation?.test;
    const totalQuestions = test?.questions?.length || 0;
    const submittedAnswers = latestAttempt.submittedAnswers || [];

    console.log('📊 Test Attempt Analysis:');
    console.log(`   ID: ${latestAttempt.id}`);
    console.log(`   Test: ${test?.title || 'Unknown'}`);
    console.log(`   Status: ${latestAttempt.status}`);
    console.log(`   Last Updated: ${latestAttempt.updatedAt}`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log(`   Saved Answers: ${submittedAnswers.length}`);
    console.log(
      `   Completion Rate: ${((submittedAnswers.length / totalQuestions) * 100).toFixed(1)}%`
    );

    // Check for missing answers
    const questionIds = test?.questions?.map((q) => q.id) || [];
    const answeredQuestionIds = submittedAnswers.map((a) => a.questionId);
    const missingQuestionIds = questionIds.filter(
      (id) => !answeredQuestionIds.includes(id)
    );

    if (missingQuestionIds.length > 0) {
      console.log(`\n⚠️  Missing Answers: ${missingQuestionIds.length}`);

      // Find which question numbers are missing
      const missingQuestionNumbers = missingQuestionIds.map((id) => {
        const question = test.questions.find((q) => q.id === id);
        return test.questions.indexOf(question) + 1;
      });

      console.log(
        `   Missing Question Numbers: ${missingQuestionNumbers.join(', ')}`
      );
    } else {
      console.log('\n✅ All questions have saved answers!');
    }

    // Verify answer-to-question mapping
    console.log('\n📍 Answer-to-Question Mapping Verification:');
    let mappingErrors = 0;

    for (let i = 0; i < Math.min(10, submittedAnswers.length); i++) {
      const answer = submittedAnswers[i];
      const expectedQuestion = test.questions[i];

      if (answer.questionId !== expectedQuestion.id) {
        mappingErrors++;
        console.log(`   ❌ Position ${i + 1}: Answer for wrong question!`);
        console.log(
          `      Expected: ${expectedQuestion.id.substring(0, 8)}...`
        );
        console.log(`      Actual: ${answer.questionId.substring(0, 8)}...`);
      } else {
        console.log(
          `   ✅ Position ${i + 1}: Correctly mapped to question ${i + 1}`
        );
      }
    }

    if (submittedAnswers.length > 10) {
      console.log(`   ... and ${submittedAnswers.length - 10} more answers`);
    }

    // Check answer distribution pattern
    console.log('\n📈 Answer Distribution Pattern:');
    const answerPositions = submittedAnswers.map((answer) => {
      const questionIndex = test.questions.findIndex(
        (q) => q.id === answer.questionId
      );
      return questionIndex + 1;
    });

    console.log(
      `   Answer positions: ${answerPositions.slice(0, 20).join(', ')}${answerPositions.length > 20 ? '...' : ''}`
    );

    // Check if consecutive
    let isConsecutive = true;
    for (let i = 1; i < answerPositions.length; i++) {
      if (answerPositions[i] !== answerPositions[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }

    console.log(
      `   Pattern: ${isConsecutive ? '✅ Consecutive' : '❌ Non-consecutive (indicates race condition)'}`
    );

    // Summary
    console.log('\n🎯 Summary:');
    if (
      submittedAnswers.length === totalQuestions &&
      mappingErrors === 0 &&
      isConsecutive
    ) {
      console.log('   ✅ RACE CONDITION FIXED! All answers saved correctly.');
    } else {
      console.log('   ❌ RACE CONDITION STILL PRESENT!');
      console.log(
        `      - Answers saved: ${submittedAnswers.length}/${totalQuestions}`
      );
      console.log(`      - Mapping errors: ${mappingErrors}`);
      console.log(
        `      - Pattern: ${isConsecutive ? 'Consecutive' : 'Non-consecutive'}`
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get attempt ID from command line arguments
const attemptId = process.argv[2];
if (attemptId) {
  console.log(`Looking for specific attempt: ${attemptId}\n`);
}

verifyRaceConditionFix(attemptId);
