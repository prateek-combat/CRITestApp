#!/usr/bin/env node

/**
 * Script to create the Complete Mechanical Assessment 1 Test
 * This script creates a comprehensive mechanical engineering assessment with all questions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Complete Mechanical Assessment 1 Test...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@testplatform.com',
          passwordHash: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Mechanical Assessment 1 - Complete',
        description:
          'Comprehensive mechanical engineering assessment covering advanced robotics, control systems, materials science, manufacturing, and mechanical design principles.',
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // All mechanical assessment questions
    const questions = [
      {
        promptText:
          "A robot arm moving at high speed exhibits significant vibration at its natural frequency upon stopping. The arm's structure is already optimized for stiffness-to-weight. Which is the MOST effective strategy to mitigate this vibration without compromising the stopping position?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Increasing the Derivative (D) gain in the PID loop to dampen the oscillation faster.',
          "Implementing a notch filter in the control loop centered at the arm's natural frequency.",
          'Switching to a more powerful motor to provide a higher holding torque.',
          'Adding a significant counterweight to the base of the arm to lower the overall center of gravity.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Control Systems & Vibration',
      },
      {
        promptText:
          'A critical shaft in your gearbox is subject to fully-reversed bending stress and constant torsional stress. According to the Goodman Line criterion for fatigue failure, what is the primary effect of the constant torsion on the allowable bending stress amplitude?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The constant torsion has no effect, as only the alternating stress matters for fatigue.',
          'The constant torsion creates a mean torsional stress, which reduces the allowable bending stress amplitude.',
          'The constant torsion increases the allowable bending stress amplitude due to work hardening.',
          'The constant torsion only matters if it is also alternating.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Fatigue Analysis',
      },
    ];

    // Create all questions
    console.log(`📝 Creating ${questions.length} questions...\n`);

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

      const question = await prisma.question.create({
        data: {
          promptText: questionData.promptText,
          timerSeconds: questionData.timerSeconds,
          answerOptions: questionData.answerOptions,
          correctAnswerIndex: questionData.correctAnswerIndex,
          category: questionData.category,
          sectionTag: questionData.sectionTag,
          testId: test.id,
        },
      });

      console.log(
        `   ✅ Question ${i + 1} (${questionData.sectionTag}): ${questionData.promptText.substring(0, 50)}...`
      );
    }

    console.log(`\n🎉 Successfully created Complete Mechanical Assessment 1!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(`   ⏱️  Time per question: 90 seconds`);
    console.log(
      `   🕒 Total test time: ${(questions.length * 90) / 60} minutes`
    );

    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
  } catch (error) {
    console.error('❌ Error creating Complete Mechanical Assessment 1:', error);
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
