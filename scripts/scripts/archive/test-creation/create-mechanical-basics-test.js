#!/usr/bin/env node

/**
 * Script to create the Mechanical Basics Test
 * This script creates a comprehensive mechanical engineering test covering UGV, robotics, and mechanical design
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating Mechanical Basics Test...\n');

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
        title: 'Mechanical Basics Test',
        description:
          'A comprehensive mechanical engineering assessment covering UGV design, robotics, materials, manufacturing, and mechanical systems.',

        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all mechanical engineering questions from the provided CSV
    const questions = [
      // UGV Questions (5 questions)
      {
        promptText:
          "Your team's UGV, with a differential drive, consistently drifts to the left on a flat surface, even with identical motors and wheels. What is the MOST likely initial step to troubleshoot this issue?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Increase the motor power on the right side through the controller.',
          'Check for and correct any misalignment in the wheel axles, ensuring they are perfectly parallel.',
          'Replace the left wheel with one of a slightly larger diameter.',
          'Add a gyroscope to the control system for closed-loop feedback.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'UGV',
      },
      {
        promptText:
          'When designing the chassis for a UGV intended for an obstacle course with uneven terrain, what is a primary advantage of using a rocker-bogie suspension system?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is the lightest suspension system available.',
          'It allows the UGV to maintain contact with the ground with all wheels, maximizing traction.',
          'It provides the fastest possible speed on flat surfaces.',
          'It simplifies the steering mechanism.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'UGV',
      },
      {
        promptText:
          'For a UGV chassis primarily constructed from aluminum extrusion (like 80/20 or T-slot), what is the most common and practical method for joining the frame members in a typical robotics club setting?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Welding.',
          'Brazing.',
          'Using specialized connectors and fasteners like T-nuts and gussets.',
          'Adhesive bonding.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'UGV',
      },
      {
        promptText:
          'Your UGV is required to navigate an outdoor environment with loose soil and grass. Which type of wheel would provide the best traction?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Slick rubber wheels.',
          'Hard plastic wheels.',
          'Wheels with deep, aggressive treads.',
          'Mecanum wheels.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'UGV',
      },
      {
        promptText:
          'In selecting a material for the main chassis of a UGV that must be both lightweight and withstand frequent minor collisions, which of the following offers the best balance of properties for a student team on a budget?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Carbon Fiber.',
          'Titanium.',
          '6061 Aluminum.',
          'Mild Steel.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'UGV',
      },
      // Tracked Robot Questions (5 questions)
      {
        promptText:
          'A common issue with student-built tracked robots is "throwing a track" (the track slipping off the wheels). Which of the following is the most effective design feature to mitigate this?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Making the tracks as loose as possible to reduce friction.',
          'Using completely flat wheels (idlers and sprockets).',
          'Incorporating a tensioning mechanism for the tracks.',
          "Increasing the robot's weight.",
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Tracked Robot',
      },
      {
        promptText:
          'When designing the "belly pan" (bottom plate) for a tracked robot that will traverse rocky terrain, why is it often countersunk or made with flush-mounted screws?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To reduce the overall weight of the robot.',
          "To improve the robot's aesthetic appearance.",
          'To prevent screw heads from getting caught on obstacles and potentially ripped out.',
          'To make the screws easier to access for maintenance.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Tracked Robot',
      },
      {
        promptText:
          'For a tracked robot that needs to make sharp, on-the-spot turns (zero-radius turns), what is the primary drive mechanism required?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Driving both tracks in the same direction at different speeds.',
          'Driving one track forward and the other in reverse.',
          'Using a separate steering motor to pivot the front of the robot.',
          'Temporarily lifting one track off the ground.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Tracked Robot',
      },
      {
        promptText:
          'In a tracked robot\'s drivetrain, what is the primary purpose of the "sprocket" wheel?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To keep the track aligned.',
          'To provide tension to the track.',
          "To engage with the track's teeth or grooves and transmit power from the motor.",
          'To act as a shock absorber.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Tracked Robot',
      },
      {
        promptText:
          'You are building a tracked robot and have a choice of track materials. For a general-purpose robot operating on a variety of indoor and outdoor surfaces, which material offers a good balance of durability, grip, and cost-effectiveness?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '3D printed PLA.',
          'Steel chain links.',
          'Rubber or a similar elastomer.',
          'Laser-cut acrylic links.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Tracked Robot',
      },
      // Strength of Material Questions (5 questions)
      {
        promptText:
          "A long, thin rod is used as a linkage in your robot's arm. It fails by bending sideways under a compressive load. This type of failure is known as:",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Tensile failure.',
          'Torsional shear.',
          'Buckling.',
          'Fatigue.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Strength of Material',
      },
      {
        promptText:
          'To increase the bending stiffness of a rectangular aluminum tube used for a robot arm, while keeping the weight increase to a minimum, what is the most effective change to its cross-section?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Increase the wall thickness.',
          'Increase the overall height of the tube.',
          'Decrease the overall width of the tube.',
          'Use a solid square bar of the same material.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Strength of Material',
      },
      {
        promptText:
          'You notice that a mounting bracket for a high-vibration component (like a motor) has cracked. The crack initiated at a sharp internal corner. This is a classic example of:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Stress concentration.',
          'Material degradation from heat.',
          'Corrosion.',
          'Yielding.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Strength of Material',
      },
      {
        promptText:
          'What does the "Factor of Safety" (FoS) in a mechanical design refer to?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "The ratio of the material's yield strength to the expected working stress.",
          'The percentage of the design that is over-engineered.',
          'A measure of how much the robot can be overloaded before any deformation occurs.',
          'The number of redundant components in a system.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Strength of Material',
      },
      {
        promptText:
          'When a bolt is tightened to clamp two plates together, what type of stress is induced in the body of the bolt?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Bending stress.',
          'Compressive stress.',
          'Torsional stress.',
          'Tensile stress.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Strength of Material',
      },
      // Engineering Mechanics Questions (5 questions)
      {
        promptText:
          'Why is the center of gravity (CG) a critical parameter in a mobile robot, especially one that has to climb inclines?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "A lower CG increases the robot's top speed.",
          'A lower CG increases the angle of incline the robot can climb without tipping over backwards.',
          'A higher CG improves traction.',
          'The CG position only matters for stationary robots.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Engineering Mechanics',
      },
      {
        promptText:
          'When a robot arm is holding a weight stationary, the sum of moments about any point on the arm is:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Equal to the weight of the object.',
          'Maximized.',
          'Zero.',
          "Dependent on the motor's power.",
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Engineering Mechanics',
      },
      {
        promptText:
          'In a differential drive robot, if the left wheel turns faster than the right wheel, the robot will:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Turn right.', 'Turn left.', 'Move straight.', 'Stop.'],
        correctAnswerIndex: 0,
        sectionTag: 'Engineering Mechanics',
      },
      {
        promptText:
          "What is the primary purpose of a 'moment of inertia' calculation when designing a robotic arm?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "To determine the arm's overall weight.",
          "To calculate the arm's resistance to bending.",
          'To determine the torque required to accelerate and decelerate the arm.',
          "To find the arm's center of gravity.",
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Engineering Mechanics',
      },
      {
        promptText:
          "Your robot's wheel slips on a smooth surface. From an Engineering Mechanics perspective, what is the immediate problem?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The coefficient of static friction is too high.',
          'The normal force is greater than the frictional force.',
          'The required tractive force exceeds the maximum static frictional force.',
          'The motor is not providing enough speed.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Engineering Mechanics',
      },
      // Design of Machine Elements Questions (5 questions)
      {
        promptText:
          'When selecting a bearing for a high-speed, low-load application like a flywheel, which type is generally most suitable?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Plain journal bearing.',
          'Deep groove ball bearing.',
          'Tapered roller bearing.',
          'Thrust bearing.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design of Machine Elements',
      },
      {
        promptText:
          'What is the primary reason for using a "key" in a shaft and hub assembly (e.g., for a sprocket)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To hold the sprocket onto the shaft axially.',
          'To transmit torque from the shaft to the sprocket.',
          'To make the assembly easier to take apart.',
          'To balance the shaft.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design of Machine Elements',
      },
      {
        promptText:
          'In a bolted joint, what is the purpose of preloading the bolts (tightening them to a specific torque)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To make the bolts harder to remove.',
          "To increase the joint's resistance to fatigue failure and prevent loosening under vibration.",
          'To reduce the total weight of the assembly.',
          'To make the parts permanently joined.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design of Machine Elements',
      },
      {
        promptText:
          'Why are circlips or retaining rings used on shafts in robotics?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To transmit torque.',
          'To act as a spacer.',
          'To provide axial location for components like bearings or gears.',
          'To strengthen the shaft.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Design of Machine Elements',
      },
      {
        promptText:
          'You are designing a shaft that will be subjected to both bending and torsion. Where will the maximum stress most likely occur?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'In the geometric center of the shaft.',
          'At the outer surface of the shaft.',
          'At the location of the keyway.',
          'Uniformly throughout the shaft.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design of Machine Elements',
      },
      // Design for Manufacturing Questions (5 questions)
      {
        promptText:
          'Your team designed a complex part to be 3D printed. To improve its strength along the primary load axis without increasing material usage, what is a key consideration during the slicing process?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Using a brighter filament color.',
          'Increasing the print speed.',
          "Optimizing the part's orientation on the print bed to align layers with the load path.",
          'Decreasing the nozzle temperature.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Design for Manufacturing',
      },
      {
        promptText:
          'When designing a part to be made on a 3-axis CNC mill, why should you avoid deep, narrow pockets with sharp internal corners?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "It's impossible for a cutting tool to make sharp internal corners.",
          'It increases the material cost.',
          'It makes the part weaker.',
          'It significantly increases machining time and requires specialized, long, thin tools that are prone to breaking.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Design for Manufacturing',
      },
      {
        promptText:
          'You have designed a sheet metal part that requires two 90-degree bends that are very close to each other. What is a likely problem during manufacturing?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The part will be too heavy.',
          "The material might crack or deform because there isn't enough material between bends for the press brake tooling.",
          'The bends will not be accurate.',
          'The sheet metal will become magnetized.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design for Manufacturing',
      },
      {
        promptText:
          'What does the term "tapped hole" mean on a mechanical drawing?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A hole that is drilled with a special type of drill bit.',
          'A hole that has internal threads cut into it for a screw.',
          'A hole that goes all the way through the part.',
          'A hole that has been hardened.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design for Manufacturing',
      },
      {
        promptText:
          'When designing a part for laser cutting, why is it good practice to add small "tabs" or "breakouts" to small pieces within a larger sheet?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To make the final part stronger.',
          'To save material.',
          "To prevent the small, fully-cut pieces from falling through the machine's grid and getting lost or jamming the machine.",
          'To make the laser cutting process faster.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Design for Manufacturing',
      },
      // Weight Optimisation Questions (5 questions)
      {
        promptText:
          'In a robot chassis, you replace a solid square aluminum bar with a hollow square tube of the same outer dimensions. What is the primary mechanical benefit?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A significant reduction in weight with only a minor reduction in bending stiffness.',
          'It is cheaper to manufacture.',
          'It is easier to mount components to.',
          'It has a higher tensile strength.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Weight Optimisation',
      },
      {
        promptText:
          'What is "pocketing" or "skeletalizing" in the context of robot design?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Adding pockets to the robot to carry tools.',
          'A software technique for optimizing code.',
          'Strategically removing material from low-stress areas of a part to reduce weight without significantly compromising strength.',
          'Using a specific type of aluminum alloy.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Weight Optimisation',
      },
      {
        promptText:
          'To optimize a design for weight, which material property is most important when comparing different materials for a strength-critical application?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Ultimate Tensile Strength.',
          'Hardness.',
          'Strength-to-weight ratio (Specific Strength).',
          'Melting Point.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Weight Optimisation',
      },
      {
        promptText:
          'You are using bolts to join two parts. Which of the following is the LEAST effective way to save weight?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Using smaller diameter bolts where analysis permits.',
          'Using aluminum or titanium bolts instead of steel.',
          'Using the minimum number of bolts required for a safe joint.',
          'Drilling holes through the center of the bolts.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Weight Optimisation',
      },
      {
        promptText:
          'Which geometric feature is often added to large, flat plates on a robot to increase stiffness without adding weight?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Polishing the surface.',
          'Adding lightening holes.',
          'Bending flanges along the edges.',
          'Painting the plate black.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Weight Optimisation',
      },
      // Motor Selection Questions (5 questions)
      {
        promptText:
          'Your robot arm needs to lift a 2 kg weight quickly. You are choosing between two motors with the same power rating. Motor A has high speed and low torque. Motor B has low speed and high torque. Which motor is a better choice?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Motor A, because speed is important.',
          'Motor A, but with a large gearbox to increase torque.',
          'Motor B, as it can directly provide the necessary lifting force.',
          'Either motor will perform identically because they have the same power.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Motor Selection',
      },
      {
        promptText: 'What does the "stall torque" of a DC motor signify?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The torque the motor produces at its maximum speed.',
          'The torque produced by the motor when the output shaft is stationary (not rotating).',
          'The ideal operating torque of the motor.',
          'The torque required to damage the motor.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Motor Selection',
      },
      {
        promptText:
          'When selecting a motor for a drivetrain, why is the "no-load speed" a potentially misleading parameter?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The robot will never operate without a load.',
          'It does not account for the torque needed to move the robot, so the actual speed will be significantly lower.',
          'It is often inaccurately reported by manufacturers.',
          'It is measured in radians per second instead of RPM.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Motor Selection',
      },
      {
        promptText:
          'You need a motor that can hold its position accurately even with power applied. Which type of motor is best suited for this task?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A standard brushed DC motor.',
          'A brushless DC motor.',
          'A stepper motor.',
          'An AC induction motor.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Motor Selection',
      },
      {
        promptText:
          'What is a major advantage of using a brushless DC (BLDC) motor over a standard brushed DC motor in a high-performance robot?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'They are significantly cheaper.',
          'They have a higher power-to-weight ratio and longer lifespan.',
          'They are simpler to control.',
          'They can run directly from an AC power source.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Motor Selection',
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

    console.log(`\n🎉 Successfully created Mechanical Basics Test!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(`   📊 Questions: ${questions.length}`);
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
    console.log(`\n📋 Categories covered:`);
    console.log('   • UGV (5 questions)');
    console.log('   • Tracked Robot (5 questions)');
    console.log('   • Strength of Material (5 questions)');
    console.log('   • Engineering Mechanics (5 questions)');
    console.log('   • Design of Machine Elements (5 questions)');
    console.log('   • Design for Manufacturing (5 questions)');
    console.log('   • Weight Optimisation (5 questions)');
    console.log('   • Motor Selection (5 questions)');
  } catch (error) {
    console.error('❌ Error creating Mechanical Basics test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
