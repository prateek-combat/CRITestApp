#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSystemsThinkingBatch2() {
  try {
    console.log('Adding Systems Thinking Test Batch 2 (Questions 11-20)...');

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

    // Add the next 10 questions
    const newQuestions = await prisma.question.createMany({
      data: [
        {
          promptText: `Localization confidence drops below 0.6 in open field. Behaviour?`,
          answerOptions: [
            'Slow down and search for features',
            'Continue at current speed',
            'Switch to manual control mode',
            'Clear costmaps and replan',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Localization',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Memory usage grows 10 MB/min and will exhaust RAM in 5 min. Highest risk subsystem?`,
          answerOptions: [
            'Long-term logging stack',
            'Perception object cache',
            'Shared pointer reference leak in path planner',
            'Parameter server',
          ],
          correctAnswerIndex: 2,
          timerSeconds: 45,
          sectionTag: 'Memory Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Battery SoC jumps from 40% to 5% instantly. Voltage stable. Best judgement?`,
          answerOptions: [
            'Treat as sensor glitch; request second reading',
            'Initiate controlled shutdown',
            'Continue mission but disable high-draw payloads',
            'Ignore and log',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Power Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `TLS certificate for cloud control plane expired mid-field test. Robot still connected via VPN. Safe action now?`,
          answerOptions: [
            'Continue local autonomy; disable remote commands',
            'Drop VPN and switch to unsecured channel',
            'Reboot to refresh certs',
            'Shut down mission',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Security',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `A new mission upload fails checksum twice. Third retry passes. Reliability judgement?`,
          answerOptions: [
            'Store MD5 of mission and proceed',
            'Abort mission load feature',
            'Switch to redundant download path',
            'Clear mission queue and manual restart',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Data Integrity',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Control parameters updated via OTA begin diverging vehicle path slightly. Operators notice 5° heading error. Response?`,
          answerOptions: [
            'Roll back to previous parameter set immediately',
            'Keep parameters and adjust joystick trim',
            'Let adaptive controller learn',
            'Pause mission and recalibrate compass',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Parameter Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `During log replay, sensor timestamps show 32-bit rollover every ~50 days. For live system what mitigation?`,
          answerOptions: [
            'Use 64-bit monotonic timestamps',
            'Reset timestamp counter weekly',
            'Ignore; unlikely in mission span',
            'Compress timestamps',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Time Management',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Event queue length exceeds 1000 pending messages. CPU ok, but latency high. Best flow-control tactic?`,
          answerOptions: [
            'Back-pressure publishers with drop policy',
            'Spawn more consumer threads',
            'Increase queue size',
            'Flush and discard all pending events',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'Message Queuing',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `Live patching requires restart of non-critical analytics node. Risk to safety stack?`,
          answerOptions: [
            'Minimal; proceed with rolling restart',
            'High; defer until vehicle idle',
            'Unknown; perform full system stop',
            'Always safe; hot-swap supported',
          ],
          correctAnswerIndex: 1,
          timerSeconds: 45,
          sectionTag: 'System Updates',
          category: 'OTHER',
          testId: existingTest.id,
        },
        {
          promptText: `CAN bus utilisation at 85% peak. Occasional control lag observed. Next step?`,
          answerOptions: [
            'Prioritise critical frames; drop noncritical',
            'Increase bus speed beyond spec',
            'Switch to alternate protocol mid-run',
            'Ignore; below 90%',
          ],
          correctAnswerIndex: 0,
          timerSeconds: 45,
          sectionTag: 'CAN Bus',
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
      `🎯 New batch covers: Localization, Memory Management, Power Management, Security, Data Integrity, Parameter Management, Time Management, Message Queuing, System Updates, and CAN Bus`
    );

    return newQuestions;
  } catch (error) {
    console.error('❌ Error adding Systems Thinking Test Batch 2:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  addSystemsThinkingBatch2()
    .then(() => {
      console.log(
        '🎉 Systems Thinking Test Batch 2 addition completed successfully!'
      );
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to add Systems Thinking Test Batch 2:', error);
      process.exit(1);
    });
}

module.exports = { addSystemsThinkingBatch2 };
