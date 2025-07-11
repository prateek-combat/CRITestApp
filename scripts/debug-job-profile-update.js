#!/usr/bin/env node

// Debug script to test job profile update logic locally
// This will help identify the specific issue causing 500 errors

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugJobProfileUpdate() {
  try {
    console.log('🔍 Debugging job profile update logic...\n');

    // Test data that might be similar to what's failing
    const jobProfileId = '86040ae8-7251-40b7-b946-580dab98f40f';

    // First, check if the job profile exists
    console.log('1. Checking if job profile exists...');
    const existingProfile = await prisma.jobProfile.findUnique({
      where: { id: jobProfileId },
      include: {
        positions: true,
        testWeights: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!existingProfile) {
      console.log('❌ Job profile not found');
      return;
    }

    console.log('✅ Job profile found:', existingProfile.name);
    console.log('   Current positions:', existingProfile.positions.length);
    console.log('   Current test weights:', existingProfile.testWeights.length);

    // Get some test data for update
    console.log('\n2. Getting available positions and tests...');
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      take: 2,
    });

    const tests = await prisma.test.findMany({
      where: { isArchived: false },
      take: 2,
    });

    console.log('   Available positions:', positions.length);
    console.log('   Available tests:', tests.length);

    if (positions.length === 0 || tests.length === 0) {
      console.log('❌ No positions or tests available for testing');
      return;
    }

    // Test the problematic transaction logic
    console.log('\n3. Testing transaction logic...');

    const positionIds = positions.map(p => p.id);
    const testIds = tests.map(t => t.id);
    const testWeights = [1.0, 1.0];

    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log('   - Deleting existing test weights...');
        
        const deletedWeights = await tx.testWeight.deleteMany({
          where: { jobProfileId: jobProfileId },
        });
        console.log(`   - Deleted ${deletedWeights.count} test weights`);

        console.log('   - Updating job profile...');
        
        const updatedJobProfile = await tx.jobProfile.update({
          where: { id: jobProfileId },
          data: {
            name: existingProfile.name, // Keep same name for testing
            description: existingProfile.description,
            isActive: existingProfile.isActive,
            positions: {
              set: positionIds.map((positionId) => ({ id: positionId })),
            },
            testWeights: {
              create: testIds.map((testId, index) => ({
                testId,
                weight: testWeights[index] || 1.0,
              })),
            },
          },
          include: {
            positions: {
              where: { isActive: true },
            },
            testWeights: {
              include: {
                test: {
                  include: {
                    questions: {
                      select: { id: true },
                    },
                  },
                },
              },
            },
          },
        });

        console.log('   - Job profile updated successfully');

        // Test the position association logic
        console.log('   - Testing position association logic...');
        const primaryPosition = updatedJobProfile.positions.find(p => p.isActive);
        
        if (primaryPosition) {
          for (const testId of testIds) {
            const existingTest = await tx.test.findUnique({
              where: { id: testId },
              select: { positionId: true },
            });

            if (!existingTest?.positionId) {
              await tx.test.update({
                where: { id: testId },
                data: { positionId: primaryPosition.id },
              });
              console.log(`   - Associated test ${testId} with position ${primaryPosition.id}`);
            } else {
              console.log(`   - Test ${testId} already has position association`);
            }
          }
        }

        return updatedJobProfile;
      });

      console.log('\n✅ Transaction completed successfully!');
      console.log('   Updated positions:', result.positions.length);
      console.log('   Updated test weights:', result.testWeights.length);

    } catch (transactionError) {
      console.log('\n❌ Transaction failed with error:');
      console.log('Error type:', transactionError.constructor.name);
      console.log('Error message:', transactionError.message);
      console.log('Error code:', transactionError.code);
      
      if (transactionError.meta) {
        console.log('Error meta:', transactionError.meta);
      }

      // Check for specific Prisma error types
      if (transactionError.code === 'P2025') {
        console.log('🔍 This is a "Record not found" error');
      } else if (transactionError.code === 'P2002') {
        console.log('🔍 This is a "Unique constraint violation" error');
      } else if (transactionError.code === 'P2003') {
        console.log('🔍 This is a "Foreign key constraint violation" error');
      }
    }

  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugJobProfileUpdate().catch(console.error);
