const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupPublicLinksAndSlots() {
  try {
    console.log('Starting cleanup of all public links and time slots...\\n');
    console.log(
      'NOTE: With the updated schema, public test attempts will be preserved.'
    );
    console.log(
      'The publicLinkId field will be set to NULL for associated attempts.\\n'
    );

    // First, get count of existing data
    const publicLinksCount = await prisma.publicTestLink.count();
    const timeSlotsCount = await prisma.timeSlot.count();
    const publicAttemptsCount = await prisma.publicTestAttempt.count();

    console.log('Current state:');
    console.log(`- Public test links: ${publicLinksCount}`);
    console.log(`- Time slots: ${timeSlotsCount}`);
    console.log(
      `- Public test attempts: ${publicAttemptsCount} (will be preserved)\\n`
    );

    if (publicLinksCount === 0 && timeSlotsCount === 0) {
      console.log('No public links or time slots found. Nothing to delete.');
      return;
    }

    // Delete all public test links (this will cascade delete attempts)
    console.log('Deleting all public test links...');
    const deletedLinks = await prisma.publicTestLink.deleteMany({});
    console.log(`✓ Deleted ${deletedLinks.count} public test links\\n`);

    // Delete all time slots
    console.log('Deleting all time slots...');
    const deletedSlots = await prisma.timeSlot.deleteMany({});
    console.log(`✓ Deleted ${deletedSlots.count} time slots\\n`);

    // Verify final state
    const finalAttempts = await prisma.publicTestAttempt.count();
    const finalLinks = await prisma.publicTestLink.count();
    const finalSlots = await prisma.timeSlot.count();

    // Count attempts with null publicLinkId
    const nullLinkAttempts = await prisma.publicTestAttempt.count({
      where: { publicLinkId: null },
    });

    console.log('Final state:');
    console.log(`- Public test links: ${finalLinks}`);
    console.log(`- Time slots: ${finalSlots}`);
    console.log(`- Public test attempts: ${finalAttempts} (preserved)`);
    console.log(`- Attempts with NULL publicLinkId: ${nullLinkAttempts}`);

    console.log('\\n✅ Cleanup completed successfully!');
    console.log('All public links and time slots have been deleted.');
    console.log(
      'Public test attempts have been preserved with publicLinkId set to NULL.'
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupPublicLinksAndSlots().catch((error) => {
  console.error('Failed to run cleanup:', error);
  process.exit(1);
});
