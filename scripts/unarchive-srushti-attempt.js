#!/usr/bin/env node

/**
 * Script to unarchive Srushti's test attempt
 * Changes status from ARCHIVED to COMPLETED so it appears in leaderboard
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function unarchiveSrushtiAttempt() {
  try {
    console.log("🔄 Unarchiving Srushti's test attempt...\n");

    // Find the archived attempt
    const archivedAttempt = await prisma.publicTestAttempt.findFirst({
      where: {
        candidateName: {
          contains: 'srushti milind chavan',
          mode: 'insensitive',
        },
        status: 'ARCHIVED',
      },
    });

    if (!archivedAttempt) {
      console.log('❌ No archived attempt found for Srushti');
      return;
    }

    console.log('📋 Found archived attempt:');
    console.log('   ID:', archivedAttempt.id);
    console.log('   Name:', archivedAttempt.candidateName);
    console.log('   Email:', archivedAttempt.candidateEmail);
    console.log('   Current Status:', archivedAttempt.status);
    console.log('   Score:', archivedAttempt.rawScore);
    console.log('   Completed At:', archivedAttempt.completedAt);
    console.log('');

    // Verify this is a completed test (has completion date and score)
    if (!archivedAttempt.completedAt || archivedAttempt.rawScore === null) {
      console.log('❌ This attempt appears to be incomplete. Not unarchiving.');
      console.log('   Completed At:', archivedAttempt.completedAt);
      console.log('   Raw Score:', archivedAttempt.rawScore);
      return;
    }

    // Update status from ARCHIVED to COMPLETED
    const updatedAttempt = await prisma.publicTestAttempt.update({
      where: { id: archivedAttempt.id },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date(),
      },
    });

    console.log('✅ Successfully unarchived test attempt!');
    console.log('   New Status:', updatedAttempt.status);
    console.log('   Updated At:', updatedAttempt.updatedAt);
    console.log('   This attempt should now appear in the leaderboard.');

    // Verify the change
    const verifyAttempt = await prisma.publicTestAttempt.findUnique({
      where: { id: archivedAttempt.id },
      select: { status: true, candidateName: true, rawScore: true },
    });

    console.log('\n🔍 Verification:');
    console.log('   Name:', verifyAttempt.candidateName);
    console.log('   Status:', verifyAttempt.status);
    console.log('   Score:', verifyAttempt.rawScore);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await unarchiveSrushtiAttempt();
}

main();
