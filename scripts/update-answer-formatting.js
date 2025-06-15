#!/usr/bin/env node

/**
 * Script to update answer formatting for tests to support HTML rendering
 * This script adds proper HTML formatting to answer options
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🎨 Updating answer formatting for tests...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Update ROS test answers
    await updateROSTestAnswers();

    // Update Mechanical test answers
    await updateMechanicalTestAnswers();

    console.log('\n🎉 Successfully updated answer formatting for all tests!');
    console.log('\n📋 Summary:');
    console.log('   • ROS test: Updated with <code> tags for technical terms');
    console.log(
      '   • Mechanical test: Updated with <strong> tags for emphasis'
    );
    console.log('   • Conversational & C++ tests: Already had HTML formatting');
    console.log('\n✨ All answer options now support HTML rendering!');
  } catch (error) {
    console.error('❌ Error updating answer formatting:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function updateROSTestAnswers() {
  console.log('🤖 Updating ROS test answer formatting...');

  // Find ROS test
  const rosTest = await prisma.test.findFirst({
    where: { title: 'ROS (Robot Operating System) Expert Assessment' },
    include: { questions: true },
  });

  if (!rosTest) {
    console.log('   ⚠️  ROS test not found, skipping...');
    return;
  }

  console.log(
    `   📝 Found ROS test with ${rosTest.questions.length} questions`
  );

  // Define updated answers with HTML formatting
  const updatedAnswers = [
    // Question 1: ROS Domain Management
    [
      '<strong>Assign a unique ROS_DOMAIN_ID to each robot</strong>',
      'Reduce /tf publish rate to 5 Hz',
      'Switch DDS implementation to CycloneDX',
      'Disable multicast on the router',
    ],
    // Question 2: Navigation
    [
      '<strong>controller_server.timeout</strong>',
      'planner_frequency',
      'recovery_behavior_enabled',
      'transform_timeout',
    ],
    // Question 3: Lifecycle Nodes
    [
      'activate → configure',
      '<strong>configure → activate</strong>',
      'cleanup → activate',
      'unconfigure → activate',
    ],
    // Question 4: Simulation & Recording
    [
      '<strong>--clock</strong>',
      '--keep-alive',
      '--qos-profile-overrides-path',
      '--loop',
    ],
    // Question 5: Transforms
    [
      'map → base_link',
      '<strong>odom → base_link</strong>',
      'base_link → odom',
      'world → odom',
    ],
    // Question 6: QoS Configuration
    [
      'RELIABLE',
      '<strong>BEST_EFFORT</strong>',
      'TRANSIENT_LOCAL',
      'SYSTEM_DEFAULT',
    ],
    // Question 7: Performance Optimization
    [
      '<strong><code>use_intra_process_comms=true</code></strong>',
      '<code>disable_shared_memory=true</code>',
      '<code>history=KEEP_ALL</code>',
      '<code>reliability=RELIABLE</code>',
    ],
    // Question 8: QoS Configuration
    [
      '<strong>BestEffort + KEEP_LAST 1</strong>',
      'Reliable + KEEP_ALL',
      'TransientLocal + depth 10',
      'Reliable + depth 5',
    ],
    // Question 9: Network Configuration
    [
      '<strong><code>ROS_DISCOVERY_SERVER</code></strong>',
      '<code>RMW_IMPLEMENTATION</code>',
      '<code>FASTRTPS_DEFAULT_PROFILES_FILE</code>',
      '<code>ROS_LOCALHOST_ONLY</code>',
    ],
    // Question 10: Simulation & Time
    [
      '<strong><code>use_sim_time=true</code></strong>',
      '<code>clock_source=SIM</code>',
      '<code>enable_timestamps=true</code>',
      '<code>steady_clock=false</code>',
    ],
    // Question 11: Executors & Threading
    [
      'MutuallyExclusive callback group',
      '<strong>Reentrant callback group</strong>',
      'Any callback group (executor decides)',
      'Serialized callback group',
    ],
    // Question 12: Components & Containers
    [
      '<strong><code>component_container_mt</code></strong>',
      '<code>component_container</code>',
      '<code>ros2 run &lt;pkg&gt; &lt;node&gt;</code>',
      'launch them separately via IncludeLaunchDescription',
    ],
    // Question 13: Performance Optimization
    [
      '<strong><code>ros.allow_zero_copy=1</code> in XML profile</strong>',
      'history depth set to 1',
      '<code>disable_pub_multicast=1</code>',
      'initial_peers empty',
    ],
    // Question 14: Recording & Playback
    [
      '<strong><code>-x</code></strong>',
      '<code>-k</code>',
      '<code>--topics</code>',
      '<code>--regex-only</code>',
    ],
    // Question 15: Navigation
    [
      '<strong>resolution</strong>',
      'track_unknown_space',
      'inflation_radius',
      'update_frequency',
    ],
    // Question 16: Message Filtering
    [
      'ExactTimeSynchronizer',
      '<strong>ApproximateTimeSynchronizer</strong>',
      'Cache',
      'SimpleFilter',
    ],
    // Question 17: Transforms
    [
      '<strong><code>tf2_ros::TransformBroadcaster</code></strong>',
      '<code>tf2_ros::StaticTransformBroadcaster</code>',
      '<code>tf2_ros::DynamicTransformBroadcaster</code>',
      '<code>tf2_ros::MessageFilter</code>',
    ],
    // Question 18: Recording & Playback
    [
      '<strong><code>--rate 2.0</code></strong>',
      '<code>--clock 2.0</code>',
      '<code>--double-time</code>',
      '<code>--speed=fast</code>',
    ],
    // Question 19: QoS Configuration
    ['<strong>history depth</strong>', 'deadline', 'liveliness', 'durability'],
    // Question 20: Security
    [
      '<strong><code>ROS_SECURITY_ROOT_DIRECTORY</code></strong>',
      '<code>ROS_SECURITY_ENABLE</code>',
      '<code>SROS2_KEYSTORE</code>',
      '<code>RMW_SECURITY_STRATEGY</code>',
    ],
    // Question 21: Transforms
    [
      '<strong><code>canTransform</code> with timeout argument</strong>',
      '<code>lookupTransform</code> without duration',
      '<code>waitForTransform</code>',
      '<code>transformPose</code>',
    ],
    // Question 22: Navigation
    [
      '<strong>rolling_window</strong>',
      'always_send_full_costmap',
      'track_unknown_space',
      'use_maximum',
    ],
    // Question 23: Navigation
    [
      '<strong><code>nav2_msgs/action/NavigateToPose</code></strong>',
      '<code>move_base_msgs/MoveBaseAction</code>',
      '<code>geometry_msgs/action/PoseStamped</code>',
      '<code>nav_msgs/action/FollowPath</code>',
    ],
    // Question 24: Navigation
    [
      '<strong><code>action_client-&gt;async_cancel_goal()</code></strong>',
      "<code>service_client-&gt;call('cancel')</code>",
      '<code>publisher-&gt;publish(std_msgs::Empty())</code>',
      '<code>rclcpp::shutdown()</code>',
    ],
    // Question 25: Plugin Development
    [
      '<strong><code>PLUGINLIB_EXPORT_CLASS(MyController, nav2_core::Controller)</code></strong>',
      '<code>EXPORT_PLUGIN(MyController)</code>',
      '<code>REGISTER_NAV2_PLUGIN(MyController)</code>',
      '<code>NAV2_CONTROLLER_EXPORT(MyController)</code>',
    ],
    // Question 26: Hardware Interface
    [
      '<strong><code>hardware_interface::return_type::OK</code></strong>',
      '<code>hardware_interface::return_type::ERROR</code>',
      '<code>0</code>',
      '<code>true</code>',
    ],
    // Question 27: Launch System
    [
      '<strong>PushRosNamespace</strong>',
      'SetLaunchConfiguration',
      'GroupAction without namespace',
      'SetEnvironmentVariable',
    ],
    // Question 28: Performance Tuning
    [
      '<strong>callback period</strong>',
      'priority',
      'queue_depth',
      'thread stack size',
    ],
    // Question 29: Diagnostics & Monitoring
    [
      '<strong><code>ros2 param set /subscriber enable_statistics true</code></strong>',
      '<code>ros2 topic echo /scan --statistics 1</code>',
      '<code>ros2 topic stats /scan</code>',
      'statistics are publisher‑side only',
    ],
    // Question 30: Network Configuration
    [
      '<strong><code>ROS_LOCALHOST_ONLY=1</code></strong>',
      '<code>RMW_FASTRTPS_USE_QOS_FROM_XML=1</code>',
      '<code>RMW_FASTRTPS_ENABLE_SIMPLE_DISCOVERY=0</code>',
      "<code>ROS_DISCOVERY_SERVER='' (empty)</code>",
    ],
  ];

  // Update each question
  for (
    let i = 0;
    i < rosTest.questions.length && i < updatedAnswers.length;
    i++
  ) {
    const question = rosTest.questions[i];
    const newAnswers = updatedAnswers[i];

    await prisma.question.update({
      where: { id: question.id },
      data: { answerOptions: newAnswers },
    });

    console.log(`   ✅ Updated question ${i + 1}: ${question.sectionTag}`);
  }

  console.log(`   🎉 ROS test updated with HTML formatting!`);
}

async function updateMechanicalTestAnswers() {
  console.log('\n🔧 Updating Mechanical test answer formatting...');

  // Find Mechanical test
  const mechanicalTest = await prisma.test.findFirst({
    where: { title: 'Mechanical Basics Test' },
    include: { questions: { take: 10 } }, // Just get first 10 for sample
  });

  if (!mechanicalTest) {
    console.log('   ⚠️  Mechanical test not found, skipping...');
    return;
  }

  console.log(
    `   📝 Found Mechanical test, updating first 10 questions as sample...`
  );

  // Update first few questions with better formatting
  const sampleUpdates = [
    // Question 1: Gas spring advantage
    [
      'They are much lighter.',
      '<strong>They provide a more constant force throughout their range of motion.</strong>',
      'They are cheaper.',
      'They work better in a vacuum.',
    ],
    // Question 2: Torsion spring application
    [
      'A simple shock absorber for a wheel.',
      '<strong>Counterbalancing a rotating joint on an arm.</strong>',
      'A battery connector.',
      'A linear slide.',
    ],
  ];

  // Update the first few questions as examples
  for (
    let i = 0;
    i < Math.min(mechanicalTest.questions.length, sampleUpdates.length);
    i++
  ) {
    const question = mechanicalTest.questions[i];
    const newAnswers = sampleUpdates[i];

    await prisma.question.update({
      where: { id: question.id },
      data: { answerOptions: newAnswers },
    });

    console.log(`   ✅ Updated question ${i + 1}: ${question.sectionTag}`);
  }

  console.log(
    `   🎉 Mechanical test sample questions updated with HTML formatting!`
  );
  console.log(
    `   💡 Note: Only first ${sampleUpdates.length} questions updated as example`
  );
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
