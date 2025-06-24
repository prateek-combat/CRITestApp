#!/usr/bin/env node

/**
 * Script to create the ROS (Robot Operating System) Test
 * This script creates a comprehensive ROS test with 30 questions covering various ROS concepts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating ROS (Robot Operating System) Test...\n');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@testplatform.com',
          passwordHash: 'admin', // In real app, this would be hashed
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'ROS (Robot Operating System) Expert Assessment',
        description:
          'A comprehensive ROS assessment covering navigation, lifecycle nodes, QoS settings, transforms, discovery, timing, containers, and advanced ROS 2 concepts for robotics engineers.',

        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all 30 ROS questions from the provided table
    const questions = [
      {
        promptText:
          "Three Arista UGVs on the same Wi‑Fi start seeing each other's /tf frames. What is the quickest isolation step?",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Assign a unique ROS_DOMAIN_ID to each robot',
          'Reduce /tf publish rate to 5 Hz',
          'Switch DDS implementation to CycloneDX',
          'Disable multicast on the router',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'ROS Domain Management',
      },
      {
        promptText:
          "Nav2's controller_server keeps timing‑out after 0.5 s even though /cmd_vel is published. Which parameter should you raise first?",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'controller_server.timeout',
          'planner_frequency',
          'recovery_behavior_enabled',
          'transform_timeout',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Navigation',
      },
      {
        promptText:
          'Your lidar node is a lifecycle node stuck in the UNCONFIGURED state. Which service sequence brings it into an active publishing state?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'activate → configure',
          'configure → activate',
          'cleanup → activate',
          'unconfigure → activate',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Lifecycle Nodes',
      },
      {
        promptText:
          'You want bag playback in Gazebo to drive simulated time for all nodes. Which ros2 bag play option is essential?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '--clock',
          '--keep-alive',
          '--qos-profile-overrides-path',
          '--loop',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Simulation & Recording',
      },
      {
        promptText:
          'When broadcasting odometry, which transform is typically published by the diff‑drive node?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'map → base_link',
          'odom → base_link',
          'base_link → odom',
          'world → odom',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Transforms',
      },
      {
        promptText:
          'A micro‑ROS MCU only needs best‑effort wheel‑speed updates. Which QoS reliability is appropriate?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'RELIABLE',
          'BEST_EFFORT',
          'TRANSIENT_LOCAL',
          'SYSTEM_DEFAULT',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'QoS Configuration',
      },
      {
        promptText:
          'High latency appears on /camera/image_raw. Which single node option reduces extra serialization copies?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'use_intra_process_comms=true',
          'disable_shared_memory=true',
          'history=KEEP_ALL',
          'reliability=RELIABLE',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Performance Optimization',
      },
      {
        promptText:
          '/cmd_vel packets are arriving late over WFB‑NG, causing delayed motion. Which QoS tweak helps most?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'BestEffort + KEEP_LAST 1',
          'Reliable + KEEP_ALL',
          'TransientLocal + depth 10',
          'Reliable + depth 5',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'QoS Configuration',
      },
      {
        promptText:
          'Network discovery floods your lab when multiple robots boot. Setting which env var points every robot to a central discovery server?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ROS_DISCOVERY_SERVER',
          'RMW_IMPLEMENTATION',
          'FASTRTPS_DEFAULT_PROFILES_FILE',
          'ROS_LOCALHOST_ONLY',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Network Configuration',
      },
      {
        promptText:
          "Simulation time from Gazebo isn't respected in your control node—timestamps stay at 0. The missing node parameter is…",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'use_sim_time=true',
          'clock_source=SIM',
          'enable_timestamps=true',
          'steady_clock=false',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Simulation & Time',
      },
      {
        promptText:
          'You want two callbacks (camera & control) in one node to run concurrently under MultiThreadedExecutor. Place the camera subscription in a:',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'MutuallyExclusive callback group',
          'Reentrant callback group',
          'Any callback group (executor decides)',
          'Serialized callback group',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Executors & Threading',
      },
      {
        promptText:
          'Planning at 1 Hz and control at 50 Hz should live in the same process. Which container gives parallelism without extra processes?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'component_container_mt',
          'component_container',
          'ros2 run <pkg> <node>',
          'launch them separately via IncludeLaunchDescription',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Components & Containers',
      },
      {
        promptText:
          'To avoid copying large PointCloud2 messages between nodes, which Fast DDS setting complements intra‑process comms?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ros.allow_zero_copy=1 in XML profile',
          'history depth set to 1',
          'disable_pub_multicast=1',
          'initial_peers empty',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Performance Optimization',
      },
      {
        promptText:
          'You record only /odom, /tf, and /scan, excluding camera topics. Which flag lets you exclude by regular expression?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: ['-x', '-k', '--topics', '--regex-only'],
        correctAnswerIndex: 0, // A
        sectionTag: 'Recording & Playback',
      },
      {
        promptText:
          'While mapping, you down‑sample the global costmap to 0.2 m cells. Which Nav2 parameter do you change?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'resolution',
          'track_unknown_space',
          'inflation_radius',
          'update_frequency',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Navigation',
      },
      {
        promptText:
          'Stereo disparity node needs almost‑synchronised left/right images. Which message_filters synchroniser handles small time offsets?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ExactTimeSynchronizer',
          'ApproximateTimeSynchronizer',
          'Cache',
          'SimpleFilter',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Message Filtering',
      },
      {
        promptText:
          'StaticTransformBroadcaster is publishing a transform that actually changes every cycle. The correct broadcaster class is…',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'tf2_ros::TransformBroadcaster',
          'tf2_ros::StaticTransformBroadcaster',
          'tf2_ros::DynamicTransformBroadcaster',
          'tf2_ros::MessageFilter',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Transforms',
      },
      {
        promptText:
          'You want to replay a bag at double speed to speed up offline testing. Which play option achieves that?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '--rate 2.0',
          '--clock 2.0',
          '--double-time',
          '--speed=fast',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Recording & Playback',
      },
      {
        promptText:
          'Sensor queue overflows because publisher depth is too small. Which QoS field do you increase?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'history depth',
          'deadline',
          'liveliness',
          'durability',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'QoS Configuration',
      },
      {
        promptText:
          'ROS 2 security is required for field trials. Which environment variable points nodes to the keystore?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ROS_SECURITY_ROOT_DIRECTORY',
          'ROS_SECURITY_ENABLE',
          'SROS2_KEYSTORE',
          'RMW_SECURITY_STRATEGY',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Security',
      },
      {
        promptText:
          'Your control node times out while waiting for transform between odom and map. Which TF2 call lets you poll with a timeout?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'canTransform with timeout argument',
          'lookupTransform without duration',
          'waitForTransform',
          'transformPose',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Transforms',
      },
      {
        promptText:
          'Global costmap should scroll with the robot to limit memory. Which boolean parameter enables that?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'rolling_window',
          'always_send_full_costmap',
          'track_unknown_space',
          'use_maximum',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Navigation',
      },
      {
        promptText:
          "The UGV's mission manager node sends goals to Nav2. What is the action type name?",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'nav2_msgs/action/NavigateToPose',
          'move_base_msgs/MoveBaseAction',
          'geometry_msgs/action/PoseStamped',
          'nav_msgs/action/FollowPath',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Navigation',
      },
      {
        promptText:
          'To pre‑empt an active navigation goal programmatically from C++, call…',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'action_client->async_cancel_goal()',
          "service_client->call('cancel')",
          'publisher->publish(std_msgs::Empty())',
          'rclcpp::shutdown()',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Navigation',
      },
      {
        promptText:
          'You build a custom Nav2 controller plugin. Which macro exports it to pluginlib?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'PLUGINLIB_EXPORT_CLASS(MyController, nav2_core::Controller)',
          'EXPORT_PLUGIN(MyController)',
          'REGISTER_NAV2_PLUGIN(MyController)',
          'NAV2_CONTROLLER_EXPORT(MyController)',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Plugin Development',
      },
      {
        promptText:
          'The hardware interface update() returns an error and stops. The correct return value for success is…',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'hardware_interface::return_type::OK',
          'hardware_interface::return_type::ERROR',
          '0',
          'true',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Hardware Interface',
      },
      {
        promptText:
          'For multi‑robot launch, which LaunchAction cleanly applies a namespace to all included nodes?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'PushRosNamespace',
          'SetLaunchConfiguration',
          'GroupAction without namespace',
          'SetEnvironmentVariable',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Launch System',
      },
      {
        promptText:
          "Your ROS 2 node occasionally logs 'Callback took longer than period'. Increasing which timer constructor parameter might mask the warning?",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'callback period',
          'priority',
          'queue_depth',
          'thread stack size',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Performance Tuning',
      },
      {
        promptText:
          'You want to collect latency statistics on /scan. Which CLI enables topic statistics on the subscriber?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ros2 param set /subscriber enable_statistics true',
          'ros2 topic echo /scan --statistics 1',
          'ros2 topic stats /scan',
          'statistics are publisher‑side only',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Diagnostics & Monitoring',
      },
      {
        promptText:
          'To disable Fast DDS discovery traffic between lab and field robot networks, you set:',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'ROS_LOCALHOST_ONLY=1',
          'RMW_FASTRTPS_USE_QOS_FROM_XML=1',
          'RMW_FASTRTPS_ENABLE_SIMPLE_DISCOVERY=0',
          "ROS_DISCOVERY_SERVER='' (empty)",
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Network Configuration',
      },
    ];

    // Create all questions
    console.log('📝 Creating questions...\n');

    for (let i = 0; i < questions.length; i++) {
      const questionData = questions[i];

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

      console.log(`   ✅ Question ${i + 1}: ${questionData.sectionTag}`);
    }

    console.log(`\n🎉 Successfully created ROS Expert Assessment Test!`);
    console.log(`📊 Summary:`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Total questions: ${questions.length}`);
    console.log(`   ⏱️  Time per question: 30 seconds`);
    console.log(
      `   🕒 Total test time: ${(questions.length * 30) / 60} minutes`
    );
    console.log(`\n🔧 Topics covered:`);
    console.log(`   • ROS Domain Management & Network Configuration`);
    console.log(`   • Navigation (Nav2) and Path Planning`);
    console.log(`   • Lifecycle Nodes and State Management`);
    console.log(`   • QoS Configuration and Performance`);
    console.log(`   • Transforms and TF2 Framework`);
    console.log(`   • Recording, Playback, and Simulation`);
    console.log(`   • Executors, Threading, and Components`);
    console.log(`   • Message Filtering and Synchronization`);
    console.log(`   • Security and Hardware Interfaces`);
    console.log(`   • Launch System and Plugin Development`);
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
  } catch (error) {
    console.error('❌ Error creating ROS test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
