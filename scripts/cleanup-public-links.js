const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Starting cleanup of all public test links...');

  try {
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Get count of existing public links before deletion
    const linkCount = await prisma.publicTestLink.count();
    console.log(`📊 Found ${linkCount} public test links to delete`);

    if (linkCount === 0) {
      console.log('✅ No public test links found. Database is already clean.');
      return;
    }

    // Get some info about the links before deleting
    const linksWithAttempts = await prisma.publicTestLink.findMany({
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
        test: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log('📋 Summary of links to be deleted:');
    linksWithAttempts.forEach((link, index) => {
      console.log(
        `   ${index + 1}. ${link.test.title} - ${link.title || 'Untitled'} (${link._count.attempts} attempts)`
      );
    });

    // Ask for confirmation (skip in non-interactive environments)
    if (process.stdin.isTTY) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const answer = await new Promise((resolve) => {
        rl.question(
          '\n⚠️  This will permanently delete ALL public test links and their associated attempts. Continue? (yes/no): ',
          resolve
        );
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled by user');
        return;
      }
    }

    // Start deletion process
    console.log('\n🗑️  Starting deletion process...');

    // Delete in the correct order to handle foreign key constraints
    // 1. Delete public test attempts first
    const deletedAttempts = await prisma.publicTestAttempt.deleteMany({});
    console.log(`✅ Deleted ${deletedAttempts.count} public test attempts`);

    // 2. Delete public test links
    const deletedLinks = await prisma.publicTestLink.deleteMany({});
    console.log(`✅ Deleted ${deletedLinks.count} public test links`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Public test attempts deleted: ${deletedAttempts.count}`);
    console.log(`   - Public test links deleted: ${deletedLinks.count}`);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
