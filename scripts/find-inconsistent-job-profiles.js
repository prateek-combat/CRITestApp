const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function findInconsistentJobProfiles() {
  try {
    console.log('🔍 Scanning for job profiles with inconsistent test/weight data...\n');

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
        }
      }
    });

    const issues = [];

    for (const profile of jobProfiles) {
      const activeTests = profile.testWeights.filter(tw => tw.test && !tw.test.isArchived);
      const testIds = activeTests.map(tw => tw.testId);
      const weights = activeTests.map(tw => tw.weight);

      // Check for issues
      const problemProfile = {
        id: profile.id,
        name: profile.name,
        isActive: profile.isActive,
        issues: []
      };

      // Check for duplicate test IDs
      const uniqueTestIds = [...new Set(testIds)];
      if (testIds.length !== uniqueTestIds.length) {
        problemProfile.issues.push('Duplicate test IDs found');
      }

      // Check for null/undefined weights
      const invalidWeights = weights.filter(w => w === null || w === undefined || isNaN(w));
      if (invalidWeights.length > 0) {
        problemProfile.issues.push(`${invalidWeights.length} invalid weights (null/undefined/NaN)`);
      }

      // Check for missing tests (testWeight exists but test is archived/deleted)
      const missingTests = profile.testWeights.filter(tw => !tw.test || tw.test.isArchived);
      if (missingTests.length > 0) {
        problemProfile.issues.push(`${missingTests.length} references to archived/missing tests`);
      }

      // Check for extreme weights (likely data entry errors)
      const extremeWeights = weights.filter(w => w < 0 || w > 10);
      if (extremeWeights.length > 0) {
        problemProfile.issues.push(`${extremeWeights.length} extreme weights (< 0 or > 10): ${extremeWeights.join(', ')}`);
      }

      if (problemProfile.issues.length > 0) {
        issues.push({
          ...problemProfile,
          testCount: activeTests.length,
          totalTestWeights: profile.testWeights.length,
          testIds: testIds,
          weights: weights
        });
      }
    }

    console.log(`📊 SCAN RESULTS:`);
    console.log(`- Total job profiles scanned: ${jobProfiles.length}`);
    console.log(`- Profiles with issues: ${issues.length}\n`);

    if (issues.length > 0) {
      console.log('🚨 PROBLEMATIC JOB PROFILES:\n');
      
      for (const issue of issues) {
        console.log(`Profile: ${issue.name} (${issue.id})`);
        console.log(`Status: ${issue.isActive ? 'ACTIVE' : 'INACTIVE'}`);
        console.log(`Issues: ${issue.issues.join(', ')}`);
        console.log(`Test IDs (${issue.testCount}): ${issue.testIds.join(', ')}`);
        console.log(`Weights (${issue.weights.length}): ${issue.weights.join(', ')}`);
        console.log(`Total test weights in DB: ${issue.totalTestWeights}`);
        console.log('---');
      }

      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Review profiles above for data integrity');
      console.log('2. Consider cleaning up archived test references');
      console.log('3. Fix extreme weight values');
      console.log('4. Remove duplicate test associations');
      
      console.log('\n🧹 To clean up these issues, run:');
      console.log('node scripts/cleanup-job-profiles.js');
    } else {
      console.log('✅ All job profiles have consistent data!');
    }

  } catch (error) {
    console.error('❌ Error scanning job profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findInconsistentJobProfiles();
