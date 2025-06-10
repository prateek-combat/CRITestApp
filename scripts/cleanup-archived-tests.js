/**
 * Cleanup Script for Archived Tests
 *
 * This script permanently deletes tests that have been archived for more than 30 days.
 * It should be run periodically (e.g., daily via cron job) to maintain database hygiene.
 *
 * Usage:
 *   node scripts/cleanup-archived-tests.js [--dry-run] [--days=30]
 *
 * Options:
 *   --dry-run   Show what would be deleted without actually deleting
 *   --days=N    Set custom retention period (default: 30 days)
 *
 * Environment:
 *   Requires DATABASE_URL environment variable
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const daysArg = args.find((arg) => arg.startsWith('--days='));
const retentionDays = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

async function cleanupArchivedTests() {
  try {
    console.log('🗑️  Archive Cleanup Script Started');
    console.log('═'.repeat(50));
    console.log(`📅 Retention period: ${retentionDays} days`);
    console.log(
      `🔍 Mode: ${isDryRun ? 'DRY RUN (no actual deletion)' : 'LIVE MODE'}`
    );
    console.log('─'.repeat(50));

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    console.log(`📆 Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`   (Tests archived before this date will be deleted)`);
    console.log('');

    // Find archived tests older than cutoff date
    const archivedTests = await prisma.test.findMany({
      where: {
        isArchived: true,
        archivedAt: {
          lt: cutoffDate,
        },
      },
      include: {
        _count: {
          select: {
            questions: true,
            invitations: true,
            testAttempts: true,
            publicTestLinks: true,
          },
        },
        archivedBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (archivedTests.length === 0) {
      console.log(
        '✅ No archived tests found that exceed the retention period.'
      );
      console.log('   Database is clean.');
      return;
    }

    console.log(
      `🔍 Found ${archivedTests.length} archived test(s) ready for cleanup:`
    );
    console.log('');

    let totalQuestions = 0;
    let totalInvitations = 0;
    let totalAttempts = 0;
    let totalPublicLinks = 0;

    // Display what will be deleted
    archivedTests.forEach((test, index) => {
      const archivedBy = test.archivedBy;
      const archivedByName = archivedBy
        ? `${archivedBy.firstName || ''} ${archivedBy.lastName || ''}`.trim() ||
          archivedBy.email
        : 'Unknown';

      console.log(`📋 ${index + 1}. "${test.title}"`);
      console.log(`   ID: ${test.id}`);
      console.log(`   Archived: ${test.archivedAt?.toISOString()}`);
      console.log(`   Archived by: ${archivedByName}`);
      console.log(`   Questions: ${test._count.questions}`);
      console.log(`   Invitations: ${test._count.invitations}`);
      console.log(`   Test Attempts: ${test._count.testAttempts}`);
      console.log(`   Public Links: ${test._count.publicTestLinks}`);
      console.log('');

      totalQuestions += test._count.questions;
      totalInvitations += test._count.invitations;
      totalAttempts += test._count.testAttempts;
      totalPublicLinks += test._count.publicTestLinks;
    });

    console.log('📊 Summary of data to be permanently deleted:');
    console.log(`   Tests: ${archivedTests.length}`);
    console.log(`   Questions: ${totalQuestions}`);
    console.log(`   Invitations: ${totalInvitations}`);
    console.log(`   Test Attempts: ${totalAttempts}`);
    console.log(`   Public Links: ${totalPublicLinks}`);
    console.log('');

    if (isDryRun) {
      console.log('🚫 DRY RUN MODE - No actual deletion performed');
      console.log('   Run without --dry-run to perform actual cleanup');
      return;
    }

    // Confirm deletion in live mode
    if (process.stdout.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question(
          '⚠️  Are you sure you want to PERMANENTLY delete these archived tests? (yes/no): ',
          resolve
        );
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Cleanup cancelled by user');
        return;
      }
    }

    console.log('🗑️  Starting permanent deletion...');
    console.log('');

    // Delete tests one by one with progress
    let deletedCount = 0;
    for (const test of archivedTests) {
      try {
        console.log(`   Deleting "${test.title}"...`);

        await prisma.test.delete({
          where: { id: test.id },
        });

        deletedCount++;
        console.log(`   ✅ Deleted (${deletedCount}/${archivedTests.length})`);
      } catch (error) {
        console.error(
          `   ❌ Failed to delete "${test.title}": ${error.message}`
        );
      }
    }

    console.log('');
    console.log(`✅ Cleanup completed successfully!`);
    console.log(
      `   Permanently deleted: ${deletedCount}/${archivedTests.length} tests`
    );

    if (deletedCount < archivedTests.length) {
      console.log(
        `   ⚠️  ${archivedTests.length - deletedCount} tests failed to delete`
      );
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to show usage
function showUsage() {
  console.log('Usage: node scripts/cleanup-archived-tests.js [options]');
  console.log('');
  console.log('Options:');
  console.log(
    '  --dry-run     Show what would be deleted without actually deleting'
  );
  console.log('  --days=N      Set custom retention period (default: 30 days)');
  console.log('  --help        Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/cleanup-archived-tests.js --dry-run');
  console.log('  node scripts/cleanup-archived-tests.js --days=60');
  console.log('  node scripts/cleanup-archived-tests.js --dry-run --days=7');
}

// Main execution
if (args.includes('--help')) {
  showUsage();
  process.exit(0);
}

// Validate days argument
if (daysArg && (isNaN(retentionDays) || retentionDays < 1)) {
  console.error('❌ Invalid --days value. Must be a positive number.');
  process.exit(1);
}

cleanupArchivedTests();
