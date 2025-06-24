#!/usr/bin/env node

/**
 * Initialize Default Category Weight Profiles
 *
 * This script creates the default weight profiles in the database.
 * Run this after applying the CategoryWeightProfile migration.
 *
 * Usage: node scripts/initialize-weight-profiles.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_WEIGHT_PROFILES = [
  {
    name: 'Equal Weights (Default)',
    description: 'All categories have equal importance (20% each)',
    weights: {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 20,
      OTHER: 20,
    },
    isDefault: true,
    isSystem: true,
  },
  {
    name: 'Verbal Focused',
    description: 'High emphasis on verbal ability for communication roles',
    weights: {
      LOGICAL: 15,
      VERBAL: 50,
      NUMERICAL: 15,
      ATTENTION_TO_DETAIL: 15,
      OTHER: 5,
    },
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Logical Reasoning Priority',
    description: 'Emphasis on logical thinking for technical roles',
    weights: {
      LOGICAL: 45,
      VERBAL: 20,
      NUMERICAL: 20,
      ATTENTION_TO_DETAIL: 10,
      OTHER: 5,
    },
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Analytical Balance',
    description: 'Balanced focus on logical and numerical abilities',
    weights: {
      LOGICAL: 30,
      VERBAL: 15,
      NUMERICAL: 35,
      ATTENTION_TO_DETAIL: 15,
      OTHER: 5,
    },
    isDefault: false,
    isSystem: true,
  },
  {
    name: 'Detail-Oriented',
    description: 'High emphasis on attention to detail for quality roles',
    weights: {
      LOGICAL: 20,
      VERBAL: 20,
      NUMERICAL: 15,
      ATTENTION_TO_DETAIL: 40,
      OTHER: 5,
    },
    isDefault: false,
    isSystem: true,
  },
];

async function initializeWeightProfiles() {
  console.log('🎯 Initializing default category weight profiles...\n');

  try {
    // Check if profiles already exist
    const existingProfiles = await prisma.categoryWeightProfile.findMany();

    if (existingProfiles.length > 0) {
      console.log(
        `ℹ️  Found ${existingProfiles.length} existing weight profiles.`
      );
      console.log('   Skipping initialization to avoid duplicates.\n');

      // Show existing profiles
      console.log('📋 Existing profiles:');
      existingProfiles.forEach((profile) => {
        console.log(
          `   • ${profile.name}${profile.isDefault ? ' (Default)' : ''}`
        );
      });
      console.log();
      return;
    }

    // Create default profiles
    console.log('🔧 Creating default weight profiles...\n');

    for (const profileData of DEFAULT_WEIGHT_PROFILES) {
      try {
        const profile = await prisma.categoryWeightProfile.create({
          data: profileData,
        });

        console.log(
          `✅ Created: "${profile.name}"${profile.isDefault ? ' (Default)' : ''}`
        );
      } catch (error) {
        console.error(
          `❌ Failed to create "${profileData.name}":`,
          error.message
        );
      }
    }

    console.log('\n🎉 Weight profiles initialization completed!');
    console.log('\n📊 Profile Summary:');

    const allProfiles = await prisma.categoryWeightProfile.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    allProfiles.forEach((profile) => {
      console.log(
        `\n   📁 ${profile.name}${profile.isDefault ? ' (Default)' : ''}`
      );
      console.log(`      ${profile.description || 'No description'}`);
      console.log('      Weights:');
      Object.entries(profile.weights).forEach(([category, weight]) => {
        console.log(`        • ${category}: ${weight}%`);
      });
    });

    console.log(
      '\n✨ You can now use the admin panel to create custom weight profiles!'
    );
  } catch (error) {
    console.error('❌ Error initializing weight profiles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Validate environment
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  console.error('   Please set up your environment variables first.');
  process.exit(1);
}

// Run the initialization
initializeWeightProfiles();
