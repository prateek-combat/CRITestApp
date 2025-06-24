#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const TEST_ID = '6367b4a5-bd7d-4830-bdd4-dcd7f9b6140b';

async function main() {
  console.log('🚀 Adding ALL remaining questions...\n');
  await prisma.$connect();

  const test = await prisma.test.findUnique({
    where: { id: TEST_ID },
    include: { questions: true },
  });

  console.log(`Current questions: ${test.questions.length}`);

  const newQuestions = [
    {
      text: 'A high-inertia robotic arm is driven by a brushed DC motor and a gearbox. To achieve the fastest possible stop without excessive mechanical stress, which braking method is most appropriate?',
      options: [
        'Dynamic braking, by shunting the motor terminals with a low-value power resistor.',
        'Plugging, by reversing the motor voltage polarity to actively drive it to a stop.',
        'Using a mechanical brake integrated into the gearbox.',
        "Relying on the gearbox's inherent inefficiency and friction to stop the arm.",
      ],
      correct: 0,
      tag: 'Motor Control',
    },
    {
      text: 'You are designing a high-efficiency spur gearbox. What is the primary reason for choosing a larger pressure angle (e.g., 20° or 25° instead of 14.5°)?',
      options: [
        'A larger pressure angle results in a quieter gearbox.',
        'It allows for a higher gear reduction ratio in a single stage.',
        'It results in stronger, wider gear teeth that are less prone to bending failure and can handle higher loads, despite slightly higher bearing loads.',
        'It significantly reduces the axial thrust on the gear shafts.',
      ],
      correct: 2,
      tag: 'Gear Design',
    },
    {
      text: 'A lead screw-driven lifting mechanism is experiencing "back-driving" - the load is able to lower itself by spinning the screw when the motor is unpowered. Which single change would most effectively prevent this?',
      options: [
        'Increasing the diameter of the lead screw while keeping the lead constant.',
        'Switching to a multi-start lead screw to increase speed.',
        'Decreasing the lead angle of the screw thread such that the tangent of the lead angle is less than the coefficient of static friction.',
        'Using a more powerful motor.',
      ],
      correct: 2,
      tag: 'Screw Mechanics',
    },
    {
      text: 'When selecting a brushless DC (BLDC) motor for a battery-powered vehicle, what is the critical implication of choosing a motor with a very low Kv (RPM/Volt) rating?',
      options: [
        'The motor will have a very high no-load speed, requiring a large gear reduction.',
        'The motor will generate a high back-EMF at low speeds, making it inefficient.',
        'The motor is designed to produce high torque at low RPMs for a given voltage, making it suitable for direct drive or low-reduction applications, but will have a low top speed.',
        'The motor requires a higher voltage to operate than a high-Kv motor.',
      ],
      correct: 2,
      tag: 'Motor Selection',
    },
    {
      text: 'Why is a harmonic drive (strain wave gear) often chosen over a planetary gearbox for a high-precision robotic joint?',
      options: [
        'It is significantly more efficient than a planetary gearbox.',
        'It offers near-zero backlash, which is critical for positional accuracy and repeatability.',
        'It is much more robust and can handle higher shock loads.',
        'It is lower in cost and easier to manufacture.',
      ],
      correct: 1,
      tag: 'Precision Gearing',
    },
  ];

  let count = test.questions.length;

  for (const q of newQuestions) {
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
    console.log(`Added question ${count}: ${q.tag}`);
  }

  console.log(`\n🎉 Total questions now: ${count}`);
  await prisma.$disconnect();
}

main().catch(console.error);
