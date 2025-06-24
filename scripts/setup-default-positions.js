#!/usr/bin/env node

/**
 * Script to set up default positions for the position-based leaderboard system
 * This script creates default positions that can be used to categorize tests
 *
 * IMPORTANT: This script PRESERVES all existing data and only adds new positions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Setting up default positions for position-based leaderboard...\n'
  );

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`✅ Admin user found: ${adminUser.email}\n`);

    // Define default positions
    const defaultPositions = [
      {
        name: 'Software Engineer',
        code: 'SWE',
        description: 'Software development and programming roles',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Frontend Developer',
        code: 'FE_DEV',
        description: 'Frontend development with React, Vue, Angular',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Backend Developer',
        code: 'BE_DEV',
        description: 'Backend development and API design',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Full Stack Developer',
        code: 'FS_DEV',
        description: 'Full stack development capabilities',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Mechanical Engineer',
        code: 'MECH_ENG',
        description: 'Mechanical engineering and design roles',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Robotics Engineer',
        code: 'ROBOT_ENG',
        description: 'Robotics and automation engineering',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Data Scientist',
        code: 'DATA_SCI',
        description: 'Data analysis and machine learning roles',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'DevOps Engineer',
        code: 'DEVOPS',
        description: 'DevOps and infrastructure management',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'QA Engineer',
        code: 'QA_ENG',
        description: 'Quality assurance and testing roles',
        department: 'Engineering',
        level: 'Mid-Level',
      },
      {
        name: 'Product Manager',
        code: 'PM',
        description: 'Product management and strategy',
        department: 'Product',
        level: 'Mid-Level',
      },
      {
        name: 'Project Manager',
        code: 'PROJ_MGR',
        description: 'Project management and coordination',
        department: 'Operations',
        level: 'Mid-Level',
      },
      {
        name: 'Business Analyst',
        code: 'BA',
        description: 'Business analysis and requirements gathering',
        department: 'Operations',
        level: 'Mid-Level',
      },
      {
        name: 'Unassigned',
        code: 'UNASSIGNED',
        description: 'Tests not yet assigned to a specific position',
        department: 'General',
        level: 'All Levels',
      },
    ];

    console.log('📋 Creating default positions...\n');

    let createdCount = 0;
    let skippedCount = 0;

    for (const positionData of defaultPositions) {
      try {
        // Check if position already exists
        const existingPosition = await prisma.position.findFirst({
          where: {
            OR: [{ name: positionData.name }, { code: positionData.code }],
          },
        });

        if (existingPosition) {
          console.log(`⏭️  Skipped: ${positionData.name} (already exists)`);
          skippedCount++;
          continue;
        }

        // Create new position
        const position = await prisma.position.create({
          data: {
            ...positionData,
            createdById: adminUser.id,
          },
        });

        console.log(`✅ Created: ${position.name} (${position.code})`);
        createdCount++;
      } catch (error) {
        console.error(
          `❌ Error creating position ${positionData.name}:`,
          error.message
        );
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${createdCount} positions`);
    console.log(`   ⏭️  Skipped: ${skippedCount} positions (already existed)`);

    // Show current positions
    const allPositions = await prisma.position.findMany({
      orderBy: [{ department: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            tests: true,
          },
        },
      },
    });

    console.log('\n📋 Current Positions:');
    console.log('   Department | Position | Code | Tests');
    console.log('   ' + '─'.repeat(50));

    allPositions.forEach((position) => {
      const dept = (position.department || 'N/A').padEnd(12);
      const name = position.name.padEnd(20);
      const code = position.code.padEnd(12);
      const testCount = position._count.tests.toString();
      console.log(`   ${dept} | ${name} | ${code} | ${testCount}`);
    });

    console.log('\n🎯 Next Steps:');
    console.log('   1. Visit /admin/positions to manage positions');
    console.log('   2. Assign existing tests to positions');
    console.log('   3. Create new tests with position assignments');
    console.log('   4. Use the enhanced leaderboard with position filtering');

    console.log('\n✅ Default positions setup completed successfully!');
  } catch (error) {
    console.error('❌ Error setting up positions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
