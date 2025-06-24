#!/usr/bin/env node

/**
 * Script to create the C++ Robotics Programming Test
 * This script populates the database with 30 robotics-focused C++ questions.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating C++ Robotics Programming Test with 30 questions...\n'
  );

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

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

    const testTitle = 'C++ Programming Test';

    console.log(`🗑️ Deleting existing '${testTitle}'...`);
    await prisma.test.deleteMany({ where: { title: testTitle } });
    console.log('✅ Existing test deleted');

    const test = await prisma.test.create({
      data: {
        title: testTitle,
        description:
          'A comprehensive test of C++ knowledge for robotics applications, covering modern C++, performance, memory management, and robotics-specific scenarios.',
        createdById: adminUser.id,
      },
    });
    console.log(`✅ Test created: ${test.title} (ID: ${test.id})\n`);

    const questions = [
      {
        promptText:
          "**Your robot's camera driver creates a large image buffer each frame. Which C++ feature helps you move this buffer to a processing thread without copying the underlying data?**",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::move` on a `std::vector<uint8_t>`',
          'Passing by `const` reference',
          '`std::copy` with `std::back_inserter`',
          '`std::memcpy` into a new array',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Why is RAII useful when you open a serial port to a motor controller?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'It makes the code compile faster',
          'It guarantees the port closes even if an exception is thrown',
          'It avoids dynamic memory',
          'It speeds up I/O operations',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**In your lidar node you share point-cloud data with multiple modules. Which smart pointer fits a read-only, many-readers pattern?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::shared_ptr<const PointCloud>`',
          '`std::unique_ptr<PointCloud>`',
          'Raw pointer',
          '`std::weak_ptr<PointCloud>` directly',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A 1 kHz control loop must lock and unlock a mutex on every cycle. Which lock type adds the least overhead?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::recursive_mutex`',
          '`std::timed_mutex`',
          '`std::mutex` with `std::lock_guard`',
          '`std::shared_mutex`',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**You need to wake a logger thread only when new IMU data arrives. Which waiting mechanism is most appropriate?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Busy-wait loop with `sleep_for(1 ms)`',
          '`std::condition_variable::wait`',
          '`std::this_thread::yield()`',
          '`std::atomic` spin loop',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A ring buffer for wheel speeds stores exactly 64 samples and never grows. The simplest modern C++ container is…**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::array<float,64>`',
          '`std::vector<float>`',
          '`std::deque<float>`',
          '`std::list<float>`',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**While debugging, you see occasional data races on a shared `std::string` status message. Quickest safe fix?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Make the string atomic',
          'Protect access with a `std::mutex`',
          'Switch to `char[]`',
          'Ignore; data races on strings are harmless',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Jetson heavy CPU usage comes from copying images between `std::vector`s. Which C++17 feature can avoid the copy in a resize operation?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::optional`',
          '`std::vector::emplace_back`',
          '`std::vector::shrink_to_fit`',
          'Move constructors',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Why might `std::vector` be preferred over a raw array for variable-length sensor packets?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Vectors are always faster',
          'Vectors handle dynamic resizing and manage memory safely',
          'Vectors prevent segmentation faults automatically',
          'Vectors cannot fragment memory',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A real-time task reads encoder counts. Which clock should you use to time-stamp readings?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::chrono::system_clock`',
          '`std::chrono::steady_clock`',
          '`std::chrono::high_resolution_clock` if defined as system',
          '`time_t` from `<ctime>`',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**You have a compute-intensive loop that can run on another core while the main thread handles ROS callbacks. Easiest standard tool?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::thread`',
          '`std::async` with `std::launch::async`',
          '`std::packaged_task`',
          'OpenMP pragma',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**What does `emplace_back` provide over `push_back` when adding a Pose struct into a vector?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'It avoids constructing a temporary Pose object',
          'It locks the vector',
          'It sorts elements',
          'Nothing; they are identical',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**In a shared library used by multiple robot nodes, why is a header-only template interpolation function attractive?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Faster runtime',
          'Avoids linking errors and enables inlining',
          'Uses less RAM',
          'Improves thread safety automatically',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Which C++11 keyword prevents unintentional copying of a LaserScanner class?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: ['`mutable`', '`override`', '`delete`', '`constexpr`'],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**When interfacing CUDA kernels from C++, which pointer type best represents device memory to avoid accidental host access?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`void*`',
          '`std::unique_ptr<float>`',
          '`float*`',
          'Using `thrust::device_vector<float>`',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A timer callback modifies a global parameter while another thread reads it. Best synchronization primitive to allow concurrent reads but exclusive writes?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::mutex`',
          '`std::shared_mutex`',
          '`std::recursive_mutex`',
          '`std::atomic<bool>`',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Why is `std::swap` specialised for `std::vector` efficient?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'It copies all elements',
          'It exchanges internal pointers in constant time',
          'It reallocates memory',
          'It sorts the vector',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**In embedded builds without exceptions, what compile flag disables them for GCC/Clang?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`-fno-exceptions`',
          '`-fno-rtti`',
          '`-ffunction-sections`',
          '`-nostdlib`',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**The robot arm firmware uses `enum class` for state. Biggest advantage over traditional enums?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Scoped to avoid name collisions and strict underlying type',
          'Faster switch-case',
          'Uses less program memory',
          'Allows arithmetic operators by default',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Which memory order is safest default for atomic flag used to stop all threads before shutdown?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::memory_order_relaxed`',
          '`std::memory_order_acquire`',
          '`std::memory_order_release`',
          '`std::memory_order_seq_cst`',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A compile-time constant for wheel diameter should be expressed how in modern C++?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`const double WHEEL_DIAM = 0.32;`',
          '`static double const WHEEL_DIAM = 0.32;`',
          '`constexpr double WHEEL_DIAM = 0.32;`',
          '`#define WHEEL_DIAM 0.32`',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Why choose `std::array` over `std::vector` for fixed-size 3-D position?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`array` uses heap memory',
          '`array` size known at compile time enabling optimisation',
          '`array` allows `push_back`',
          '`vector` cannot store floats',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Your CAN bus handler pushes frames into a queue used by both CPU cores. Which STL container is inherently thread-safe?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::queue`',
          '`std::deque`',
          'None; wrapping with locks is required',
          '`std::priority_queue`',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Template metaprogramming can remove branches in control code at compile time via?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::variant`',
          '`constexpr if`',
          '`dynamic_cast`',
          'Virtual functions',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**Which pointer type expresses nullable ownership of a dynamically allocated object like a planner that may or may not be present?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::shared_ptr`',
          '`std::unique_ptr`',
          '`std::weak_ptr`',
          '`std::optional<std::unique_ptr<>>`',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**You observe false sharing on two adjacent float variables updated by different threads. Simple mitigation?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Pack them into a struct and `alignas(64)`',
          'Use `volatile`',
          'Convert floats to ints',
          'Use bigger cache',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A high-frequency logger writes CSV lines to SD card. Which standard facility can format lines without creating temporary `std::string` objects?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`std::ofstream << operator`',
          '`std::format` (C++20)',
          '`printf`',
          '`ostringstream`',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**When building ROS 2 Foxy with GCC 9 in Release, which flag maximises speed but may hinder debugging?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: ['`-O2`', '`-Og`', '`-O3`', '`-Os`'],
        correctAnswerIndex: 2,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**A sensor interface class needs to be non-copyable but movable. Minimal code?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          '`Sensor(const Sensor&) = delete; Sensor& operator=(const Sensor&) = delete; Sensor(Sensor&&) = default; Sensor& operator=(Sensor&&) = default;`',
          'Declare all 4 special member functions default',
          'Only declare move constructor',
          'Rely on compiler defaults',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Robotics C++',
      },
      {
        promptText:
          '**During code review you spot `new` and `delete` in a control loop. Preferred modern C++ fix?**',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Leave as is',
          'Replace with `std::make_unique` or stack objects to remove manual delete',
          'Use `malloc`/`free` for speed',
          'Add comments explaining why',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Robotics C++',
      },
    ];

    console.log('📝 Creating 30 questions...');
    for (const [index, q] of questions.entries()) {
      await prisma.question.create({
        data: {
          promptText: q.promptText,
          category: q.category,
          timerSeconds: q.timerSeconds,
          answerOptions: q.answerOptions,
          correctAnswerIndex: q.correctAnswerIndex,
          sectionTag: q.sectionTag,
          testId: test.id,
        },
      });
      console.log(`   ✅ Question ${index + 1}: ${q.sectionTag}`);
    }

    console.log(
      `\n🎉 Successfully created C++ Programming Test with 30 questions!`
    );
    console.log(`   📊 Questions: ${questions.length}`);
    console.log(
      `   ⏰ Time per question: ${questions[0].timerSeconds} seconds`
    );
  } catch (error) {
    console.error('❌ Error creating test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
