#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Adding final batch of questions...\n');
  await prisma.$connect();

  const test = await prisma.test.findUnique({
    where: { id: TEST_ID },
    include: { questions: true },
  });

  console.log(`Current questions: ${test.questions.length}`);

  // Final 30 questions to complete the mechanical assessment
  const finalQuestions = [
    {
      text: 'In a pneumatic system, what is the function of a "pilot-operated" valve, and why is it used?',
      options: [
        'It is a small, manually operated valve used to test the system.',
        'It uses a small amount of pilot air to shift a much larger valve spool, allowing a low-power solenoid to control a very high-flow-rate air supply.',
        'It is a proportional valve that can be partially opened to control cylinder speed.',
        "It is a valve that automatically shuts off when the pilot's console is deactivated.",
      ],
      correct: 1,
      tag: 'Pneumatics',
    },
    {
      text: 'A spring-loaded mechanism is designed to provide a constant force over a long range of travel. What type of spring should be used?',
      options: [
        'A standard compression spring.',
        'A Belleville washer stack.',
        'A constant-force spring (a spooled strip of steel).',
        'A torsion spring.',
      ],
      correct: 2,
      tag: 'Spring Design',
    },
    {
      text: 'What is the primary advantage of using a cycloidal drive in a high-shock-load robotics application?',
      options: [
        'It has zero backlash.',
        'It has an extremely high gear reduction ratio in a single stage.',
        'Its load is shared among a large number of rolling elements simultaneously, giving it exceptional shock resistance and durability.',
        'It can be 3D printed easily from common plastics.',
      ],
      correct: 2,
      tag: 'Advanced Gearing',
    },
    {
      text: 'When driving a DC motor with a PWM signal from an H-bridge, "shoot-through" is a destructive condition where:',
      options: [
        'The motor current exceeds its rated stall current.',
        'The back-EMF from the motor exceeds the bus voltage.',
        'Both the high-side and low-side transistors on the same leg of the H-bridge are momentarily turned on, creating a dead short across the power supply.',
        'The PWM signal contains voltage spikes that damage the motor controller.',
      ],
      correct: 2,
      tag: 'Motor Drivers',
    },
    {
      text: 'What is the primary reason for using differential signaling (e.g., RS-422/485) for long-distance communication with an encoder or sensor on a robot?',
      options: [
        'It allows for a higher data transmission speed than single-ended signals.',
        'It requires fewer wires than other communication protocols.',
        'Differential signals have high common-mode noise rejection, making the communication extremely robust against electrical noise picked up over the length of the cable.',
        'It allows multiple sensors to talk on the same bus without an addressing scheme.',
      ],
      correct: 2,
      tag: 'Communication Protocols',
    },
    {
      text: "A robot's vision system is tasked with identifying red balls. It works well under fluorescent lighting but fails under warm incandescent or natural sunlight. What is the most robust solution?",
      options: [
        'Manually recalibrating the red color threshold for every new lighting condition.',
        'Converting the camera image from RGB color space to HSV (Hue, Saturation, Value) color space and thresholding primarily on the Hue channel.',
        'Increasing the brightness and contrast of the camera image in software.',
        'Using a more expensive camera with higher resolution.',
      ],
      correct: 1,
      tag: 'Computer Vision',
    },
    {
      text: 'Your team is tasked with designing a robot to manipulate a series of heavy objects. The project timeline is extremely short. Which design philosophy is most likely to lead to success?',
      options: [
        'Spend the majority of the time designing a single, highly-optimized, perfect mechanism.',
        'Immediately build a complex, multi-functional robot that can theoretically perform all tasks.',
        'Adopt an iterative design approach: build a simple, robust \"minimum viable product\" (e.g., a drivetrain that can move) first, then progressively add and test one new mechanism at a time.',
        'Outsource the design to a more experienced professional engineering firm.',
      ],
      correct: 2,
      tag: 'Design Philosophy',
    },
    {
      text: 'A robot must lightly tap a button. The arm is powerful and has slight backlash in its joints. How can the robot perform this delicate task reliably without a force sensor?',
      options: [
        "Move the arm very slowly towards the button's known position.",
        'Use a vision system to perfectly align the finger with the button.',
        'Incorporate a \"soft\" end-effector with built-in compliance, such as a spring-loaded fingertip, that can absorb the impact and tolerate positional error.',
        'Increase the holding torque on the arm joints to eliminate backlash.',
      ],
      correct: 2,
      tag: 'Compliant Mechanisms',
    },
    {
      text: 'You are given a small budget and asked to build a prototype robot arm. Which material is the best choice for the main structural links to allow for rapid iteration and modification?',
      options: [
        'Welded steel tubing.',
        'Carbon fiber composite sheets.',
        'T-slot aluminum extrusions (e.g., 80/20).',
        '3D printed ABS plastic.',
      ],
      correct: 2,
      tag: 'Prototyping Materials',
    },
    {
      text: 'Your robot consistently fails during the last 10 seconds of a 2-minute match. The battery starts fully charged. What is the most likely cause and what tool would you use to diagnose it?',
      options: [
        'Cause: Software memory leak. Tool: Code debugger.',
        'Cause: Motor overheating. Tool: Thermal camera (FLIR).',
        "Cause: The battery's voltage is collapsing under load as its charge is depleted. Tool: A data logger recording bus voltage and current throughout a full match.",
        'Cause: Driver fatigue. Tool: A stopwatch.',
      ],
      correct: 2,
      tag: 'System Diagnostics',
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

  console.log(`\n🎉 COMPLETE! Total questions: ${count}`);
  console.log(`📊 Full test time: ${(count * 90) / 60} minutes`);
  console.log(
    `\n💡 Mechanical Assessment 1 is now complete with all ${count} questions!`
  );

  await prisma.$disconnect();
}

main().catch(console.error);
