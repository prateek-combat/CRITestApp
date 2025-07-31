#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRecentTestAttempts() {
  console.log('🔍 Checking recent test attempts after race condition fix...\n');

  try {
    // Get the most recent test attempts (both regular and public)
    const recentRegularAttempts = await prisma.testAttempt.findMany({
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
        invitation: {
          include: {
            test: {
              select: {
                title: true,
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
    });

    const recentPublicAttempts = await prisma.publicTestAttempt.findMany({
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
              select: {
                title: true,
                questions: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
    });

    console.log(
      `📊 Found ${recentRegularAttempts.length} recent regular attempts and ${recentPublicAttempts.length} recent public attempts\n`
    );

    // Helper function to analyze an attempt
    const analyzeAttempt = (attempt, type) => {
      const test = attempt.invitation?.test || attempt.publicLink?.test;
      const totalQuestions = test?.questions?.length || 0;
      const submittedAnswers = attempt.submittedAnswers || [];

      console.log(
        `${type === 'regular' ? '🎯' : '🌐'} ${type.toUpperCase()} Test Attempt: ${attempt.id}`
      );
      console.log(`   Test: ${test?.title || 'Unknown'}`);
      console.log(`   Last Updated: ${attempt.updatedAt}`);
      console.log(`   Status: ${attempt.status || 'Unknown'}`);
      console.log(
        `   Progress: ${attempt.currentQuestionIndex + 1}/${totalQuestions}`
      );
      console.log(`   Total Questions: ${totalQuestions}`);
      console.log(`   Saved Answers: ${submittedAnswers.length}`);

      // Check timing analysis
      if (submittedAnswers.length > 0) {
        const answersWithTime = submittedAnswers.filter(
          (ans) => ans.timeTakenSeconds > 0
        );
        const answersWithoutTime = submittedAnswers.filter(
          (ans) => ans.timeTakenSeconds === 0
        );

        console.log(`   ✅ Answers with time: ${answersWithTime.length}`);
        console.log(`   ❌ Answers without time: ${answersWithoutTime.length}`);

        // Check timestamps
        const timestamps = submittedAnswers.map((ans) =>
          ans.submittedAt.toISOString()
        );
        const uniqueTimestamps = new Set(timestamps);

        if (uniqueTimestamps.size === 1) {
          console.log(`   ⚠️ BATCH SAVE: All answers have same timestamp`);
        } else if (uniqueTimestamps.size === submittedAnswers.length) {
          console.log(
            `   ✅ INDIVIDUAL SAVE: ${uniqueTimestamps.size} unique timestamps`
          );
        } else {
          console.log(
            `   🔄 MIXED: ${uniqueTimestamps.size} unique timestamps for ${submittedAnswers.length} answers`
          );
        }

        // Time analysis
        const times = submittedAnswers.map((ans) => ans.timeTakenSeconds);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(
          `   ⏱️ Time stats: Avg ${avgTime.toFixed(1)}s, Min ${minTime}s, Max ${maxTime}s`
        );

        // Check answer pattern (if incomplete)
        if (submittedAnswers.length < totalQuestions && totalQuestions > 0) {
          const answeredPositions = submittedAnswers
            .map((ans) => {
              const questionIndex = test.questions.findIndex(
                (q) => q.id === ans.questionId
              );
              return questionIndex + 1; // 1-based
            })
            .sort((a, b) => a - b);

          console.log(
            `   📍 Answered positions: ${answeredPositions.slice(0, 10).join(', ')}${answeredPositions.length > 10 ? '...' : ''}`
          );

          // Check if consecutive
          const isConsecutive = answeredPositions.every(
            (pos, index) =>
              index === 0 || pos === answeredPositions[index - 1] + 1
          );

          if (isConsecutive && answeredPositions[0] === 1) {
            console.log(
              `   🚪 Pattern: CONSECUTIVE - User stopped at question ${answeredPositions.length + 1}`
            );
          } else {
            console.log(
              `   ⚡ Pattern: NON-CONSECUTIVE - Possible race condition still present`
            );
          }
        } else if (submittedAnswers.length === totalQuestions) {
          console.log(`   ✅ COMPLETE: All questions answered`);
        }
      } else {
        console.log(`   ❌ NO ANSWERS SAVED`);
      }

      console.log('');
    };

    // Analyze all attempts
    recentRegularAttempts.forEach((attempt) =>
      analyzeAttempt(attempt, 'regular')
    );
    recentPublicAttempts.forEach((attempt) =>
      analyzeAttempt(attempt, 'public')
    );

    // Summary of issues found
    const allAttempts = [...recentRegularAttempts, ...recentPublicAttempts];
    const incompleteAttempts = allAttempts.filter((attempt) => {
      const test = attempt.invitation?.test || attempt.publicLink?.test;
      const totalQuestions = test?.questions?.length || 0;
      return (
        attempt.submittedAnswers.length < totalQuestions && totalQuestions > 0
      );
    });

    console.log('📋 SUMMARY:');
    console.log(`   Total attempts analyzed: ${allAttempts.length}`);
    console.log(`   Incomplete attempts: ${incompleteAttempts.length}`);

    if (incompleteAttempts.length > 0) {
      console.log('\n🚨 ISSUES DETECTED:');
      incompleteAttempts.forEach((attempt) => {
        const test = attempt.invitation?.test || attempt.publicLink?.test;
        const totalQuestions = test?.questions?.length || 0;
        const savedAnswers = attempt.submittedAnswers.length;
        const completionRate = ((savedAnswers / totalQuestions) * 100).toFixed(
          1
        );
        console.log(
          `   - ${attempt.id}: ${savedAnswers}/${totalQuestions} (${completionRate}%) - ${test?.title}`
        );
      });
    } else {
      console.log('\n✅ No incomplete attempts found in recent tests');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentTestAttempts();
