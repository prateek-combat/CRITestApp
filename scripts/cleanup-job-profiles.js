const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function cleanupJobProfiles() {
  try {
    console.log('🧹 Starting job profile data cleanup...\n');

    const jobProfiles = await prisma.jobProfile.findMany({
      include: {
        testWeights: {
          include: {
            test: {
              select: {
                id: true,
                title: true,
                isArchived: true
              }
            }
          }
        },
        invitations: {
          select: {
            id: true,
            status: true
          }
        }
      }
    });

    let cleanedProfiles = 0;
    let deletedProfiles = 0;

    for (const profile of jobProfiles) {
      const hasInvitations = profile.invitations.length > 0;
      const hasCompletedInvitations = profile.invitations.some(inv => inv.status === 'COMPLETED');
      
      console.log(`\n📋 Processing: ${profile.name} (${profile.id})`);
      console.log(`   Invitations: ${profile.invitations.length} (${profile.invitations.filter(i => i.status === 'COMPLETED').length} completed)`);

      // Find problematic test weights
      const archivedTestWeights = profile.testWeights.filter(tw => !tw.test || tw.test.isArchived);
      const validTestWeights = profile.testWeights.filter(tw => tw.test && !tw.test.isArchived);
      const invalidWeights = validTestWeights.filter(tw => tw.weight === null || tw.weight === undefined || isNaN(tw.weight));
      const extremeWeights = validTestWeights.filter(tw => tw.weight < 0 || tw.weight > 10);

      const hasIssues = archivedTestWeights.length > 0 || invalidWeights.length > 0 || extremeWeights.length > 0;

      if (!hasIssues) {
        console.log('   ✅ Profile data is clean');
        continue;
      }

      console.log(`   🚨 Issues found:`);
      if (archivedTestWeights.length > 0) {
        console.log(`      - ${archivedTestWeights.length} archived/missing test references`);
      }
      if (invalidWeights.length > 0) {
        console.log(`      - ${invalidWeights.length} invalid weights`);
      }
      if (extremeWeights.length > 0) {
        console.log(`      - ${extremeWeights.length} extreme weights`);
      }

      // Decision logic
      if (hasCompletedInvitations) {
        console.log('   ⚠️  Has completed invitations - CLEANING data instead of deleting');
        
        // Clean up the data
        await prisma.$transaction(async (tx) => {
          // Remove problematic test weights
          if (archivedTestWeights.length > 0) {
            await tx.testWeight.deleteMany({
              where: {
                jobProfileId: profile.id,
                testId: {
                  in: archivedTestWeights.map(tw => tw.testId)
                }
              }
            });
            console.log(`      ✅ Removed ${archivedTestWeights.length} archived test references`);
          }

          // Fix invalid weights
          for (const invalidWeight of invalidWeights) {
            await tx.testWeight.update({
              where: {
                jobProfileId_testId: {
                  jobProfileId: profile.id,
                  testId: invalidWeight.testId
                }
              },
              data: {
                weight: 1.0
              }
            });
          }
          if (invalidWeights.length > 0) {
            console.log(`      ✅ Fixed ${invalidWeights.length} invalid weights (set to 1.0)`);
          }

          // Fix extreme weights
          for (const extremeWeight of extremeWeights) {
            const newWeight = extremeWeight.weight < 0 ? 1.0 : Math.min(extremeWeight.weight, 5.0);
            await tx.testWeight.update({
              where: {
                jobProfileId_testId: {
                  jobProfileId: profile.id,
                  testId: extremeWeight.testId
                }
              },
              data: {
                weight: newWeight
              }
            });
          }
          if (extremeWeights.length > 0) {
            console.log(`      ✅ Fixed ${extremeWeights.length} extreme weights`);
          }
        });

        cleanedProfiles++;

      } else if (hasInvitations) {
        console.log('   ⚠️  Has pending invitations - DEACTIVATING instead of deleting');
        
        await prisma.jobProfile.update({
          where: { id: profile.id },
          data: { isActive: false }
        });
        
        console.log('      ✅ Profile deactivated');
        cleanedProfiles++;

      } else {
        console.log('   🗑️  No invitations - SAFE TO DELETE');
        
        await prisma.$transaction(async (tx) => {
          // Delete test weights first
          await tx.testWeight.deleteMany({
            where: { jobProfileId: profile.id }
          });
          
          // Delete the profile
          await tx.jobProfile.delete({
            where: { id: profile.id }
          });
        });
        
        console.log('      ✅ Profile deleted');
        deletedProfiles++;
      }
    }

    console.log('\n📊 CLEANUP SUMMARY:');
    console.log(`- Profiles processed: ${jobProfiles.length}`);
    console.log(`- Profiles cleaned/deactivated: ${cleanedProfiles}`);
    console.log(`- Profiles deleted: ${deletedProfiles}`);
    console.log(`- Profiles left unchanged: ${jobProfiles.length - cleanedProfiles - deletedProfiles}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('⚠️  This will modify/delete job profiles with data issues. Continue? (yes/no): ', (answer) => {
  if (answer.toLowerCase() === 'yes') {
    cleanupJobProfiles();
  } else {
    console.log('Cleanup cancelled.');
  }
  rl.close();
});
