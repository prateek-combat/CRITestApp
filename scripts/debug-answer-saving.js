#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAnswerSaving() {
  console.log('🔍 Debugging answer saving patterns...\n');

  try {
    // Get the specific test attempt with 50 questions but only 14 saved
    const specificAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: '7c88a61f-cb28-4dc5-b3a6-02475af785b5' },
      include: {
        submittedAnswers: {
          include: {
            question: {
              select: {
                promptText: true,
              },
            },
          },
          orderBy: {
            submittedAt: 'asc',
          },
        },
        publicLink: {
          include: {
            test: {
              include: {
                questions: {
                  select: {
                    id: true,
                    promptText: true,
                  },
                  orderBy: {
                    createdAt: 'asc',
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!specificAttempt) {
      console.log('❌ Test attempt not found');
      return;
    }

    const test = specificAttempt.publicLink.test;
    console.log(`📋 Test: ${test.title}`);
    console.log(`📊 Total Questions in Test: ${test.questions.length}`);
    console.log(
      `💾 Total Saved Answers: ${specificAttempt.submittedAnswers.length}`
    );
    console.log(
      `📈 Progress: ${specificAttempt.currentQuestionIndex + 1}/${test.questions.length}`
    );
    console.log(`⏰ Last Updated: ${specificAttempt.updatedAt}`);
    console.log(`🎯 Status: ${specificAttempt.status || 'Unknown'}\n`);

    // Check which questions have answers vs which don't
    const answeredQuestionIds = new Set(
      specificAttempt.submittedAnswers.map((ans) => ans.questionId)
    );
    const unansweredQuestions = test.questions.filter(
      (q) => !answeredQuestionIds.has(q.id)
    );

    console.log(`✅ Questions WITH answers: ${answeredQuestionIds.size}`);
    console.log(
      `❌ Questions WITHOUT answers: ${unansweredQuestions.length}\n`
    );

    if (unansweredQuestions.length > 0) {
      console.log('📝 First 10 unanswered questions:');
      unansweredQuestions.slice(0, 10).forEach((q, index) => {
        const questionIndex = test.questions.findIndex((tq) => tq.id === q.id);
        console.log(
          `   ${questionIndex + 1}. ${q.promptText.substring(0, 60)}...`
        );
      });
      console.log('');
    }

    // Check the timing pattern of saved answers
    if (specificAttempt.submittedAnswers.length > 0) {
      console.log('⏱️ Timing Analysis:');
      const timestamps = specificAttempt.submittedAnswers.map(
        (ans) => ans.submittedAt
      );
      const firstAnswer = new Date(timestamps[0]);
      const lastAnswer = new Date(timestamps[timestamps.length - 1]);
      const totalDuration = (lastAnswer - firstAnswer) / 1000; // seconds

      console.log(`   First answer: ${firstAnswer.toISOString()}`);
      console.log(`   Last answer: ${lastAnswer.toISOString()}`);
      console.log(
        `   Total duration: ${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s`
      );

      // Check if all answers have the same timestamp (indicating batch save)
      const uniqueTimestamps = new Set(timestamps.map((t) => t.toISOString()));
      if (uniqueTimestamps.size === 1) {
        console.log(
          '   ⚠️ ALL ANSWERS HAVE SAME TIMESTAMP - This indicates BATCH SAVE, not individual saves!'
        );
      } else {
        console.log(
          `   ✅ ${uniqueTimestamps.size} unique timestamps - Individual saving is working`
        );
      }
    }

    // Check if there's a pattern in the missing questions (e.g., only first 14 saved)
    if (specificAttempt.submittedAnswers.length > 0) {
      console.log('\n🔢 Answer Position Analysis:');
      const answeredPositions = specificAttempt.submittedAnswers
        .map((ans) => {
          const questionIndex = test.questions.findIndex(
            (q) => q.id === ans.questionId
          );
          return questionIndex + 1; // 1-based
        })
        .sort((a, b) => a - b);

      console.log(
        `   Answered question positions: ${answeredPositions.join(', ')}`
      );

      const isConsecutive = answeredPositions.every(
        (pos, index) => index === 0 || pos === answeredPositions[index - 1] + 1
      );

      if (isConsecutive && answeredPositions[0] === 1) {
        console.log(
          '   📊 Pattern: User answered first N questions consecutively, then stopped'
        );
        console.log(
          `   💡 Likely reason: Test was abandoned or terminated at question ${answeredPositions.length + 1}`
        );
      } else {
        console.log(
          '   📊 Pattern: Non-consecutive answers - possible technical issue'
        );
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAnswerSaving();
