#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSystemsThinkingTest() {
  try {
    console.log('Creating Systems Thinking Test...');

    // Find admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });
    if (!adminUser) {
      console.error(
        '❌ Admin user not found. Please create an admin user first.'
      );
      return;
    }
    console.log('✅ Admin user found');

    const test = await prisma.test.create({
      data: {
        title: 'Systems Thinking',
        description:
          'Real-time systems troubleshooting and decision-making scenarios for autonomous robotics applications.',
        createdById: adminUser.id,
        questions: {
          create: [
            {
              promptText: `Control-loop timing suddenly slips from 5 ms to 40 ms for three cycles, then recovers. There is no obstacle nearby. Best on-board response?`,
              answerOptions: [
                'Maintain speed but raise a telemetry warning',
                'Reduce speed by 50% until timing stabilises',
                'Immediate emergency stop',
                'Reboot the control node',
              ],
              correctAnswerIndex: 1,
              timerSeconds: 45,
              sectionTag: 'Real-time Systems',
              category: 'OTHER',
            },
            {
              promptText: `Camera frame timestamps drift 200 ms behind other sensors after a CPU-heavy burst. Quickest mitigation?`,
              answerOptions: [
                'Switch perception to previous keyframe predictions',
                'Pause localisation until drift clears',
                'Discard camera frames until sync catches up',
                'Lower motor speed to match camera latency',
              ],
              correctAnswerIndex: 2,
              timerSeconds: 45,
              sectionTag: 'Sensor Fusion',
              category: 'OTHER',
            },
            {
              promptText: `Map-server process segfaults mid-mission but localisation still has last good map. Next best action?`,
              answerOptions: [
                'Continue using cached map and log event',
                'Abort mission immediately',
                'Restart entire autonomy stack',
                'Switch to tele-op',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Fault Tolerance',
              category: 'OTHER',
            },
            {
              promptText: `Disk space drops below 5%. Logs are filling rapidly. Primary safety choice?`,
              answerOptions: [
                'Rotate/trim logs and keep operating',
                'Stop perception to reduce writes',
                'Power-cycle to clear temp files',
                'Ignore; still room left',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Resource Management',
              category: 'OTHER',
            },
            {
              promptText: `A watchdog triggers soft reboot 3 times in 10 min due to deadlock in path-planner thread. What now?`,
              answerOptions: [
                'Fallback to open-loop tele-op only',
                'Disable planner and drive with last planned path',
                'Lock vehicle in safe idle and request recovery',
                'Increase watchdog timeout',
              ],
              correctAnswerIndex: 2,
              timerSeconds: 45,
              sectionTag: 'Safety Systems',
              category: 'OTHER',
            },
            {
              promptText: `CPU utilisation spikes to 100% on one core; other cores idle. Control loop misses deadlines. Quick fix?`,
              answerOptions: [
                'Raise control thread priority and pin to free core',
                'Lower overall vehicle speed',
                'Kill highest CPU consumer process',
                'Reboot OS',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Performance Optimization',
              category: 'OTHER',
            },
            {
              promptText: `Telemetry packets show out-of-order sequence numbers occasionally. System impact is low. Reasonable action?`,
              answerOptions: [
                'Add small receive buffer reordering window',
                'Switch to TCP for reliability',
                'Halt mission; fix comms',
                'Ignore; UDP can reorder',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Network Communications',
              category: 'OTHER',
            },
            {
              promptText: `Mission manager receives duplicated goal commands due to network resend. What should the software do?`,
              answerOptions: [
                'Check goal UUID, ignore duplicates',
                'Execute duplicate goals sequentially',
                'Abort current mission',
                'Reset goal queue entirely',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Mission Control',
              category: 'OTHER',
            },
            {
              promptText: `Sensor fusion reports growing velocity estimate variance; wheel encoders still good but IMU noise high. Safest adjustment?`,
              answerOptions: [
                'Reduce confidence weight on IMU',
                'Disable wheel odometry',
                'Increase control gains to compensate',
                'Ignore variance until threshold crossed',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Sensor Fusion',
              category: 'OTHER',
            },
            {
              promptText: `System clock drifts 2 s ahead after GNSS loss. Data stamps mis-align. Immediate mitigation?`,
              answerOptions: [
                'Switch to monotonic local clock and continue',
                'Stop all sensor publications',
                'Force NTP resync over LTE',
                'Reset robot',
              ],
              correctAnswerIndex: 0,
              timerSeconds: 45,
              sectionTag: 'Time Synchronization',
              category: 'OTHER',
            },
          ],
        },
      },
      include: {
        questions: true,
      },
    });

    console.log(`✅ Created Systems Thinking Test with ID: ${test.id}`);
    console.log(`📊 Added ${test.questions.length} questions`);
    console.log(`⏱️  Each question has 45 seconds timer`);
    console.log(
      `🎯 Test covers: Real-time Systems, Sensor Fusion, Fault Tolerance, Resource Management, Safety Systems, Performance Optimization, Network Communications, Mission Control, and Time Synchronization`
    );

    return test;
  } catch (error) {
    console.error('❌ Error creating Systems Thinking Test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createSystemsThinkingTest()
    .then(() => {
      console.log('🎉 Systems Thinking Test creation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to create Systems Thinking Test:', error);
      process.exit(1);
    });
}

module.exports = { createSystemsThinkingTest };
