#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkLatestSubmissions() {
  console.log('🔍 Checking latest test submissions and timestamps...\n');

  try {
    // Get the most recent test attempts with submitted answers
    const recentAttempts = await prisma.testAttempt.findMany({
      where: {
        NOT: {
          submittedAnswers: {
            none: {},
          },
        },
      },
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

    // Check public test attempts too
    const recentPublicAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        NOT: {
          submittedAnswers: {
            none: {},
          },
        },
      },
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
      `📊 Found ${recentAttempts.length} recent regular attempts and ${recentPublicAttempts.length} recent public attempts\n`
    );

    // Analyze regular attempts
    for (const attempt of recentAttempts) {
      console.log(`🎯 Regular Test Attempt: ${attempt.id}`);
      console.log(`   Test: ${attempt.invitation?.test?.title || 'Unknown'}`);
      console.log(`   Last Updated: ${attempt.updatedAt}`);
      console.log(`   Total Answers: ${attempt.submittedAnswers.length}`);

      const answersWithTime = attempt.submittedAnswers.filter(
        (ans) => ans.timeTakenSeconds > 0
      );
      const answersWithoutTime = attempt.submittedAnswers.filter(
        (ans) => ans.timeTakenSeconds === 0
      );

      console.log(`   ✅ Answers with time: ${answersWithTime.length}`);
      console.log(`   ❌ Answers without time: ${answersWithoutTime.length}`);

      // Show timestamp distribution
      const timestamps = attempt.submittedAnswers.map((ans) =>
        ans.submittedAt.toISOString()
      );
      const uniqueTimestamps = [...new Set(timestamps)];
      console.log(
        `   📅 Unique timestamps: ${uniqueTimestamps.length} (should be ${attempt.submittedAnswers.length} for individual saving)`
      );

      // Show detailed breakdown for the most recent attempt
      if (recentAttempts.indexOf(attempt) === 0) {
        console.log('\n   📝 Detailed Answer Breakdown:');
        attempt.submittedAnswers.forEach((answer, index) => {
          const questionPreview =
            answer.question.promptText.substring(0, 50) + '...';
          console.log(`      ${index + 1}. ${questionPreview}`);
          console.log(
            `         Time: ${answer.timeTakenSeconds}s | Submitted: ${answer.submittedAt.toISOString()}`
          );
        });
      }
      console.log('');
    }

    // Analyze public attempts
    for (const attempt of recentPublicAttempts) {
      console.log(`🌐 Public Test Attempt: ${attempt.id}`);
      console.log(`   Test: ${attempt.publicLink?.test?.title || 'Unknown'}`);
      console.log(`   Last Updated: ${attempt.updatedAt}`);
      console.log(`   Total Answers: ${attempt.submittedAnswers.length}`);

      const answersWithTime = attempt.submittedAnswers.filter(
        (ans) => ans.timeTakenSeconds > 0
      );
      const answersWithoutTime = attempt.submittedAnswers.filter(
        (ans) => ans.timeTakenSeconds === 0
      );

      console.log(`   ✅ Answers with time: ${answersWithTime.length}`);
      console.log(`   ❌ Answers without time: ${answersWithoutTime.length}`);

      // Show timestamp distribution
      const timestamps = attempt.submittedAnswers.map((ans) =>
        ans.submittedAt.toISOString()
      );
      const uniqueTimestamps = [...new Set(timestamps)];
      console.log(
        `   📅 Unique timestamps: ${uniqueTimestamps.length} (should be ${attempt.submittedAnswers.length} for individual saving)`
      );
      console.log('');
    }
  } catch (error) {
    console.error('❌ Error checking submissions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLatestSubmissions();
