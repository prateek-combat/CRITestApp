#!/usr/bin/env node

/**
 * Script to analyze Dilpreet Singh's specific test attempt
 * Attempt ID: 2e9b61ff-90d3-4c83-85c6-0e09728066e1
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeDilpreetAttempt() {
  const attemptId = '2e9b61ff-90d3-4c83-85c6-0e09728066e1';

  console.log("🔍 Analyzing Dilpreet Singh's Test Attempt...\n");
  console.log(`📊 Attempt ID: ${attemptId}\n`);

  try {
    await prisma.$connect();

    // Get detailed attempt information
    const attempt = await prisma.publicTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        publicLink: {
          include: {
            test: {
              include: {
                questions: {
                  select: {
                    id: true,
                    category: true,
                    correctAnswerIndex: true,
                  },
                },
              },
            },
          },
        },
        submittedAnswers: {
          include: {
            question: {
              select: {
                id: true,
                category: true,
                correctAnswerIndex: true,
                promptText: true,
              },
            },
          },
          orderBy: {
            submittedAt: 'asc',
          },
        },
      },
    });

    if (!attempt) {
      console.log('❌ Attempt not found');
      return;
    }

    // Basic information
    console.log('👤 CANDIDATE INFORMATION:');
    console.log(`   Name: ${attempt.candidateName}`);
    console.log(`   Email: ${attempt.candidateEmail}`);
    console.log(`   IP Address: ${attempt.ipAddress || 'N/A'}\n`);

    console.log('📝 TEST INFORMATION:');
    console.log(`   Test Title: ${attempt.publicLink.test.title}`);
    console.log(`   Test ID: ${attempt.publicLink.test.id}`);
    console.log(
      `   Total Questions in Test: ${attempt.publicLink.test.questions.length}`
    );
    console.log(`   Public Link ID: ${attempt.publicLink.id}\n`);

    console.log('⏰ TIMING INFORMATION:');
    console.log(`   Started At: ${attempt.startedAt.toLocaleString()}`);
    console.log(
      `   Completed At: ${attempt.completedAt ? attempt.completedAt.toLocaleString() : 'N/A'}`
    );
    if (attempt.completedAt) {
      const duration = Math.floor(
        (attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000
      );
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      console.log(
        `   Duration: ${minutes}:${seconds.toString().padStart(2, '0')} (${duration} seconds)`
      );
    }
    console.log(`   Status: ${attempt.status}\n`);

    console.log('📊 SCORING INFORMATION:');
    console.log(`   Raw Score (stored): ${attempt.rawScore}`);
    console.log(`   Percentile (stored): ${attempt.percentile}`);
    console.log(
      `   Total Questions in Test: ${attempt.publicLink.test.questions.length}`
    );
    console.log(`   Submitted Answers: ${attempt.submittedAnswers.length}`);

    // Calculate actual raw score from submitted answers
    const correctSubmittedAnswers = attempt.submittedAnswers.filter(
      (a) => a.isCorrect
    ).length;
    console.log(`   Correct Submitted Answers: ${correctSubmittedAnswers}`);

    // Calculate percentages
    const storedPercentage =
      (attempt.rawScore / attempt.publicLink.test.questions.length) * 100;
    const submittedPercentage =
      (correctSubmittedAnswers / attempt.submittedAnswers.length) * 100;
    const actualPercentage =
      (correctSubmittedAnswers / attempt.publicLink.test.questions.length) *
      100;

    console.log(`\n📈 PERCENTAGE CALCULATIONS:`);
    console.log(
      `   Stored Score Percentage: ${storedPercentage.toFixed(1)}% (${attempt.rawScore}/${attempt.publicLink.test.questions.length})`
    );
    console.log(
      `   Submitted Answers Percentage: ${submittedPercentage.toFixed(1)}% (${correctSubmittedAnswers}/${attempt.submittedAnswers.length})`
    );
    console.log(
      `   Actual Score Percentage: ${actualPercentage.toFixed(1)}% (${correctSubmittedAnswers}/${attempt.publicLink.test.questions.length})`
    );

    // Check for discrepancy
    if (attempt.rawScore !== correctSubmittedAnswers) {
      console.log(`\n⚠️  DISCREPANCY DETECTED:`);
      console.log(
        `   Stored rawScore (${attempt.rawScore}) != Calculated correct answers (${correctSubmittedAnswers})`
      );
      console.log(
        `   Difference: ${attempt.rawScore - correctSubmittedAnswers}`
      );
    }

    // Analyze by category
    console.log(`\n📋 CATEGORY BREAKDOWN:`);
    const categoryStats = {};

    // Initialize categories from test questions
    attempt.publicLink.test.questions.forEach((q) => {
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, answered: 0, correct: 0 };
      }
      categoryStats[q.category].total++;
    });

    // Count answered and correct by category
    attempt.submittedAnswers.forEach((answer) => {
      const category = answer.question.category;
      if (categoryStats[category]) {
        categoryStats[category].answered++;
        if (answer.isCorrect) {
          categoryStats[category].correct++;
        }
      }
    });

    Object.entries(categoryStats).forEach(([category, stats]) => {
      const percentage =
        stats.total > 0
          ? ((stats.correct / stats.total) * 100).toFixed(1)
          : '0.0';
      const answeredPercentage =
        stats.answered > 0
          ? ((stats.correct / stats.answered) * 100).toFixed(1)
          : '0.0';
      console.log(`   ${category}:`);
      console.log(`     Total Questions: ${stats.total}`);
      console.log(`     Answered: ${stats.answered}`);
      console.log(`     Correct: ${stats.correct}`);
      console.log(
        `     Score: ${percentage}% (${stats.correct}/${stats.total})`
      );
      console.log(
        `     Answer Accuracy: ${answeredPercentage}% (${stats.correct}/${stats.answered})`
      );
    });

    // Check for unanswered questions
    const unansweredQuestions =
      attempt.publicLink.test.questions.length -
      attempt.submittedAnswers.length;
    if (unansweredQuestions > 0) {
      console.log(`\n❓ UNANSWERED QUESTIONS: ${unansweredQuestions}`);
      console.log(
        `   This explains why rawScore (${attempt.rawScore}) might be higher than correct submitted answers (${correctSubmittedAnswers})`
      );
    }

    // Check proctoring data
    console.log(`\n🔒 PROCTORING INFORMATION:`);
    console.log(`   Proctoring Enabled: ${attempt.proctoringEnabled}`);
    console.log(`   Risk Score: ${attempt.riskScore || 'N/A'}`);
    console.log(`   Tab Switches: ${attempt.tabSwitches}`);
    console.log(`   Copy Events: ${attempt.copyEventCount}`);

    console.log('\n🎉 Analysis completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeDilpreetAttempt().catch(console.error);
