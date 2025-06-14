#!/usr/bin/env node

/**
 * Script to create the C++ Programming Test
 * This script creates a comprehensive C++ test with 30 questions covering various C++ concepts
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating C++ Programming Test...\n');

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
        title: 'C++ Programming Test',
        description:
          'A comprehensive C++ programming assessment covering data structures, algorithms, memory management, STL, and modern C++ features.',
        overallTimeLimitSeconds: 3600, // 60 minutes total
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all 30 C++ questions from the provided table
    const questions = [
      {
        promptText:
          'What is the primary advantage of using std::vector over a raw array for storing underlying data?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::move on a std::vector<uint8_t>',
          'Passing by const reference even if an exception is thrown',
          'std::copy with std::back_inserter',
          'std::memcpy into a new array',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Data Structures',
      },
      {
        promptText: 'What does a port to a motor controller?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'It makes the code compile faster',
          'It speeds up I/O operations',
          'It avoids dynamic memory allocation',
          'It speeds up I/O operations',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'I/O Operations',
      },
      {
        promptText:
          'Which pattern is best for managing shared_ptr<const PointCloud> for mutex overhead?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::shared_ptr<const PointCloud>',
          'std::unique_ptr<PointCloud>',
          'Raw pointer with std::lock_guard',
          'std::weak_ptr<PointCloud> directly',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Memory Management',
      },
      {
        promptText: 'Which approach adds the least overhead?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::recursive_mutex',
          'std::timed_mutex',
          'std::shared_mutex',
          'std::mutex',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Threading',
      },
      {
        promptText: 'Which synchronization mechanism is most appropriate?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Busy-wait loop with sleep_for(1 ms)',
          'std::condition_variable::wait',
          'std::this_thread::yield()',
          'std::atomic spin lock',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Threading',
      },
      {
        promptText: 'What is the simplest modern C++ container is...',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::array<float,64>',
          'std::vector<float>',
          'std::deque<float>',
          'std::list<float>',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Containers',
      },
      {
        promptText: 'What is the safest message. Quickest safe fix?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Make the string atomic',
          'Protect access with a std::mutex',
          'switch to char[]',
          'harmless',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Thread Safety',
      },
      {
        promptText: 'What is the effect of a resize operation?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::optional',
          'std::vector::emplace_back',
          'std::vector::shrink_to_fit',
          'Move constructors',
        ],
        correctAnswerIndex: 3, // D
        sectionTag: 'Containers',
      },
      {
        promptText: 'What are packets?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Vectors are always faster',
          'std::deque memory safely',
          'automatically',
          'Vectors cannot fragment memory',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Memory Management',
      },
      {
        promptText: 'What type of readings?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::chrono::system_clock',
          'std::chrono::steady_clock',
          'std::chrono::high_resolution_clock',
          'time_t from <ctime>',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Time and Clock',
      },
      {
        promptText: 'What is the standard tool?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::thread',
          'std::packaged_task',
          'defined as system',
          'std::packaged_task',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Threading',
      },
      {
        promptText: 'How would you efficiently copy elements into a vector?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'It avoids constructing a temporary Pose object',
          'It locks the vector',
          'It sorts elements',
          'Nothing; they are identical',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Efficiency',
      },
      {
        promptText: 'What makes an interpolation function attractive?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Faster runtime',
          'inlining',
          'Uses less RAM',
          'Improves thread safety automatically',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Performance',
      },
      {
        promptText: 'What is the class?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: ['mutable', 'override', 'delete', 'constexpr'],
        correctAnswerIndex: 2, // C
        sectionTag: 'Class Design',
      },
      {
        promptText:
          'What is the best choice for memory to avoid accidental host access?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'void*',
          'std::unique_ptr<float>',
          'float*',
          'Using thrust::device_vector<float>',
        ],
        correctAnswerIndex: 3, // D
        sectionTag: 'Memory Management',
      },
      {
        promptText:
          'What is the best approach for concurrent reads but exclusive writes?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::mutex',
          'std::shared_mutex',
          'std::recursive_mutex',
          'std::atomic<bool>',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Threading',
      },
      {
        promptText: 'What makes std::vector efficient?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'It copies all elements',
          'constant time',
          'It reallocates memory',
          'It sorts the vector',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Containers',
      },
      {
        promptText: 'What is the GCC/Clang?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          '-fno-exceptions',
          '-fno-rtti',
          '-function-sections',
          '-nostdlib',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Compiler Options',
      },
      {
        promptText: 'What are traditional enums?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'type',
          'Fast switch-case',
          'Uses program memory',
          'Allows arithmetic operators by default',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Enums',
      },
      {
        promptText: 'What is a shutdown?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::memory_order_relaxed',
          'std::memory_order_acquire',
          'std::memory_order_release',
          'std::memory_order_seq_cst',
        ],
        correctAnswerIndex: 3, // D
        sectionTag: 'Memory Ordering',
      },
      {
        promptText: 'What should be expressed how in modern C++?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'const double WHEEL_DIAM = 0.32;',
          'constexpr double WHEEL_DIAM = 0.32;',
          'array allows push_back',
          '#define WHEEL_DIAM 0.32',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Constants',
      },
      {
        promptText: 'What is the best approach for fixed-size 3-D position?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'array uses heap memory',
          'enabling optimisation',
          'vector cannot store floats',
          'None; wrapping with locks is required',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Arrays',
      },
      {
        promptText: 'Why is a container is inherently thread-safe?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::queue',
          'std::queue',
          'std::priority_queue',
          'virtual functions',
        ],
        correctAnswerIndex: 2, // C
        sectionTag: 'Thread Safety',
      },
      {
        promptText: 'What is the ABI?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::variant',
          'constexpr if',
          'dynamic_cast',
          'virtual functions',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Modern C++',
      },
      {
        promptText: 'What is the present?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::shared_ptr',
          'std::unique_ptr',
          'std::weak_ptr',
          'std::optional<std::unique_ptr<>>',
        ],
        correctAnswerIndex: 3, // D
        sectionTag: 'Smart Pointers',
      },
      {
        promptText: 'What is the simple threads mitigation?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Pack them into a struct and alignas(64)',
          'Use volatile',
          'Convert floats to ints',
          'Use bigger cache',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Performance Optimization',
      },
      {
        promptText: 'What is the objects?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'std::instream << operator',
          'std::format (C++20)',
          'ostringstream',
          'Use bigger cache',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'I/O Operations',
      },
      {
        promptText: 'What may hinder debugging?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: ['-O2', '-Og', '-O3', '-Os'],
        correctAnswerIndex: 2, // C
        sectionTag: 'Debugging',
      },
      {
        promptText: 'What is the non-copyable but movable. Minimal code?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'operator=(Sensor&& = default;',
          'functions default',
          'Only declare move constructor',
          'Rely on compiler defaults',
        ],
        correctAnswerIndex: 0, // A
        sectionTag: 'Move Semantics',
      },
      {
        promptText: 'What is the C++ fix?',
        category: 'OTHER',
        timerSeconds: 60,
        answerOptions: [
          'Leave as is',
          'manual delete',
          'Use malloc/free for speed',
          'Add comments explaining why',
        ],
        correctAnswerIndex: 1, // B
        sectionTag: 'Memory Management',
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

      console.log(
        `   ✅ Question ${i + 1}: ${questionData.promptText.substring(0, 50)}...`
      );
    }

    console.log(`\n🎉 Successfully created C++ Programming Test!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(
      `   ⏱️  Time limit: ${test.overallTimeLimitSeconds / 60} minutes`
    );
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
  } catch (error) {
    console.error('❌ Error creating C++ test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
