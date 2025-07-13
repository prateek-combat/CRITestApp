#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNullPublicLinkAttempts() {
  console.log('Checking public test attempts with NULL publicLinkId...\n');

  try {
    // Count total attempts
    const totalAttempts = await prisma.publicTestAttempt.count();

    // Count attempts with null publicLinkId
    const nullLinkAttempts = await prisma.publicTestAttempt.count({
      where: { publicLinkId: null },
    });

    // Count attempts with non-null publicLinkId
    const nonNullLinkAttempts = await prisma.publicTestAttempt.count({
      where: { publicLinkId: { not: null } },
    });

    console.log('Results:');
    console.log(`- Total public test attempts: ${totalAttempts}`);
    console.log(`- Attempts with NULL publicLinkId: ${nullLinkAttempts}`);
    console.log(
      `- Attempts with non-NULL publicLinkId: ${nonNullLinkAttempts}`
    );

    if (nullLinkAttempts === totalAttempts) {
      console.log(
        '\n✅ All public test attempts have been successfully preserved with NULL publicLinkId!'
      );
    } else if (nullLinkAttempts > 0) {
      console.log(
        `\n⚠️  ${nullLinkAttempts} attempts have NULL publicLinkId, but ${nonNullLinkAttempts} still have links.`
      );
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNullPublicLinkAttempts();
