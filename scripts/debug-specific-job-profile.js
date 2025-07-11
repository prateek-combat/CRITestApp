const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugJobProfile() {
  try {
    const profileId = '01854e48-bc06-4524-b6c3-c5fce0fda1cb';
    
    console.log('🔍 Debugging job profile:', profileId);
    
    const jobProfile = await prisma.jobProfile.findUnique({
      where: { id: profileId },
      include: {
        positions: true,
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

    if (!jobProfile) {
      console.log('❌ Job profile not found');
      return;
    }

    console.log('\n📋 JOB PROFILE DETAILS:');
    console.log(`Name: ${jobProfile.name}`);
    console.log(`Description: ${jobProfile.description}`);
    console.log(`Active: ${jobProfile.isActive}`);
    console.log(`Created: ${jobProfile.createdAt}`);
    console.log(`Updated: ${jobProfile.updatedAt}`);

    console.log('\n🎯 POSITIONS:');
    jobProfile.positions.forEach((pos, i) => {
      console.log(`${i + 1}. ${pos.name} (${pos.id}) - Active: ${pos.isActive}`);
    });

    console.log('\n📊 TEST WEIGHTS:');
    jobProfile.testWeights.forEach((tw, i) => {
      console.log(`${i + 1}. Test: ${tw.test?.title || 'MISSING'} (${tw.testId})`);
      console.log(`    Weight: ${tw.weight}`);
      console.log(`    Test Archived: ${tw.test?.isArchived || 'UNKNOWN'}`);
      console.log(`    Test Exists: ${!!tw.test}`);
    });

    console.log('\n📨 INVITATIONS:');
    console.log(`Total: ${jobProfile.invitations.length}`);
    const statusCounts = jobProfile.invitations.reduce((acc, inv) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1;
      return acc;
    }, {});
    console.log('Status breakdown:', statusCounts);

    console.log('\n🚨 POTENTIAL ISSUES:');
    const issues = [];

    // Check for missing tests
    const missingTests = jobProfile.testWeights.filter(tw => !tw.test);
    if (missingTests.length > 0) {
      issues.push(`${missingTests.length} test weights reference missing tests`);
      missingTests.forEach(tw => {
        console.log(`   ❌ Missing test: ${tw.testId}`);
      });
    }

    // Check for archived tests
    const archivedTests = jobProfile.testWeights.filter(tw => tw.test?.isArchived);
    if (archivedTests.length > 0) {
      issues.push(`${archivedTests.length} test weights reference archived tests`);
      archivedTests.forEach(tw => {
        console.log(`   📦 Archived test: ${tw.test.title} (${tw.testId})`);
      });
    }

    // Check for invalid weights
    const invalidWeights = jobProfile.testWeights.filter(tw => 
      tw.weight === null || tw.weight === undefined || isNaN(tw.weight)
    );
    if (invalidWeights.length > 0) {
      issues.push(`${invalidWeights.length} invalid weights`);
      invalidWeights.forEach(tw => {
        console.log(`   ⚠️ Invalid weight: ${tw.weight} for test ${tw.testId}`);
      });
    }

    // Check for inactive positions
    const inactivePositions = jobProfile.positions.filter(pos => !pos.isActive);
    if (inactivePositions.length > 0) {
      issues.push(`${inactivePositions.length} inactive positions`);
      inactivePositions.forEach(pos => {
        console.log(`   💤 Inactive position: ${pos.name} (${pos.id})`);
      });
    }

    if (issues.length === 0) {
      console.log('✅ No obvious data issues found');
    } else {
      console.log('❌ Issues found:', issues.join(', '));
    }

    // Test a minimal update to see what happens
    console.log('\n🧪 TESTING MINIMAL UPDATE...');
    try {
      await prisma.jobProfile.update({
        where: { id: profileId },
        data: {
          updatedAt: new Date()
        }
      });
      console.log('✅ Minimal update successful');
    } catch (error) {
      console.log('❌ Minimal update failed:', error.message);
      console.log('Error code:', error.code);
    }

  } catch (error) {
    console.error('❌ Error debugging job profile:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJobProfile();
