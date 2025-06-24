#!/usr/bin/env node

/**
 * Script to add ALL remaining mechanical assessment questions to the existing test
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// The test ID from the previous creation
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Adding ALL remaining Mechanical Assessment questions...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Verify the test exists
    const existingTest = await prisma.test.findUnique({
      where: { id: TEST_ID },
      include: { questions: true },
    });

    if (!existingTest) {
      console.error('❌ Test not found with ID:', TEST_ID);
      return;
    }

    console.log(`✅ Found existing test: ${existingTest.title}`);
    console.log(`   Current questions: ${existingTest.questions.length}\n`);

    // ALL remaining mechanical assessment questions (questions 16-50)
    const remainingQuestions = [
      {
        promptText:
          'A high-inertia robotic arm is driven by a brushed DC motor and a gearbox. To achieve the fastest possible stop without excessive mechanical stress, which braking method is most appropriate?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Dynamic braking, by shunting the motor terminals with a low-value power resistor.',
          'Plugging, by reversing the motor voltage polarity to actively drive it to a stop.',
          'Using a mechanical brake integrated into the gearbox.',
          "Relying on the gearbox's inherent inefficiency and friction to stop the arm.",
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Motor Control',
      },
      {
        promptText:
          'You are designing a high-efficiency spur gearbox. What is the primary reason for choosing a larger pressure angle (e.g., 20° or 25° instead of 14.5°)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A larger pressure angle results in a quieter gearbox.',
          'It allows for a higher gear reduction ratio in a single stage.',
          'It results in stronger, wider gear teeth that are less prone to bending failure and can handle higher loads, despite slightly higher bearing loads.',
          'It significantly reduces the axial thrust on the gear shafts.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Gear Design',
      },
      {
        promptText:
          'A lead screw-driven lifting mechanism is experiencing "back-driving" - the load is able to lower itself by spinning the screw when the motor is unpowered. Which single change would most effectively prevent this?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Increasing the diameter of the lead screw while keeping the lead constant.',
          'Switching to a multi-start lead screw to increase speed.',
          'Decreasing the lead angle of the screw thread such that the tangent of the lead angle is less than the coefficient of static friction.',
          'Using a more powerful motor.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Screw Mechanics',
      },
      {
        promptText:
          'When selecting a brushless DC (BLDC) motor for a battery-powered vehicle, what is the critical implication of choosing a motor with a very low Kv (RPM/Volt) rating?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The motor will have a very high no-load speed, requiring a large gear reduction.',
          'The motor will generate a high back-EMF at low speeds, making it inefficient.',
          'The motor is designed to produce high torque at low RPMs for a given voltage, making it suitable for direct drive or low-reduction applications, but will have a low top speed.',
          'The motor requires a higher voltage to operate than a high-Kv motor.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Motor Selection',
      },
      {
        promptText:
          'Why is a harmonic drive (strain wave gear) often chosen over a planetary gearbox for a high-precision robotic joint?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is significantly more efficient than a planetary gearbox.',
          'It offers near-zero backlash, which is critical for positional accuracy and repeatability.',
          'It is much more robust and can handle higher shock loads.',
          'It is lower in cost and easier to manufacture.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Precision Gearing',
      },
      {
        promptText:
          'In a pneumatic system, what is the function of a "pilot-operated" valve, and why is it used?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is a small, manually operated valve used to test the system.',
          'It uses a small amount of pilot air to shift a much larger valve spool, allowing a low-power solenoid to control a very high-flow-rate air supply.',
          'It is a proportional valve that can be partially opened to control cylinder speed.',
          "It is a valve that automatically shuts off when the pilot's console is deactivated.",
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Pneumatics',
      },
      {
        promptText:
          'A spring-loaded mechanism is designed to provide a constant force over a long range of travel. What type of spring should be used?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A standard compression spring.',
          'A Belleville washer stack.',
          'A constant-force spring (a spooled strip of steel).',
          'A torsion spring.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Spring Design',
      },
      {
        promptText:
          'What is the primary advantage of using a cycloidal drive in a high-shock-load robotics application?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It has zero backlash.',
          'It has an extremely high gear reduction ratio in a single stage.',
          'Its load is shared among a large number of rolling elements simultaneously, giving it exceptional shock resistance and durability.',
          'It can be 3D printed easily from common plastics.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Advanced Gearing',
      },
      {
        promptText:
          'When driving a DC motor with a PWM signal from an H-bridge, "shoot-through" is a destructive condition where:',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The motor current exceeds its rated stall current.',
          'The back-EMF from the motor exceeds the bus voltage.',
          'Both the high-side and low-side transistors on the same leg of the H-bridge are momentarily turned on, creating a dead short across the power supply.',
          'The PWM signal contains voltage spikes that damage the motor controller.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Motor Drivers',
      },
      {
        promptText:
          'A gearbox is specified to have 1 degree of backlash. If this gearbox is used to control a robotic arm that is 500mm long, what is the approximate positional error at the tooltip due to this backlash?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: ['~0.1 mm', '~1.0 mm', '~8.7 mm', '~50.0 mm'],
        correctAnswerIndex: 2,
        sectionTag: 'Kinematic Analysis',
      },
      {
        promptText:
          'To design a four-bar linkage that guides an end-effector through three specific, precise positions in space, what is the most appropriate design methodology?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Trial and error using a CAD program.',
          "Using Grashof's criterion to ensure the linkage can rotate fully.",
          'Graphical or analytical synthesis techniques, such as the Freudenstein equation or geometric inversion.',
          'Performing a finite element analysis (FEA) of a generic linkage.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Mechanism Design',
      },
      {
        promptText:
          'You are designing a lightweight structural frame using carbon fiber tubes. To join two tubes at a T-junction to handle high bending loads, what is the most structurally sound method?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Using a standard 3D printed PLA clamp.',
          'Flattening the end of one tube and bolting it to the side of the other.',
          'Using custom-machined aluminum inserts and a bonded/bolted connection.',
          'Using a wrapped joint with carbon fiber tow and epoxy, creating a continuous load path through the fibers.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Composite Structures',
      },
      {
        promptText:
          'What is the principle of "force closure" in a robotic gripper design?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The gripper uses a very high force to hold the object securely.',
          'The gripper has a feature that locks it closed, even if power is lost.',
          'The gripper is designed such that a continuous, directed force (e.g., from springs or actuators) is required to maintain a stable grasp on the object.',
          'The gripper is designed such that the geometry of the fingers and contact points constrains the object, preventing it from slipping, regardless of the gripping force.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Gripper Design',
      },
      {
        promptText:
          'A designer uses "topology optimization" software on a CAD model of a bracket. What is the primary output of this process?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'A detailed report of the stress, strain, and displacement of the original bracket.',
          'An optimized geometric form that shows the ideal load paths, removing all non-essential material, which often results in an organic, bone-like structure.',
          'A recommendation for the best material to use for the bracket.',
          'A simplified version of the bracket that is easier to manufacture.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Design Optimization',
      },
      {
        promptText:
          'What is meant by a "statically determinate" structure, and why is this property not always desirable in a robotic design?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is a structure that is perfectly rigid. It is undesirable because it is too heavy.',
          'It is a structure where all member forces can be solved with static equilibrium equations alone. It can be undesirable because the failure of a single member leads to the collapse of the entire structure (no redundancy).',
          'It is a structure with more members than necessary. It is undesirable because of the extra weight.',
          'It is a structure that is designed to be in motion. It is undesirable for stationary robots.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Structural Analysis',
      },
      {
        promptText:
          'A high-frequency signal from a precision analog sensor is showing significant noise that correlates with the operation of a large DC motor on the robot. What is the most effective solution to ensure signal integrity?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Twisting the sensor wires together and enclosing them in a grounded, shielded cable, keeping it physically separate from the motor power wires.',
          'Adding a large capacitor across the motor terminals to smooth the input voltage.',
          'Increasing the data sampling rate of the analog-to-digital converter (ADC).',
          'Writing a software-based moving average filter to smooth the sensor data.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Signal Integrity',
      },
      {
        promptText:
          "A robot's main computer and motor controllers are enclosed in a sealed aluminum box. The CPU is overheating. What is the most effective way to improve cooling without adding a fan or venting the box to the outside environment?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Painting the outside of the box matte black.',
          "Attaching the CPU's heat sink directly to the inner wall of the aluminum box using a thermal pad.",
          'Filling the box with non-conductive mineral oil.',
          'Placing a Peltier cooler (thermoelectric cooler) on the CPU.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Thermal Management',
      },
      {
        promptText:
          'When selecting a connector for a battery pack that will be frequently connected and disconnected, what does a "hot-swappable" or "anti-spark" feature (like in an AS150 or XT90-S connector) do?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It contains a small fuse that blows if the current is too high.',
          'It uses a pre-charge resistor to slowly equalize the voltage and prevent the large inrush current that causes a damaging spark when connecting to capacitors in a motor controller.',
          'The connector pins are made of a special metal that does not spark.',
          'It has a secondary locking mechanism to prevent accidental disconnection.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Electrical Connectors',
      },
      {
        promptText:
          'What is the primary reason for using differential signaling (e.g., RS-422/485) for long-distance communication with an encoder or sensor on a robot?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It allows for a higher data transmission speed than single-ended signals.',
          'It requires fewer wires than other communication protocols.',
          'Differential signals have high common-mode noise rejection, making the communication extremely robust against electrical noise picked up over the length of the cable.',
          'It allows multiple sensors to talk on the same bus without an addressing scheme.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Communication Protocols',
      },
      {
        promptText:
          'A motor controller for a 24V system is rated for "48V peak". Why can\'t this controller be safely used with a 48V battery?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The 48V peak rating is only for short-duration marketing purposes.',
          'A 48V battery provides a nominal voltage, but the controller needs to handle regenerative braking voltage spikes which can far exceed the nominal battery voltage.',
          "The controller's firmware is locked to only work at 24V.",
          'The current rating would be halved at 48V, making it underpowered.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Power Electronics',
      },
      {
        promptText:
          'An autonomous robot uses a 2D LiDAR for localization. It frequently gets "lost" when moving down a long, uniform hallway. What is this phenomenon called and what is the best way to fix it?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It\'s called \"sensor aliasing\", fixed by using a 3D LiDAR.',
          'It\'s called the \"perceptual aliasing\" or \"corridor problem\", best fixed by fusing the LiDAR data with another sensor modality, like wheel odometry or visual features.',
          'It\'s called \"signal saturation\", fixed by reducing the LiDAR\'s laser power.',
          'It\'s called \"beam divergence\", fixed by using a LiDAR with a narrower beam.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Sensor Fusion',
      },
      {
        promptText:
          'What is the purpose of a "ferrite bead" or "ferrite core" clamped around a bundle of wires on a robot?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It is a magnetic weight used to keep the wires from moving.',
          'It is a passive low-pass filter used to suppress high-frequency electromagnetic interference (EMI) on the cable without affecting the DC power or low-frequency signals.',
          'It is used to increase the inductance of the cable to store more energy.',
          "It is a color-coded marker for identifying the cable's function.",
        ],
        correctAnswerIndex: 1,
        sectionTag: 'EMI Suppression',
      },
      {
        promptText:
          "A stepper motor is losing steps during a high-acceleration move. The driver's current limit is already set to the motor's maximum rating. What is the most likely cause?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The motor does not have enough holding torque.',
          "The torque required to accelerate the load exceeds the motor's available torque at that specific speed.",
          'The bus voltage is too low, limiting the rate at which current can rise in the windings.',
          'The microstepping setting is too high.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Stepper Motors',
      },
      {
        promptText:
          'Why are IGBTs (Insulated Gate Bipolar Transistors) often preferred over MOSFETs in very high-power, high-voltage motor controllers (e.g., >100V, >100A)?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'IGBTs have a significantly lower \"on-state\" voltage drop at high currents, leading to lower conduction losses and better thermal performance.',
          'IGBTs can switch at much higher frequencies than MOSFETs.',
          'IGBTs are much cheaper and more readily available than high-power MOSFETs.',
          'IGBTs do not require a gate driver circuit like MOSFETs do.',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Power Electronics',
      },
      {
        promptText:
          "You are mounting a high-sensitivity Inertial Measurement Unit (IMU) to your robot's chassis. What is the most critical mounting consideration for accurate readings?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "Mounting it as close to the robot's center of gravity as possible.",
          'Ensuring the IMU is rigidly coupled to the frame and providing vibration isolation through soft grommets or damping foam.',
          'Placing it in an area with good airflow for thermal stability.',
          'Using non-magnetic aluminum screws instead of steel screws.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Sensor Mounting',
      },
      {
        promptText:
          "A competition robot's performance is inconsistent. It works perfectly in the workshop but fails intermittently during matches. The mechanical systems are robust and the software has no known bugs. What is the most likely system-level issue to investigate first?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "The robot's aesthetic design is not intimidating enough to other competitors.",
          "The robot's power system (battery, wiring, and connectors) is experiencing voltage drops (brownouts) under the high-current loads of a real match, causing microcontrollers to reset.",
          "The wireless competition environment is causing packet loss to the robot's radio.",
          'The temperature and humidity in the competition venue are different from the workshop.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'System Troubleshooting',
      },
      {
        promptText:
          'Your team is tasked with designing a robot to manipulate a series of heavy objects. The project timeline is extremely short. Which design philosophy is most likely to lead to success?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Spend the majority of the time designing a single, highly-optimized, perfect mechanism.',
          'Immediately build a complex, multi-functional robot that can theoretically perform all tasks.',
          'Adopt an iterative design approach: build a simple, robust \"minimum viable product\" (e.g., a drivetrain that can move) first, then progressively add and test one new mechanism at a time.',
          'Outsource the design to a more experienced professional engineering firm.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Design Philosophy',
      },
      {
        promptText:
          "A robot's vision system is tasked with identifying red balls. It works well under fluorescent lighting but fails under warm incandescent or natural sunlight. What is the most robust solution?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Manually recalibrating the red color threshold for every new lighting condition.',
          'Converting the camera image from RGB color space to HSV (Hue, Saturation, Value) color space and thresholding primarily on the Hue channel.',
          'Increasing the brightness and contrast of the camera image in software.',
          'Using a more expensive camera with higher resolution.',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Computer Vision',
      },
      {
        promptText:
          'A critical design review (CDR) for your robot is approaching. What is the primary purpose of a CDR and what should your team be prepared to present?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'To demonstrate a fully working prototype of the robot to the stakeholders.',
          'To present a detailed budget and timeline for the remainder of the project.',
          'To present a \"design freeze\" of the completed CAD models and analyses, proving that the design is complete, meets all requirements, and is ready for manufacturing.',
          'To brainstorm new and innovative ideas to add to the robot before manufacturing begins.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Design Process',
      },
      {
        promptText:
          "The robot needs to perform a task in precisely 15.0 seconds. The current mechanism takes 17.2 seconds. Which area of the robot's performance offers the most potential for time savings?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "Reducing the robot's weight by 5% to make it accelerate slightly faster.",
          'Optimizing the C++ code to run 10% faster.',
          'Analyzing the sequence of operations and parallelizing tasks (e.g., starting to lift an arm while the drivetrain is still completing its final movement).',
          'Increasing the motor voltage by 10% for slightly more power.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Performance Optimization',
      },
      {
        promptText:
          'Your team is presented with two options for a manipulator: a simple, custom-built gripper that is 95% reliable, or a complex, off-the-shelf servo-driven hand that is 99% reliable but will take much longer to integrate. The robot must perform 50 grasp operations per match. Which is the better choice?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The custom gripper, because it is simpler to integrate.',
          'The off-the-shelf hand, because its reliability is higher.',
          'The custom gripper. The probability of completing all 50 grasps is (0.95^50) ≈ 7.6%, which is unacceptable.',
          'The off-the-shelf hand. The probability of completing all 50 grasps is (0.99^50) ≈ 60.5%, which is a significantly better, though still risky, proposition.',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Reliability Analysis',
      },
      {
        promptText:
          'A robot must lightly tap a button. The arm is powerful and has slight backlash in its joints. How can the robot perform this delicate task reliably without a force sensor?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "Move the arm very slowly towards the button's known position.",
          'Use a vision system to perfectly align the finger with the button.',
          'Incorporate a \"soft\" end-effector with built-in compliance, such as a spring-loaded fingertip, that can absorb the impact and tolerate positional error.',
          'Increase the holding torque on the arm joints to eliminate backlash.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Compliant Mechanisms',
      },
      {
        promptText:
          'You are given a small budget and asked to build a prototype robot arm. Which material is the best choice for the main structural links to allow for rapid iteration and modification?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Welded steel tubing.',
          'Carbon fiber composite sheets.',
          'T-slot aluminum extrusions (e.g., 80/20).',
          '3D printed ABS plastic.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Prototyping Materials',
      },
      {
        promptText:
          "The team's lead software engineer suggests implementing a Kalman Filter for sensor fusion. As the mechanical lead, what critical piece of information must you provide for the filter to work correctly?",
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'The maximum speed of the robot.',
          'The weight and center of gravity of the robot.',
          "The noise characteristics of the sensors (e.g., standard deviation of the gyroscope drift and accelerometer noise) and an accurate physical model of the robot's motion.",
          'The power consumption of each sensor.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Sensor Fusion',
      },
      {
        promptText:
          'Your robot consistently fails during the last 10 seconds of a 2-minute match. The battery starts fully charged. What is the most likely cause and what tool would you use to diagnose it?',
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Cause: Software memory leak. Tool: Code debugger.',
          'Cause: Motor overheating. Tool: Thermal camera (FLIR).',
          "Cause: The battery's voltage is collapsing under load as its charge is depleted. Tool: A data logger recording bus voltage and current throughout a full match.",
          'Cause: Driver fatigue. Tool: A stopwatch.',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'System Diagnostics',
      },
    ];

    // Create all remaining questions in batches
    console.log(`📝 Adding ${remainingQuestions.length} questions...\n`);

    const batchSize = 10;
    let createdCount = existingTest.questions.length;

    for (let i = 0; i < remainingQuestions.length; i += batchSize) {
      const batch = remainingQuestions.slice(i, i + batchSize);
      console.log(
        `   🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(remainingQuestions.length / batchSize)}...`
      );

      for (const questionData of batch) {
        const question = await prisma.question.create({
          data: {
            promptText: questionData.promptText,
            timerSeconds: questionData.timerSeconds,
            answerOptions: questionData.answerOptions,
            correctAnswerIndex: questionData.correctAnswerIndex,
            category: questionData.category,
            sectionTag: questionData.sectionTag,
            testId: TEST_ID,
          },
        });

        createdCount++;
        console.log(
          `      ✅ Question ${createdCount} (${questionData.sectionTag}): ${questionData.promptText.substring(0, 50)}...`
        );
      }
    }

    console.log(
      `\n🎉 Successfully added ALL ${remainingQuestions.length} questions!`
    );
    console.log(`   📊 Total questions now: ${createdCount}`);
    console.log(`   🕒 Total test time: ${(createdCount * 90) / 60} minutes`);

    console.log(`\n💡 The complete Mechanical Assessment 1 test is now ready!`);
  } catch (error) {
    console.error('❌ Error adding questions:', error);
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
