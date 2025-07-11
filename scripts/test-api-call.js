const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testApiCall() {
  try {
    const profileId = '01854e48-bc06-4524-b6c3-c5fce0fda1cb';
    
    console.log('🧪 Testing API call simulation for profile:', profileId);
    
    // Get current profile data first
    const currentProfile = await prisma.jobProfile.findUnique({
      where: { id: profileId },
      include: {
        positions: true,
        testWeights: {
          include: {
            test: true
          }
        }
      }
    });

    if (!currentProfile) {
      console.log('❌ Profile not found');
      return;
    }

    console.log('📋 Current profile data:');
    console.log(`Name: ${currentProfile.name}`);
    console.log(`Description: ${currentProfile.description || 'null'}`);
    console.log(`Active: ${currentProfile.isActive}`);
    console.log(`Positions: ${currentProfile.positions.map(p => p.id)}`);
    console.log(`Tests: ${currentProfile.testWeights.map(tw => tw.testId)}`);
    console.log(`Weights: ${currentProfile.testWeights.map(tw => tw.weight)}`);

    // Simulate what the frontend might be sending
    const testPayloads = [
      // Standard update
      {
        name: currentProfile.name,
        description: currentProfile.description,
        isActive: currentProfile.isActive,
        positionIds: currentProfile.positions.map(p => p.id),
        testIds: currentProfile.testWeights.map(tw => tw.testId),
        testWeights: currentProfile.testWeights.map(tw => tw.weight)
      },
      // Without description
      {
        name: currentProfile.name,
        isActive: currentProfile.isActive,
        positionIds: currentProfile.positions.map(p => p.id),
        testIds: currentProfile.testWeights.map(tw => tw.testId),
        testWeights: currentProfile.testWeights.map(tw => tw.weight)
      },
      // With empty description
      {
        name: currentProfile.name,
        description: '',
        isActive: currentProfile.isActive,
        positionIds: currentProfile.positions.map(p => p.id),
        testIds: currentProfile.testWeights.map(tw => tw.testId),
        testWeights: currentProfile.testWeights.map(tw => tw.weight)
      }
    ];

    for (let i = 0; i < testPayloads.length; i++) {
      const payload = testPayloads[i];
      console.log(`\n🧪 Test ${i + 1}: ${Object.keys(payload).join(', ')}`);
      
      try {
        // Simulate the API validation logic
        const { name, description, isActive, positionIds, testIds, testWeights } = payload;

        // Validate required fields
        if (!name || !positionIds?.length || !testIds?.length) {
          console.log('❌ Validation failed: Missing required fields');
          continue;
        }

        // Validate array lengths match (if testWeights provided)
        if (testWeights && testWeights.length !== testIds.length) {
          console.log(`❌ Array length mismatch: testIds(${testIds.length}) vs testWeights(${testWeights.length})`);
          continue;
        }

        // Ensure testWeights array has the correct length
        const normalizedTestWeights = testIds.map((_, index) => 
          testWeights && testWeights[index] !== undefined ? testWeights[index] : 1.0
        );

        console.log('✅ Validation passed');
        console.log(`   Normalized weights: [${normalizedTestWeights.join(', ')}]`);

        // Test the transaction
        const result = await prisma.$transaction(async (tx) => {
          // Delete existing test weights
          await tx.testWeight.deleteMany({
            where: { jobProfileId: profileId }
          });

          // Create test weights data
          const testWeightsData = testIds.map((testId, index) => ({
            testId,
            weight: normalizedTestWeights[index]
          }));

          // Update the job profile
          return await tx.jobProfile.update({
            where: { id: profileId },
            data: {
              name,
              description,
              isActive: isActive ?? true,
              positions: {
                set: positionIds.map(positionId => ({ id: positionId }))
              },
              testWeights: {
                create: testWeightsData
              }
            }
          });
        });

        console.log('✅ Transaction successful');

      } catch (error) {
        console.log('❌ Transaction failed:', error.message);
        console.log('   Error code:', error.code);
        if (error.meta) {
          console.log('   Error meta:', error.meta);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in API test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiCall();
