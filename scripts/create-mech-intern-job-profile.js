#!/usr/bin/env node

/**
 * Script to create a Job Profile for the Mech Intern 50/30 Test
 * This script creates a comprehensive job profile linking the mechanical intern position with the test
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Mech Intern Job Profile...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`✅ Admin user found: ${adminUser.email}\n`);

    // Find the Mechanical Intern position
    const mechanicalInternPosition = await prisma.position.findFirst({
      where: { 
        OR: [
          { code: 'MECH_INTERN' },
          { name: { contains: 'Mechanical Intern' } }
        ]
      },
    });

    if (!mechanicalInternPosition) {
      console.log('❌ Mechanical Intern position not found. Please run setup-default-positions.js first.');
      return;
    }

    console.log(`✅ Found position: ${mechanicalInternPosition.name} (${mechanicalInternPosition.code})\n`);

    // Find the Mech Intern 50/30 Test
    const mechInternTest = await prisma.test.findFirst({
      where: { 
        title: 'Mech Intern 50/30 Test',
        isArchived: false 
      },
      include: {
        questions: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!mechInternTest) {
      console.log('❌ Mech Intern 50/30 Test not found. Please run create-mech-intern-50-30-test.js first.');
      return;
    }

    console.log(`✅ Found test: ${mechInternTest.title} (${mechInternTest.questions.length} questions)\n`);

    // Check if job profile already exists
    const existingProfile = await prisma.jobProfile.findFirst({
      where: { 
        name: 'Mechanical Intern Assessment' 
      },
    });

    if (existingProfile) {
      console.log('⚠️  Job profile "Mechanical Intern Assessment" already exists. Skipping creation.\n');
      console.log(`   Profile ID: ${existingProfile.id}`);
      console.log(`   Profile Status: ${existingProfile.isActive ? 'Active' : 'Inactive'}`);
      return;
    }

    // Create the job profile
    const jobProfile = await prisma.jobProfile.create({
      data: {
        name: 'Mechanical Intern Assessment',
        description: 'Comprehensive assessment for mechanical engineering intern candidates covering strength of materials, automotive systems, robotics, and manufacturing processes.',
        isActive: true,
        createdById: adminUser.id,
        positions: {
          connect: [{ id: mechanicalInternPosition.id }],
        },
        testWeights: {
          create: [{
            testId: mechInternTest.id,
            weight: 1.0,
          }],
        },
      },
      include: {
        positions: true,
        testWeights: {
          include: {
            test: {
              include: {
                questions: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Update the test to link it to the position for analytics/leaderboard visibility
    await prisma.test.update({
      where: { id: mechInternTest.id },
      data: { positionId: mechanicalInternPosition.id },
    });

    console.log(`✅ Job Profile created: ${jobProfile.name}`);
    console.log(`   Profile ID: ${jobProfile.id}`);
    console.log(`   Position: ${mechanicalInternPosition.name} (${mechanicalInternPosition.code})`);
    console.log(`   Test: ${mechInternTest.title} (${mechInternTest.questions.length} questions)`);
    console.log(`   Status: ${jobProfile.isActive ? 'Active' : 'Inactive'}\n`);

    console.log(`🎉 Successfully created Mechanical Intern Job Profile!`);
    console.log(`\n💡 You can now:`);
    console.log(`   • Send personalized invitations to candidates`);
    console.log(`   • Generate public test links`);
    console.log(`   • Create time-restricted assessment sessions`);
    console.log(`   • View candidate results and analytics`);
    console.log(`\n🔗 Access the job profile at: /admin/job-profiles`);

  } catch (error) {
    console.error('❌ Error creating job profile:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = main;
