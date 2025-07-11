const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testFailingUpdate() {
  try {
    const profileId = '01854e48-bc06-4524-b6c3-c5fce0fda1cb';
    
    console.log('🧪 Testing the failing update for profile:', profileId);
    
    // Get current profile data
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
    console.log(`Positions: ${currentProfile.positions.length}`);
    console.log(`Test weights: ${currentProfile.testWeights.length}`);

    // Test the transaction that might be failing
    console.log('\n🔄 Testing transaction update...');
    
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log('  Step 1: Deleting existing test weights...');
        const deleted = await tx.testWeight.deleteMany({
          where: { jobProfileId: profileId }
        });
        console.log(`  Deleted ${deleted.count} test weights`);

        console.log('  Step 2: Updating job profile...');
        const updated = await tx.jobProfile.update({
          where: { id: profileId },
          data: {
            name: currentProfile.name,
            description: currentProfile.description,
            isActive: currentProfile.isActive,
            positions: {
              set: currentProfile.positions.map(p => ({ id: p.id }))
            },
            testWeights: {
              create: currentProfile.testWeights.map(tw => ({
                testId: tw.testId,
                weight: tw.weight || 1.0
              }))
            }
          },
          include: {
            positions: true,
            testWeights: true
          }
        });
        console.log('  Step 3: Update successful');
        return updated;
      });
      
      console.log('✅ Transaction completed successfully');
      console.log(`Updated profile: ${result.name}`);
      
    } catch (txError) {
      console.log('❌ Transaction failed:', txError.message);
      console.log('Error code:', txError.code);
      console.log('Error meta:', txError.meta);
      
      // Check if it's a foreign key constraint issue
      if (txError.code === 'P2003') {
        console.log('\n🔍 Foreign key constraint failed. Checking references...');
        
        // Check if positions exist
        for (const position of currentProfile.positions) {
          const posExists = await prisma.position.findUnique({
            where: { id: position.id }
          });
          if (!posExists) {
            console.log(`❌ Position not found: ${position.id} (${position.name})`);
          } else {
            console.log(`✅ Position exists: ${position.id} (${position.name})`);
          }
        }
        
        // Check if tests exist
        for (const tw of currentProfile.testWeights) {
          const testExists = await prisma.test.findUnique({
            where: { id: tw.testId }
          });
          if (!testExists) {
            console.log(`❌ Test not found: ${tw.testId}`);
          } else {
            console.log(`✅ Test exists: ${tw.testId} (${testExists.title})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFailingUpdate();
