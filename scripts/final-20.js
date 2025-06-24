#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Adding final 20 questions...\n');
  await prisma.$connect();

  const test = await prisma.test.findUnique({
    where: { id: TEST_ID },
    include: { questions: true },
  });

  console.log(`Current questions: ${test.questions.length}`);

  const questions = [
    {
      text: 'A gearbox is specified to have 1 degree of backlash. If this gearbox is used to control a robotic arm that is 500mm long, what is the approximate positional error at the tooltip due to this backlash?',
      options: ['~0.1 mm', '~1.0 mm', '~8.7 mm', '~50.0 mm'],
      correct: 2,
      tag: 'Kinematic Analysis',
    },
    {
      text: 'To design a four-bar linkage that guides an end-effector through three specific, precise positions in space, what is the most appropriate design methodology?',
      options: [
        'Trial and error using a CAD program.',
        "Using Grashof's criterion to ensure the linkage can rotate fully.",
        'Graphical or analytical synthesis techniques, such as the Freudenstein equation or geometric inversion.',
        'Performing a finite element analysis (FEA) of a generic linkage.',
      ],
      correct: 2,
      tag: 'Mechanism Design',
    },
    {
      text: 'You are designing a lightweight structural frame using carbon fiber tubes. To join two tubes at a T-junction to handle high bending loads, what is the most structurally sound method?',
      options: [
        'Using a standard 3D printed PLA clamp.',
        'Flattening the end of one tube and bolting it to the side of the other.',
        'Using custom-machined aluminum inserts and a bonded/bolted connection.',
        'Using a wrapped joint with carbon fiber tow and epoxy, creating a continuous load path through the fibers.',
      ],
      correct: 3,
      tag: 'Composite Structures',
    },
    {
      text: 'What is the principle of "force closure" in a robotic gripper design?',
      options: [
        'The gripper uses a very high force to hold the object securely.',
        'The gripper has a feature that locks it closed, even if power is lost.',
        'The gripper is designed such that a continuous, directed force (e.g., from springs or actuators) is required to maintain a stable grasp on the object.',
        'The gripper is designed such that the geometry of the fingers and contact points constrains the object, preventing it from slipping, regardless of the gripping force.',
      ],
      correct: 3,
      tag: 'Gripper Design',
    },
    {
      text: 'A designer uses "topology optimization" software on a CAD model of a bracket. What is the primary output of this process?',
      options: [
        'A detailed report of the stress, strain, and displacement of the original bracket.',
        'An optimized geometric form that shows the ideal load paths, removing all non-essential material, which often results in an organic, bone-like structure.',
        'A recommendation for the best material to use for the bracket.',
        'A simplified version of the bracket that is easier to manufacture.',
      ],
      correct: 1,
      tag: 'Design Optimization',
    },
  ];

  let count = test.questions.length;

  for (const q of questions) {
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

  console.log(`\n🎉 Added ${questions.length} more questions!`);
  console.log(`📊 Total: ${count} questions`);
  console.log(`⏱️  Test time: ${(count * 90) / 60} minutes`);

  await prisma.$disconnect();
}

main().catch(console.error);
