const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDataRestoration() {
  try {
    console.log('Checking database restoration status...\n');

    // Check public test links
    const publicLinksCount = await prisma.publicTestLink.count();
    console.log(`✓ Public test links: ${publicLinksCount}`);

    if (publicLinksCount > 0) {
      const sampleLinks = await prisma.publicTestLink.findMany({
        take: 3,
        include: {
          test: {
            select: { title: true },
          },
          jobProfile: {
            select: { name: true },
          },
        },
      });
      console.log('  Sample links:');
      sampleLinks.forEach((link) => {
        console.log(
          `    - ${link.test.title} (Job Profile: ${link.jobProfile?.name || 'None'})`
        );
      });
    }

    // Check time slots
    const timeSlotsCount = await prisma.timeSlot.count();
    console.log(`\n✓ Time slots: ${timeSlotsCount}`);

    if (timeSlotsCount > 0) {
      const sampleSlots = await prisma.timeSlot.findMany({
        take: 3,
        include: {
          jobProfile: {
            select: { name: true },
          },
        },
      });
      console.log('  Sample time slots:');
      sampleSlots.forEach((slot) => {
        console.log(`    - ${slot.name} for ${slot.jobProfile.name}`);
      });
    }

    // Check public test attempts
    const publicAttemptsCount = await prisma.publicTestAttempt.count();
    console.log(`\n✓ Public test attempts: ${publicAttemptsCount}`);

    if (publicAttemptsCount > 0) {
      const completedCount = await prisma.publicTestAttempt.count({
        where: { status: 'COMPLETED' },
      });
      console.log(`  - Completed: ${completedCount}`);
      console.log(
        `  - In progress/Other: ${publicAttemptsCount - completedCount}`
      );
    }

    // Check job profiles
    const jobProfilesCount = await prisma.jobProfile.count();
    console.log(`\n✓ Job profiles: ${jobProfilesCount}`);

    // Check if public links are properly linked to job profiles
    const linksWithJobProfile = await prisma.publicTestLink.count({
      where: { jobProfileId: { not: null } },
    });
    console.log(
      `\n✓ Public links with job profile: ${linksWithJobProfile} / ${publicLinksCount}`
    );

    // Summary
    console.log('\n' + '='.repeat(50));
    if (publicLinksCount > 0 && timeSlotsCount > 0 && publicAttemptsCount > 0) {
      console.log('✅ DATABASE APPEARS TO BE RESTORED');
      console.log('   All main data types are present.');
    } else {
      console.log('⚠️  DATABASE MAY NOT BE FULLY RESTORED');
      console.log('   Some data types are missing.');
    }
    console.log('='.repeat(50));
  } catch (error) {
    console.error('❌ Error checking database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDataRestoration().catch((error) => {
  console.error('Failed to check data restoration:', error);
  process.exit(1);
});
