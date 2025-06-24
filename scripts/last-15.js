#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Adding FINAL 15 questions to complete the assessment...\n');
  await prisma.$connect();

  const test = await prisma.test.findUnique({
    where: { id: TEST_ID },
    include: { questions: true },
  });

  console.log(`Current questions: ${test.questions.length}`);

  const finalQuestions = [
    {
      text: 'What is meant by a "statically determinate" structure, and why is this property not always desirable in a robotic design?',
      options: [
        'It is a structure that is perfectly rigid. It is undesirable because it is too heavy.',
        'It is a structure where all member forces can be solved with static equilibrium equations alone. It can be undesirable because the failure of a single member leads to the collapse of the entire structure (no redundancy).',
        'It is a structure with more members than necessary. It is undesirable because of the extra weight.',
        'It is a structure that is designed to be in motion. It is undesirable for stationary robots.',
      ],
      correct: 1,
      tag: 'Structural Analysis',
    },
    {
      text: 'A high-frequency signal from a precision analog sensor is showing significant noise that correlates with the operation of a large DC motor on the robot. What is the most effective solution to ensure signal integrity?',
      options: [
        'Twisting the sensor wires together and enclosing them in a grounded, shielded cable, keeping it physically separate from the motor power wires.',
        'Adding a large capacitor across the motor terminals to smooth the input voltage.',
        'Increasing the data sampling rate of the analog-to-digital converter (ADC).',
        'Writing a software-based moving average filter to smooth the sensor data.',
      ],
      correct: 0,
      tag: 'Signal Integrity',
    },
    {
      text: "A robot's main computer and motor controllers are enclosed in a sealed aluminum box. The CPU is overheating. What is the most effective way to improve cooling without adding a fan or venting the box to the outside environment?",
      options: [
        'Painting the outside of the box matte black.',
        "Attaching the CPU's heat sink directly to the inner wall of the aluminum box using a thermal pad.",
        'Filling the box with non-conductive mineral oil.',
        'Placing a Peltier cooler (thermoelectric cooler) on the CPU.',
      ],
      correct: 1,
      tag: 'Thermal Management',
    },
    {
      text: 'When selecting a connector for a battery pack that will be frequently connected and disconnected, what does a "hot-swappable" or "anti-spark" feature (like in an AS150 or XT90-S connector) do?',
      options: [
        'It contains a small fuse that blows if the current is too high.',
        'It uses a pre-charge resistor to slowly equalize the voltage and prevent the large inrush current that causes a damaging spark when connecting to capacitors in a motor controller.',
        'The connector pins are made of a special metal that does not spark.',
        'It has a secondary locking mechanism to prevent accidental disconnection.',
      ],
      correct: 1,
      tag: 'Electrical Connectors',
    },
    {
      text: 'A motor controller for a 24V system is rated for "48V peak". Why can\'t this controller be safely used with a 48V battery?',
      options: [
        'The 48V peak rating is only for short-duration marketing purposes.',
        'A 48V battery provides a nominal voltage, but the controller needs to handle regenerative braking voltage spikes which can far exceed the nominal battery voltage.',
        "The controller's firmware is locked to only work at 24V.",
        'The current rating would be halved at 48V, making it underpowered.',
      ],
      correct: 1,
      tag: 'Power Electronics',
    },
    {
      text: 'An autonomous robot uses a 2D LiDAR for localization. It frequently gets "lost" when moving down a long, uniform hallway. What is this phenomenon called and what is the best way to fix it?',
      options: [
        'It\'s called \"sensor aliasing\", fixed by using a 3D LiDAR.',
        'It\'s called the \"perceptual aliasing\" or \"corridor problem\", best fixed by fusing the LiDAR data with another sensor modality, like wheel odometry or visual features.',
        'It\'s called \"signal saturation\", fixed by reducing the LiDAR\'s laser power.',
        'It\'s called \"beam divergence\", fixed by using a LiDAR with a narrower beam.',
      ],
      correct: 1,
      tag: 'Sensor Fusion',
    },
    {
      text: 'What is the purpose of a "ferrite bead" or "ferrite core" clamped around a bundle of wires on a robot?',
      options: [
        'It is a magnetic weight used to keep the wires from moving.',
        'It is a passive low-pass filter used to suppress high-frequency electromagnetic interference (EMI) on the cable without affecting the DC power or low-frequency signals.',
        'It is used to increase the inductance of the cable to store more energy.',
        "It is a color-coded marker for identifying the cable's function.",
      ],
      correct: 1,
      tag: 'EMI Suppression',
    },
    {
      text: "A stepper motor is losing steps during a high-acceleration move. The driver's current limit is already set to the motor's maximum rating. What is the most likely cause?",
      options: [
        'The motor does not have enough holding torque.',
        "The torque required to accelerate the load exceeds the motor's available torque at that specific speed.",
        'The bus voltage is too low, limiting the rate at which current can rise in the windings.',
        'The microstepping setting is too high.',
      ],
      correct: 1,
      tag: 'Stepper Motors',
    },
    {
      text: 'Why are IGBTs (Insulated Gate Bipolar Transistors) often preferred over MOSFETs in very high-power, high-voltage motor controllers (e.g., >100V, >100A)?',
      options: [
        'IGBTs have a significantly lower \"on-state\" voltage drop at high currents, leading to lower conduction losses and better thermal performance.',
        'IGBTs can switch at much higher frequencies than MOSFETs.',
        'IGBTs are much cheaper and more readily available than high-power MOSFETs.',
        'IGBTs do not require a gate driver circuit like MOSFETs do.',
      ],
      correct: 0,
      tag: 'Power Electronics',
    },
    {
      text: "You are mounting a high-sensitivity Inertial Measurement Unit (IMU) to your robot's chassis. What is the most critical mounting consideration for accurate readings?",
      options: [
        "Mounting it as close to the robot's center of gravity as possible.",
        'Ensuring the IMU is rigidly coupled to the frame and providing vibration isolation through soft grommets or damping foam.',
        'Placing it in an area with good airflow for thermal stability.',
        'Using non-magnetic aluminum screws instead of steel screws.',
      ],
      correct: 1,
      tag: 'Sensor Mounting',
    },
    {
      text: "A competition robot's performance is inconsistent. It works perfectly in the workshop but fails intermittently during matches. The mechanical systems are robust and the software has no known bugs. What is the most likely system-level issue to investigate first?",
      options: [
        "The robot's aesthetic design is not intimidating enough to other competitors.",
        "The robot's power system (battery, wiring, and connectors) is experiencing voltage drops (brownouts) under the high-current loads of a real match, causing microcontrollers to reset.",
        "The wireless competition environment is causing packet loss to the robot's radio.",
        'The temperature and humidity in the competition venue are different from the workshop.',
      ],
      correct: 1,
      tag: 'System Troubleshooting',
    },
    {
      text: 'A critical design review (CDR) for your robot is approaching. What is the primary purpose of a CDR and what should your team be prepared to present?',
      options: [
        'To demonstrate a fully working prototype of the robot to the stakeholders.',
        'To present a detailed budget and timeline for the remainder of the project.',
        'To present a \"design freeze\" of the completed CAD models and analyses, proving that the design is complete, meets all requirements, and is ready for manufacturing.',
        'To brainstorm new and innovative ideas to add to the robot before manufacturing begins.',
      ],
      correct: 2,
      tag: 'Design Process',
    },
    {
      text: "The robot needs to perform a task in precisely 15.0 seconds. The current mechanism takes 17.2 seconds. Which area of the robot's performance offers the most potential for time savings?",
      options: [
        "Reducing the robot's weight by 5% to make it accelerate slightly faster.",
        'Optimizing the C++ code to run 10% faster.',
        'Analyzing the sequence of operations and parallelizing tasks (e.g., starting to lift an arm while the drivetrain is still completing its final movement).',
        'Increasing the motor voltage by 10% for slightly more power.',
      ],
      correct: 2,
      tag: 'Performance Optimization',
    },
    {
      text: 'Your team is presented with two options for a manipulator: a simple, custom-built gripper that is 95% reliable, or a complex, off-the-shelf servo-driven hand that is 99% reliable but will take much longer to integrate. The robot must perform 50 grasp operations per match. Which is the better choice?',
      options: [
        'The custom gripper, because it is simpler to integrate.',
        'The off-the-shelf hand, because its reliability is higher.',
        'The custom gripper. The probability of completing all 50 grasps is (0.95^50) ≈ 7.6%, which is unacceptable.',
        'The off-the-shelf hand. The probability of completing all 50 grasps is (0.99^50) ≈ 60.5%, which is a significantly better, though still risky, proposition.',
      ],
      correct: 3,
      tag: 'Reliability Analysis',
    },
    {
      text: "The team's lead software engineer suggests implementing a Kalman Filter for sensor fusion. As the mechanical lead, what critical piece of information must you provide for the filter to work correctly?",
      options: [
        'The maximum speed of the robot.',
        'The weight and center of gravity of the robot.',
        "The noise characteristics of the sensors (e.g., standard deviation of the gyroscope drift and accelerometer noise) and an accurate physical model of the robot's motion.",
        'The power consumption of each sensor.',
      ],
      correct: 2,
      tag: 'Sensor Fusion',
    },
  ];

  let count = test.questions.length;

  for (const q of finalQuestions) {
    await prisma.question.create({
      data: {
        promptText: q.text,
        answerOptions: q.options,
        correctAnswerIndex: q.correct,
        category: 'OTHER',
        sectionTag: q.tag,
        timerSeconds: 90,
        testId: TEST_ID,
      },
    });
    count++;
    console.log(`✅ Question ${count}: ${q.tag}`);
  }

  console.log(`\n🎉🎉 COMPLETE! ALL 50 QUESTIONS ADDED! 🎉🎉`);
  console.log(`📊 Total: ${count} questions`);
  console.log(`⏱️  Full test time: ${(count * 90) / 60} minutes`);
  console.log(`\n💡 The Mechanical Assessment 1 is now ready for use!`);
  console.log(`   Test ID: ${TEST_ID}`);
  console.log(
    `   You can create invitations or public links to share this test.`
  );

  await prisma.$disconnect();
}

main().catch(console.error);
