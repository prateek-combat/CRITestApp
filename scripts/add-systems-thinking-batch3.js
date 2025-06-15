#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSystemsThinkingBatch3() {
  try {
    console.log('Adding Systems Thinking Test Batch 3 (Questions 21-30)...');

    // Find the existing Systems Thinking test
    const existingTest = await prisma.test.findFirst({
      where: { title: 'Systems Thinking' },
      include: { questions: true },
    });

    if (!existingTest) {
      console.error(
        '❌ Systems Thinking test not found. Please create it first.'
      );
      return;
    }
    console.log(
      `✅ Found existing test with ${existingTest.questions.length} questions`
    );

    // Add the final 10 questions
    const newQuestions = await prisma.question.createMany({
      data: [
        {
          promptText: `Process monitoring reports high context-switch rate. Likely root cause to inspect first?`,
          answerOptions: [
            'Excessive fine-grained logging',
            'Thread starvation',
            'Kernel IRQ storm',
            'Memory leak',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Process Monitoring',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `API server on board returns 500 errors 1% of the time under load tests. For field use?`,
          answerOptions: [
            'Throttle request rate or add retry logic',
            'Deploy; acceptable',
            'Rewrite API first',
            'Disable API entirely',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'API Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `New sensor publishes at 1 kHz; fusion runs 200 Hz. Naïve integration causes aliasing. Quick workaround?`,
          answerOptions: [
            'Downsample sensor in publisher',
            'Speed up fusion loop',
            'Ignore extra data',
            'Disable sensor',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Signal Processing',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Mission timeouts configured to 10 s. Cloud latency spikes to 12 s. Robot is stationary waiting for next waypoint.`,
          answerOptions: [
            'Gracefully extend timeout once',
            'Abort mission',
            'Ignore latency; vehicle idle',
            'Switch to autonomous exploration',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Timeout Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Critical thread stack size set too low; rare stack overflow resets process. Safest immediate fix?`,
          answerOptions: [
            'Double stack size for that thread',
            'Catch and ignore overflow exceptions',
            'Decrease recursion depth in code',
            'Stop using that thread',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Stack Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Anomaly detector falsely flags 'obstacle' twice during clear path, causing momentary stops.`,
          answerOptions: [
            'Lower detector sensitivity threshold',
            'Disable detector',
            'Reduce vehicle speed',
            'Add secondary verification before stop command',
          ],
          correctAnswerIndex: 3,
          timerSeconds: 45,
          sectionTag: 'Anomaly Detection',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Redundant Ethernet links flap between primary and backup every minute, causing minor packet loss. Response?`,
          answerOptions: [
            'Fix hysteresis; lengthen hold-down timer',
            'Disable redundancy',
            'Ignore; packets recover',
            'Force static routing',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Network Redundancy',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Shared library version mismatch causes symbol lookup errors for diagnostics module only. Mission-critical stack unaffected.`,
          answerOptions: [
            'Isolate and hot-patch diagnostics library',
            'Restart entire robot',
            'Ignore diagnostics',
            'Rollback OS image',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Library Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `CPU temperature hits 95°C (thermal limit 97°C). System still performant. Preferred action?`,
          answerOptions: [
            'Throttle compute-intense tasks',
            'Keep running; within limit',
            'Turn on additional fan even if noisy',
            'Shut down',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Thermal Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Data recorder uses CSV; spikes in sensor rates create bursty writes causing occasional frame drops. Fast mitigation?`,
          answerOptions: [
            'Switch to binary chunked logging',
            'Increase OS write cache',
            'Reduce sensor frame rate',
            'Compress CSV on the fly',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Data Recording',
          category: 'OTHER',
          testId: existingTest.id,
        },
      ],
    });

    console.log(
      `✅ Added ${newQuestions.count} new questions to Systems Thinking Test`
    );
    console.log(
      `📊 Test now has ${existingTest.questions.length + newQuestions.count} total questions`
    );
    console.log(`⏱️  Each question has 45 seconds timer`);
    console.log(
      `🎯 Final batch covers: Process Monitoring, API Management, Signal Processing, Timeout Management, Stack Management, Anomaly Detection, Network Redundancy, Library Management, Thermal Management, and Data Recording`
    );

    return newQuestions;
  } catch (error) {
    console.error('❌ Error adding Systems Thinking Test Batch 3:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addSystemsThinkingBatch3()
    .then(() => {
      console.log(
        '🎉 Systems Thinking Test Batch 3 addition completed successfully!'
      );
      console.log(
        '🏆 Complete Systems Thinking Test with 30 questions is now ready!'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add Systems Thinking Test Batch 3:', error);
      process.exit(1);
    });
}

module.exports = { addSystemsThinkingBatch3 };
