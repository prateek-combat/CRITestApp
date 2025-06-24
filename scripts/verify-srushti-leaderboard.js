#!/usr/bin/env node

/**
 * Script to verify Srushti's test attempt appears in leaderboard
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyLeaderboardData() {
  try {
    console.log('🔍 Verifying Srushti appears in leaderboard data...\n');

    // Check the test ID for General Aptitude Test
    const testId = '7d23559d-1869-4b57-8aac-c1be39213506';

    // Query the same way the leaderboard API does
    const publicAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        status: 'COMPLETED',
        publicLink: {
          testId: testId,
        },
      },
      orderBy: { rawScore: 'desc' },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        rawScore: true,
        completedAt: true,
        status: true,
      },
    });

    console.log('📊 All COMPLETED public attempts for General Aptitude Test:');
    console.log('   Total attempts:', publicAttempts.length);
    console.log('');

    publicAttempts.forEach((attempt, index) => {
      const isSrushti = attempt.candidateName.toLowerCase().includes('srushti');
      const marker = isSrushti ? '👤 [SRUSHTI]' : '  ';
      console.log(`${marker} ${index + 1}. ${attempt.candidateName}`);
      console.log(`      Email: ${attempt.candidateEmail}`);
      console.log(`      Score: ${attempt.rawScore}`);
      console.log(`      Status: ${attempt.status}`);
      console.log(`      Completed: ${attempt.completedAt}`);
      console.log('');
    });

    const srushtiAttempt = publicAttempts.find((a) =>
      a.candidateName.toLowerCase().includes('srushti')
    );

    if (srushtiAttempt) {
      console.log(
        "✅ SUCCESS: Srushti's attempt is now visible in leaderboard data!"
      );
      console.log('   Rank:', publicAttempts.indexOf(srushtiAttempt) + 1);
      console.log('   Score:', srushtiAttempt.rawScore);
    } else {
      console.log(
        "❌ Srushti's attempt is still not visible in leaderboard data"
      );
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await verifyLeaderboardData();
}

main();
