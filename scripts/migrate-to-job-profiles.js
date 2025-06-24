const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToJobProfiles() {
  console.log('🚀 Starting migration to Job Profiles...');

  try {
    // Get all active positions with their associated tests
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      include: {
        testsMany: true, // Many-to-many relationship with tests
        createdBy: true,
      },
    });

    console.log(`Found ${positions.length} active positions to migrate`);

    for (const position of positions) {
      // Check if a job profile already exists for this position
      const existingJobProfile = await prisma.jobProfile.findFirst({
        where: { name: position.name },
      });

      if (existingJobProfile) {
        console.log(
          `⚠️  Job profile already exists for position: ${position.name}`
        );
        continue;
      }

      // Create a job profile for each position
      const jobProfile = await prisma.jobProfile.create({
        data: {
          name: position.name,
          description:
            position.description || `Job profile for ${position.name} position`,
          isActive: position.isActive,
          createdById: position.createdById,
          positions: {
            connect: [{ id: position.id }],
          },
        },
      });

      console.log(`✅ Created job profile: ${jobProfile.name}`);

      // Create test weights for each test associated with this position
      if (position.testsMany.length > 0) {
        const testWeights = position.testsMany.map((test) => ({
          jobProfileId: jobProfile.id,
          testId: test.id,
          weight: 1.0, // Default equal weight for all tests
        }));

        await prisma.testWeight.createMany({
          data: testWeights,
        });

        console.log(`   📊 Added ${testWeights.length} test weights`);
      } else {
        console.log(
          `   ⚠️  No tests associated with position: ${position.name}`
        );
      }
    }

    // Migrate existing invitations to job profile invitations
    console.log('\n🔄 Migrating existing invitations...');

    const invitations = await prisma.invitation.findMany({
      include: {
        test: {
          include: {
            positions: true,
          },
        },
      },
    });

    console.log(`Found ${invitations.length} invitations to process`);

    for (const invitation of invitations) {
      // Find the job profile for this test's position
      if (invitation.test.positions.length > 0) {
        const position = invitation.test.positions[0]; // Take the first position

        const jobProfile = await prisma.jobProfile.findFirst({
          where: {
            positions: {
              some: { id: position.id },
            },
          },
        });

        if (jobProfile) {
          // Check if job profile invitation already exists
          const existingJobProfileInvitation =
            await prisma.jobProfileInvitation.findFirst({
              where: {
                jobProfileId: jobProfile.id,
                candidateEmail: invitation.candidateEmail,
              },
            });

          if (!existingJobProfileInvitation) {
            // Create job profile invitation
            const jobProfileInvitation =
              await prisma.jobProfileInvitation.create({
                data: {
                  jobProfileId: jobProfile.id,
                  candidateEmail: invitation.candidateEmail || '',
                  candidateName: invitation.candidateName,
                  status: invitation.status,
                  expiresAt: invitation.expiresAt,
                  createdById: invitation.createdById,
                },
              });

            // Link existing test attempt to job profile invitation
            const testAttempt = await prisma.testAttempt.findFirst({
              where: { invitationId: invitation.id },
            });

            if (testAttempt) {
              await prisma.testAttempt.update({
                where: { id: testAttempt.id },
                data: { jobProfileInvitationId: jobProfileInvitation.id },
              });
            }

            console.log(
              `✅ Migrated invitation for ${invitation.candidateEmail} to job profile: ${jobProfile.name}`
            );
          }
        }
      }
    }

    console.log('\n📊 Migration Summary:');
    const jobProfileCount = await prisma.jobProfile.count();
    const testWeightCount = await prisma.testWeight.count();
    const jobProfileInvitationCount = await prisma.jobProfileInvitation.count();

    console.log(`- Job Profiles created: ${jobProfileCount}`);
    console.log(`- Test Weights created: ${testWeightCount}`);
    console.log(
      `- Job Profile Invitations created: ${jobProfileInvitationCount}`
    );

    console.log('\n✅ Migration completed successfully!');
    console.log(
      '📝 Note: All existing data has been preserved. Job profiles are now available alongside existing structure.'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  migrateToJobProfiles()
    .then(() => {
      console.log('🎉 Job Profile migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToJobProfiles };
