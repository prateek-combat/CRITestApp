#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPublicTestAttempt(attemptId) {
  console.log('🔍 Checking Public Test Attempt...\n');

  try {
    const attempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        submittedAnswers: {
          include: {
            question: true,
          },
          orderBy: {
            submittedAt: 'asc',
          },
        },
        publicLink: {
          include: {
            test: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      console.log('❌ Public test attempt not found');
      return;
    }

    const test = attempt.publicLink?.test;
    const totalQuestions = test?.questions?.length || 0;
    const submittedAnswers = attempt.submittedAnswers || [];

    console.log('📊 Public Test Attempt Analysis:');
    console.log(`   ID: ${attempt.id}`);
    console.log(`   Test: ${test?.title || 'Unknown'}`);
    console.log(`   Status: ${attempt.status}`);
    console.log(`   Last Updated: ${attempt.updatedAt}`);
    console.log(`   Total Questions: ${totalQuestions}`);
    console.log(`   Saved Answers: ${submittedAnswers.length}`);
    console.log(
      `   Completion Rate: ${((submittedAnswers.length / totalQuestions) * 100).toFixed(1)}%`
    );

    // Show answer distribution
    console.log('\n📈 Saved Answer Pattern:');
    const answerPositions = submittedAnswers.map((answer) => {
      const questionIndex = test.questions.findIndex(
        (q) => q.id === answer.questionId
      );
      return questionIndex + 1;
    });

    console.log(`   Answer positions: ${answerPositions.join(', ')}`);

    // Check if consecutive
    let isConsecutive = true;
    for (let i = 1; i < answerPositions.length; i++) {
      if (answerPositions[i] !== answerPositions[i - 1] + 1) {
        isConsecutive = false;
        break;
      }
    }

    console.log(
      `   Pattern: ${isConsecutive ? '✅ Consecutive' : '❌ Non-consecutive (race condition)'}`
    );

    // Show timing information
    if (submittedAnswers.length > 0) {
      console.log('\n⏱️  Answer Timing:');
      submittedAnswers.slice(0, 10).forEach((answer, idx) => {
        const questionNum = answerPositions[idx];
        console.log(
          `   Q${questionNum}: ${answer.timeTakenSeconds}s (saved at ${answer.submittedAt.toISOString()})`
        );
      });
      if (submittedAnswers.length > 10) {
        console.log(`   ... and ${submittedAnswers.length - 10} more`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const attemptId = process.argv[2] || '6bfabeb7-b9f1-4626-93b9-7acd279cfba3';
checkPublicTestAttempt(attemptId);
