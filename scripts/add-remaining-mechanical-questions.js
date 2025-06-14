#!/usr/bin/env node

/**
 * Script to add remaining questions to the Mechanical Basics Test
 * This adds the remaining categories from the CSV data
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Adding remaining questions to Mechanical Basics Test...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Find the existing Mechanical Basics Test
    const test = await prisma.test.findFirst({
      where: { title: 'Mechanical Basics Test' },
    });

    if (!test) {
      console.error('❌ Mechanical Basics Test not found!');
      process.exit(1);
    }

    console.log(`✅ Found existing test: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define remaining mechanical engineering questions from the CSV
    const remainingQuestions = [
      // Pneumatic & Hydraulic System Questions (5 questions)
      {
        promptText:
          'In a typical student robotics pneumatic system, what is the purpose of the regulator?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To store the compressed air.',
          'To turn the compressor on and off.',
          'To step down the high pressure from the storage tank to a lower, constant working pressure.',
          'To open and close the flow of air to the actuators.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pneumatic & Hydraulic System',
      },
      {
        promptText: 'What is a "single-acting" pneumatic cylinder?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A cylinder that can only push, but not pull.',
          'A cylinder that uses air pressure to extend and a spring to retract.',
          'A cylinder that has only one port for air.',
          'All of the above.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Pneumatic & Hydraulic System',
      },
      {
        promptText:
          'Why would you choose a hydraulic system over a pneumatic system for a robot?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'When you need very high speed with low force.',
          'When the application requires extremely high force and power density.',
          'When cleanliness is the top priority.',
          'When the system needs to be very lightweight.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Pneumatic & Hydraulic System',
      },
      {
        promptText:
          'In a pneumatic circuit diagram, what does a solenoid valve do?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It compresses the air.',
          'It filters the air.',
          'It uses an electrical signal to direct the flow of air, controlling the pneumatic actuators.',
          'It lubricates the moving parts.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pneumatic & Hydraulic System',
      },
      {
        promptText:
          "Your robot's pneumatic grabber is too aggressive and is crushing the object it's meant to pick up. What is the simplest way to adjust this?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Use a larger storage tank.',
          'Replace the cylinder with a larger one.',
          "Install a flow control valve to slow down the cylinder's actuation speed.",
          "Increase the system's main pressure at the regulator.",
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pneumatic & Hydraulic System',
      },
      // Gears & Gearbox Design and Manufacturing Questions (5 questions)
      {
        promptText:
          'To get a 3:1 gear reduction (for increased torque) using two spur gears, what would be the configuration?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A 10-tooth gear on the motor driving a 30-tooth gear on the output shaft.',
          'A 30-tooth gear on the motor driving a 10-tooth gear on the output shaft.',
          'Two 20-tooth gears.',
          'A 10-tooth gear driving another 10-tooth gear.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Gears & Gearbox Design and Manufacturing',
      },
      {
        promptText: 'What is "backlash" in a gearbox?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The noise the gearbox makes.',
          'The amount of clearance or "play" between meshing gear teeth.',
          'The gear lubricant.',
          'A type of gear failure.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Gears & Gearbox Design and Manufacturing',
      },
      {
        promptText:
          'Why might a planetary gearbox be chosen over a simple spur gear gearbox for a robotics application?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'They are always easier to manufacture.',
          'They are less expensive.',
          'They offer a high gear reduction in a compact, coaxial package.',
          'They cannot handle high torque.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Gears & Gearbox Design and Manufacturing',
      },
      {
        promptText:
          'In many robotics club gearboxes, the gears are waterjet or laser cut from plate aluminum. What is a common point of failure for these types of gears compared to commercially made steel gears?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The teeth can shear off or deform under high load because aluminum is softer than steel.',
          'They are too heavy.',
          'They are too noisy.',
          'They cannot be lubricated.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Gears & Gearbox Design and Manufacturing',
      },
      {
        promptText:
          'What is the purpose of an "idler" gear placed between a driver and a driven gear?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To increase the gear ratio.',
          'To decrease the gear ratio.',
          'To change the direction of rotation of the output gear without changing the gear ratio.',
          'To add weight to the gearbox.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Gears & Gearbox Design and Manufacturing',
      },
      // Spring & Spring Design calculations Questions (5 questions)
      {
        promptText:
          'You have a compression spring that is used to support a 5kg mass. If you replace the spring with one that has a higher spring constant (k), what will happen?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The spring will compress more under the same 5kg mass.',
          'The spring will compress less under the same 5kg mass.',
          'The amount of compression will not change.',
          'The spring will break.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Spring & Spring Design calculations',
      },
      {
        promptText:
          'What is a key advantage of using a gas spring (gas strut) over a mechanical coil spring for holding a heavy robot arm up against gravity?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'They are much lighter.',
          'They provide a more constant force throughout their range of motion.',
          'They are cheaper.',
          'They work better in a vacuum.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Spring & Spring Design calculations',
      },
      {
        promptText: '"Preloading" a spring in a suspension system means:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Compressing the spring slightly even when there is no external load.',
          'Stretching the spring before installation.',
          'Lubricating the spring.',
          'Using a weaker spring.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Spring & Spring Design calculations',
      },
      {
        promptText:
          'What is the primary failure mode for a spring that is repeatedly cycled (compressed and released)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['Buckling.', 'Yielding.', 'Fatigue.', 'Corrosion.'],
        correctAnswerIndex: 2,
        sectionTag: 'Spring & Spring Design calculations',
      },
      {
        promptText:
          'A torsion spring is used in which of the following common robot applications?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A simple shock absorber for a wheel.',
          'Counterbalancing a rotating joint on an arm.',
          'A battery connector.',
          'A linear slide.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Spring & Spring Design calculations',
      },
      // Critical thinking for robotic solutions Questions (5 questions)
      {
        promptText:
          "Your team's robot is designed to pick up balls and shoot them into a goal. It is performing well, but is slightly too slow, just missing the cutoff for the number of balls scored in a match. Which of the following is the most efficient area to focus on for improvement?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A complete redesign of the chassis to be 5% lighter.',
          'Optimizing the "cycle time" by parallelizing actions, e.g., aiming the shooter while the intake is still collecting the last ball.',
          'Rewriting the entire codebase in a more efficient programming language.',
          'Painting the robot a different color to improve morale.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Critical thinking for robotic solutions',
      },
      {
        promptText:
          'The competition rules state that your robot must start within an 18"x18"x18" cube, but can expand after the match starts. Your team wants a very tall shooter. What common design solution addresses this constraint?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Building the robot smaller than 18" tall.',
          'Asking the judges for an exception.',
          'Designing a multi-stage lift or a linkage that unfolds or telescopes the shooter up to its full height.',
          'Using smaller wheels.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Critical thinking for robotic solutions',
      },
      {
        promptText:
          "Your robot's autonomous routine occasionally fails because its color sensor gets an incorrect reading from ambient light changes in the venue. What is a robust engineering solution?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Ask the event organizers to turn off the lights.',
          'Average the sensor readings over a longer period of time.',
          'Add a shroud or shield around the sensor to block out ambient light and use an integrated LED for consistent illumination.',
          "Increase the brightness of the robot's main computer screen.",
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Critical thinking for robotic solutions',
      },
      {
        promptText:
          'Your team is divided on a design choice. One group wants to use a simple, reliable but slow mechanism. The other group wants to use a complex, faster mechanism that might be less reliable. As the lead designer, what is the best first step?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Choose the simple design because reliability is always most important.',
          'Choose the complex design because speed is most important.',
          'Create a decision matrix to objectively score each design against key criteria like speed, reliability, cost, and ease of manufacturing.',
          'Have the two groups vote.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Critical thinking for robotic solutions',
      },
      {
        promptText:
          'The robot is slightly overweight. A team member suggests switching from standard steel bolts to more expensive titanium bolts to save 50 grams. The robot is 500 grams overweight. What is the most critical evaluation of this suggestion?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "It's a great idea because titanium is a high-tech material.",
          "It's a bad idea because titanium is hard to find.",
          "The proposed change provides only 10% of the required weight savings, so while helpful, it's not a complete solution and more significant changes are needed.",
          'The weight savings are not worth the cost.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Critical thinking for robotic solutions',
      },
      // Heat transfer for electronics component Questions (5 questions)
      {
        promptText:
          "The main processor on your robot's control board is getting very hot during operation. What is the most common and simple solution to implement?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Run the processor at a lower clock speed.',
          'Attach a heat sink to the processor.',
          'Relocate the robot to a colder room.',
          'Increase the size of the power wires.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Heat transfer for electronics component',
      },
      {
        promptText:
          "What is the primary purpose of a cooling fan in a robot's electronics bay?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To blow dust off the components.',
          'To create forced convection, increasing the rate of heat transfer away from components.',
          'To generate white noise to mask motor sounds.',
          'To add weight to the robot for stability.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Heat transfer for electronics component',
      },
      {
        promptText:
          'Why are heat sinks often made of aluminum and have many fins?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Aluminum is a good electrical insulator and the fins are for aesthetics.',
          'Aluminum has a high thermal conductivity and the fins maximize the surface area for heat dissipation.',
          'Aluminum is heavy, which helps dampen vibrations.',
          'Aluminum is cheap and the fins make it look more complex.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Heat transfer for electronics component',
      },
      {
        promptText:
          'What is a thermal pad, often found between a processor and a heat sink?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A small heater to keep the processor warm in cold environments.',
          'A soft, thermally conductive material used to fill microscopic air gaps between the component and the heat sink.',
          'An insulating layer to protect the processor from the heat sink.',
          'A type of double-sided tape.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Heat transfer for electronics component',
      },
      {
        promptText:
          "If you enclose all your robot's electronics (motor controllers, main board, etc.) in a sealed plastic box to protect them from dust, what is a likely negative consequence?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The components will be better protected from impacts.',
          'The box will trap heat, potentially causing the components to overheat.',
          'The plastic will interfere with the WiFi signal.',
          'The overall weight of the robot will be reduced.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Heat transfer for electronics component',
      },
      // Lifting Mechanisms Questions (5 questions)
      {
        promptText:
          'For a simple scissor lift mechanism on a robot, what is the primary advantage of using a lead screw for actuation compared to a direct pneumatic or hydraulic cylinder pushing on the bottom linkage?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is significantly faster.',
          'It is self-locking, meaning it will hold its position even when power is cut.',
          'It provides a constant lifting force throughout the entire range of motion.',
          'It is lighter.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Lifting Mechanisms',
      },
      {
        promptText:
          'Your team is designing a forklift-style a mechanism for your robot. To lift a heavy load with a small motor, which of the following is the most practical approach?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Use a very high-speed motor directly connected to the lift carriage.',
          'Employ a multi-stage gearbox to increase torque.',
          'Use a lightweight rope made of nylon.',
          'Increase the voltage supplied to the motor.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Lifting Mechanisms',
      },
      {
        promptText:
          'In a multi-stage cascading elevator lift (common in robotics competitions), how are the subsequent stages typically lifted?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Each stage has its own independent motor and spool.',
          'A single rope or cable is routed in a continuous loop, causing the stages to extend sequentially.',
          'Pneumatic cylinders push each stage up one by one.',
          'A rack and pinion system runs the entire height of the lift.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Lifting Mechanisms',
      },
      {
        promptText:
          'You are designing a simple pivoting arm to lift an object. To minimize the torque required from the motor at the pivot point, where should the object be held?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'As far from the pivot as possible to increase leverage.',
          'As close to the pivot as possible.',
          "At the halfway point of the arm's length.",
          'The position does not affect the required torque.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Lifting Mechanisms',
      },
      {
        promptText:
          'What is a key disadvantage of using a simple single-joint arm for lifting an object to a specific height and orientation?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It cannot lift heavy objects.',
          'The orientation of the object changes as the arm rotates.',
          'It is very complex to build.',
          'It requires a very large motor.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Lifting Mechanisms',
      },
      // Electronics Mounting in Robotics Questions (5 questions)
      {
        promptText:
          'When mounting a motor controller (like a Victor SPX or Talon SRX) to a robot chassis, why is it a bad practice to use steel screws that are too long, especially on a conductive frame?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The excess length adds unnecessary weight.',
          'Long steel screws are more likely to vibrate loose.',
          'The screw could pass through the board and short-circuit components against the metal chassis.',
          'It makes the controller more difficult to remove.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Electronics Mounting in Robotics',
      },
      {
        promptText:
          'What is the primary purpose of using "standoffs" when mounting a PCB (like a RoboRIO, Raspberry Pi, or Arduino) to a baseplate?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To provide a strong, rigid connection.',
          'To create a gap for air circulation and to prevent electrical shorts on the underside of the board.',
          'To make the electronics look more organized.',
          'To absorb vibrations.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Electronics Mounting in Robotics',
      },
      {
        promptText:
          'To protect sensitive sensor wires (e.g., from an encoder) that are run alongside high-current motor wires, what is a common and effective practice?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Tightly zip-tie the sensor and motor wires together for a neat appearance.',
          'Use shielded cabling for the sensor wires or physically separate the two bundles.',
          'Use the same color wiring for both to simplify inventory.',
          'Make the sensor wires as short as possible, even if it means stretching them tightly.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Electronics Mounting in Robotics',
      },
      {
        promptText:
          'You need to mount a heavy battery in your UGV. From a vehicle dynamics and stability perspective, where is the ideal placement?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'As high as possible to increase the ground clearance.',
          'As far to the front as possible to improve steering.',
          'As low and as central as possible.',
          'On one side to make it easily accessible for charging.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Electronics Mounting in Robotics',
      },
      {
        promptText:
          'What is a key advantage of using modular connectors (like Anderson Powerpole or XT60) for all major electronic components instead of directly soldering or using terminal blocks?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'They provide a more electrically efficient connection.',
          'They are the cheapest option available.',
          'They allow for rapid replacement of components (like a motor, controller, or battery) during testing or a competition.',
          'They are completely waterproof.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Electronics Mounting in Robotics',
      },
    ];

    // Create all remaining questions
    console.log('📝 Creating remaining questions...\n');

    for (let i = 0; i < remainingQuestions.length; i++) {
      const questionData = remainingQuestions[i];

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

    console.log(
      `\n🎉 Successfully added ${remainingQuestions.length} more questions to Mechanical Basics Test!`
    );
    console.log(`   📊 Additional questions: ${remainingQuestions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(`\n📋 Additional categories added:`);
    console.log('   • Pneumatic & Hydraulic System (5 questions)');
    console.log('   • Gears & Gearbox Design and Manufacturing (5 questions)');
    console.log('   • Spring & Spring Design calculations (5 questions)');
    console.log('   • Critical thinking for robotic solutions (5 questions)');
    console.log('   • Heat transfer for electronics component (5 questions)');
    console.log('   • Lifting Mechanisms (5 questions)');
    console.log('   • Electronics Mounting in Robotics (5 questions)');
    console.log(
      `\n💡 The test now has comprehensive coverage of mechanical engineering topics!`
    );
    console.log(`   🎯 Total categories: 15`);
    console.log(`   📝 Total questions: ~75`);
  } catch (error) {
    console.error('❌ Error adding remaining questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
