#!/usr/bin/env node

// Script to check the current state of job profiles that are failing
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJobProfiles() {
  try {
    console.log('🔍 Checking job profiles status...\n');

    const problematicIds = [
      '86040ae8-7251-40b7-b946-580dab98f40f', // 500 error
      'bafe62bc-955c-45c0-b146-5483922bfa5d'  // 400 error
    ];

    for (const id of problematicIds) {
      console.log(`📋 Checking job profile: ${id}`);
      
      const jobProfile = await prisma.jobProfile.findUnique({
        where: { id },
        include: {
          positions: true,
          testWeights: {
            include: {
              test: {
                select: {
                  id: true,
                  title: true,
                  isArchived: true,
                },
              },
            },
          },
          invitations: {
            select: {
              id: true,
              status: true,
              candidateEmail: true,
            },
          },
        },
      });

      if (!jobProfile) {
        console.log(`❌ Job profile ${id} not found`);
        continue;
      }

      console.log(`✅ Found: ${jobProfile.name}`);
      console.log(`   Active: ${jobProfile.isActive}`);
      console.log(`   Positions: ${jobProfile.positions.length}`);
      console.log(`   Test weights: ${jobProfile.testWeights.length}`);
      console.log(`   Invitations: ${jobProfile.invitations.length}`);
      
      // Check if any tests are archived
      const archivedTests = jobProfile.testWeights.filter(tw => tw.test?.isArchived);
      if (archivedTests.length > 0) {
        console.log(`   ⚠️  Has ${archivedTests.length} archived tests`);
      }

      // Check if any test weights point to non-existent tests
      const nullTests = jobProfile.testWeights.filter(tw => !tw.test);
      if (nullTests.length > 0) {
        console.log(`   ❌ Has ${nullTests.length} test weights pointing to null tests`);
      }

      console.log('   Positions:', jobProfile.positions.map(p => ({ id: p.id, name: p.name, active: p.isActive })));
      console.log('   Tests:', jobProfile.testWeights.map(tw => ({ 
        id: tw.test?.id || 'NULL', 
        title: tw.test?.title || 'NULL', 
        weight: tw.weight,
        archived: tw.test?.isArchived || 'N/A'
      })));
      console.log('');
    }

    // Also check available positions and tests for debugging
    console.log('📊 Available resources:');
    
    const positions = await prisma.position.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });
    console.log(`   Active positions: ${positions.length}`);

    const tests = await prisma.test.findMany({
      where: { isArchived: false },
      select: { id: true, title: true },
      take: 5,
    });
    console.log(`   Active tests: ${tests.length} (showing first 5)`);
    
  } catch (error) {
    console.error('Error checking job profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJobProfiles().catch(console.error);
