#!/usr/bin/env node

/**
 * Script to create the Mechanical Assessment 1 Test
 * This script creates a comprehensive mechanical engineering assessment for advanced robotics and engineering concepts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Mechanical Assessment 1 Test...\n');

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
          passwordHash: 'admin', // In real app, this would be hashed
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
        title: 'Mechanical Assessment 1',
        description:
          'Advanced mechanical engineering assessment covering robotics, control systems, materials science, manufacturing, and mechanical design principles.',
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define the first 10 mechanical assessment questions
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
        correctAnswerIndex: 1, // B
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
        correctAnswerIndex: 1, // B
        sectionTag: 'Fatigue Analysis & Material Science',
      },
      {
        promptText:
          'During FEA analysis of a critical aluminum mounting bracket, you see a very high, localized stress peak at a single node on a sharp internal corner. What is the most appropriate initial reaction?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The part is critically flawed and must be completely redesigned with a much larger cross-section.',
          'This is likely a stress singularity, an artifact of the mesh at a perfectly sharp corner. The model should be updated with a realistic fillet radius before re-evaluating.',
          'The material must be changed from aluminum to titanium to handle the stress.',
          "The simulation's force is too high and should be reduced until the stress is within an acceptable range.",
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Finite Element Analysis',
      },
      {
        promptText:
          'A mobile robot with a high center of gravity needs to make a high-speed turn on a high-traction surface. Which type of failure is most likely to occur first?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The inside wheels will lose traction and the robot will drift (skid).',
          'The motor controllers will overheat due to the high current draw.',
          'The robot will tip over towards the outside of the turn.',
          'The tires will tear away from the wheel hubs.',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Vehicle Dynamics',
      },
      {
        promptText:
          'Why is an I-beam cross-section exceptionally efficient for resisting bending in one primary direction, but a poor choice for a member that experiences frequent torsional (twisting) loads?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'I-beams are difficult to manufacture, making them unsuitable for torsion.',
          'The open cross-section of an I-beam has a very low torsional constant, making it twist easily, whereas a closed section like a box tube is much stiffer in torsion.',
          'The flanges of the I-beam are too thin and will buckle under torsional stress.',
          'The web of the I-beam is prone to shear failure from torsion.',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Structural Design & Beam Theory',
      },
      {
        promptText:
          'Your team needs to 3D print a custom gear for a high-torque, moderate-speed planetary gearbox. Which combination of material and print setting is best for producing a durable, functional gear?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'PLA plastic with 20% infill and a large layer height for speed.',
          'PETG plastic with 100% infill and a small layer height, oriented to minimize layer lines on the tooth profile.',
          'ABS plastic vapor-smoothed with acetone to increase inter-layer adhesion.',
          'Nylon or a similar engineering polymer (e.g., Polycarbonate) with high infill, printed at a high temperature to maximize layer bonding.',
        ],
        correctAnswerIndex: 3, // D
        sectionTag: 'Additive Manufacturing',
      },
      {
        promptText:
          'You are designing a small, complex robotic linkage that needs to be stiff, lightweight, and is too geometrically complex for traditional CNC machining. What is the most appropriate advanced manufacturing process for a low-volume production run?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Investment casting.',
          'Metal injection molding (MIM).',
          'Direct Metal Laser Sintering (DMLS) or Selective Laser Melting (SLM).',
          'Multi-axis CNC milling with custom fixtures.',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Advanced Manufacturing',
      },
      {
        promptText:
          'When designing an aluminum part for a 5-axis CNC mill to minimize cost, what is the single most important design consideration?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Ensuring all surfaces are perfectly parallel or perpendicular.',
          'Minimizing the number of unique machine setups required by designing for accessibility from as few directions as possible.',
          'Using the softest possible aluminum alloy to increase cutting speed.',
          'Making all internal corners perfectly sharp.',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Design for Manufacturing (DFM)',
      },
      {
        promptText:
          'For a robotic component operating in a high-vibration environment, why is 7075-T6 aluminum a potentially worse choice than 6061-T6, despite being significantly stronger?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '7075-T6 is much heavier than 6061-T6.',
          '7075-T6 has lower corrosion resistance.',
          '7075-T6 is less ductile and more notch-sensitive, giving it poorer fatigue performance and making it more prone to crack propagation from stress risers.',
          '7075-T6 is impossible to weld.',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Material Selection & Properties',
      },
      {
        promptText:
          'You are designing a part with a press-fit assembly (e.g., a bearing into a housing). What is the primary purpose of specifying surface finish requirements for the mating surfaces?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To ensure the parts have an aesthetically pleasing appearance.',
          'A smoother surface finish provides more consistent and predictable friction and holding force for the press fit.',
          'To reduce the overall weight of the part.',
          'To make the parts easier to slide together by hand.',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Precision Mechanical Design',
      },
    ];

    // Create all questions
    console.log('📝 Creating questions...\n');

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

    console.log(`\n🎉 Successfully created Mechanical Assessment 1!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(`   ⏱️  Time per question: 90 seconds`);
    console.log(
      `   🕒 Total test time: ${(questions.length * 90) / 60} minutes`
    );

    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
    console.log(`\n📋 Categories covered (First 10 Questions):`);
    console.log('   • Control Systems & Vibration Analysis');
    console.log('   • Fatigue Analysis & Material Science');
    console.log('   • Finite Element Analysis (FEA)');
    console.log('   • Vehicle Dynamics');
    console.log('   • Structural Design & Beam Theory');
    console.log('   • Additive Manufacturing (3D Printing)');
    console.log('   • Advanced Manufacturing Processes');
    console.log('   • Design for Manufacturing (DFM)');
    console.log('   • Material Selection & Properties');
    console.log('   • Precision Mechanical Design');
  } catch (error) {
    console.error('❌ Error creating Mechanical Assessment 1:', error);
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
