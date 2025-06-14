#!/usr/bin/env node

/**
 * Script to create an improved C++ Programming Test with HTML formatting
 * This script creates comprehensive C++ questions with proper HTML formatting for better readability
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating Improved C++ Programming Test with HTML formatting...\n'
  );

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
          passwordHash: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Delete existing C++ test if it exists
    const existingTest = await prisma.test.findFirst({
      where: { title: 'C++ Programming Test' },
    });

    if (existingTest) {
      console.log('🗑️ Deleting existing C++ Programming Test...');
      await prisma.test.delete({
        where: { id: existingTest.id },
      });
      console.log('✅ Existing test deleted');
    }

    // Create the improved test
    const test = await prisma.test.create({
      data: {
        title: 'C++ Programming Test',
        description:
          'A comprehensive C++ programming assessment covering modern C++ features, STL, memory management, threading, and best practices.',
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

    // Define comprehensive C++ questions with HTML formatting
    const questions = [
      // STL Containers (5 questions)
      {
        promptText: `<h3>STL Vector vs Array</h3>
<p>Consider the following code snippet:</p>
<pre><code>std::vector&lt;int&gt; vec = {1, 2, 3, 4, 5};
int arr[] = {1, 2, 3, 4, 5};

// Adding a new element
vec.push_back(6);
// arr[5] = 6; // This would be unsafe</code></pre>
<p><strong>What is the primary advantage of using <code>std::vector</code> over a raw array?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<strong>Dynamic resizing and automatic memory management</strong>',
          'Faster access to elements',
          'Less memory usage',
          'Better cache performance',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'STL Containers',
      },
      {
        promptText: `<h3>Container Selection</h3>
<p>You need to store 64 floating-point values that represent sensor readings. The size is fixed and known at compile time.</p>
<p><strong>Which container is most appropriate for this use case?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::array&lt;float, 64&gt;</code>',
          '<code>std::vector&lt;float&gt;</code>',
          '<code>std::deque&lt;float&gt;</code>',
          '<code>std::list&lt;float&gt;</code>',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'STL Containers',
      },
      {
        promptText: `<h3>Vector Operations</h3>
<p>Consider this code:</p>
<pre><code>std::vector&lt;Pose&gt; poses;
poses.reserve(1000);

// Option A
poses.push_back(Pose(x, y, z));

// Option B  
poses.emplace_back(x, y, z);</code></pre>
<p><strong>What is the advantage of using <code>emplace_back</code> over <code>push_back</code>?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<strong>It avoids constructing a temporary Pose object</strong>',
          'It provides thread safety',
          'It automatically sorts the vector',
          'It uses less memory',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'STL Containers',
      },
      {
        promptText: `<h3>Deque vs Vector</h3>
<p>You're implementing a packet buffer where you frequently add packets to the back and remove them from the front.</p>
<p><strong>Why would <code>std::deque</code> be better than <code>std::vector</code> for this use case?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Vectors are always faster',
          '<strong><code>std::deque</code> provides efficient insertion/deletion at both ends</strong>',
          'Deque uses less memory',
          'Vectors cannot store packets',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'STL Containers',
      },
      {
        promptText: `<h3>Vector Memory Management</h3>
<p>Consider this scenario:</p>
<pre><code>std::vector&lt;int&gt; vec;
vec.reserve(1000);
for(int i = 0; i &lt; 500; ++i) {
    vec.push_back(i);
}
// vec now has 500 elements but capacity of 1000</code></pre>
<p><strong>What happens when you call <code>vec.shrink_to_fit()</code>?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          "Nothing, it's not a valid operation",
          '<strong>It reduces capacity to match the current size</strong>',
          'It clears all elements',
          'It doubles the capacity',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'STL Containers',
      },

      // Smart Pointers (5 questions)
      {
        promptText: `<h3>Smart Pointer Selection</h3>
<p>You're designing a scene graph where nodes can have multiple parent nodes pointing to them.</p>
<p><strong>Which smart pointer is most appropriate for managing the shared ownership?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::unique_ptr</code>',
          '<strong><code>std::shared_ptr</code></strong>',
          '<code>std::weak_ptr</code>',
          'Raw pointer',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Smart Pointers',
      },
      {
        promptText: `<h3>Unique Pointer</h3>
<p>Consider this code:</p>
<pre><code>std::unique_ptr&lt;Device&gt; createDevice() {
    return std::make_unique&lt;Device&gt;("sensor");
}

auto device = createDevice();
// auto device2 = device; // This won't compile</code></pre>
<p><strong>How do you transfer ownership of the device to another unique_ptr?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>auto device2 = device.copy();</code>',
          '<strong><code>auto device2 = std::move(device);</code></strong>',
          '<code>auto device2 = device.get();</code>',
          '<code>auto device2 = &device;</code>',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Smart Pointers',
      },
      {
        promptText: `<h3>Weak Pointer Usage</h3>
<p>You have a parent-child relationship where children need to reference their parent, but you want to avoid circular references.</p>
<p><strong>What's the best approach?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Parent holds <code>shared_ptr</code> to children, children hold <code>shared_ptr</code> to parent',
          '<strong>Parent holds <code>shared_ptr</code> to children, children hold <code>weak_ptr</code> to parent</strong>',
          'Use raw pointers for everything',
          'Parent holds <code>weak_ptr</code> to children, children hold <code>shared_ptr</code> to parent',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Smart Pointers',
      },
      {
        promptText: `<h3>CUDA Memory Management</h3>
<p>You're working with CUDA and need to manage device memory to avoid accidental host access.</p>
<p><strong>What's the best choice for type-safe device memory management?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>void*</code> with manual casting',
          '<code>std::unique_ptr&lt;float&gt;</code>',
          'Raw <code>float*</code> pointer',
          '<strong><code>thrust::device_vector&lt;float&gt;</code></strong>',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Smart Pointers',
      },
      {
        promptText: `<h3>Optional Values</h3>
<p>You have a function that may or may not return a valid result:</p>
<pre><code>??? findDevice(const std::string& name) {
    // May not find the device
    if (device_found) {
        return std::make_unique&lt;Device&gt;(name);
    }
    return ???; // What to return when not found?
}</code></pre>
<p><strong>What's the best modern C++ approach for representing optional values?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Return <code>nullptr</code>',
          'Throw an exception',
          '<strong><code>std::optional&lt;std::unique_ptr&lt;Device&gt;&gt;</code></strong>',
          'Return a boolean flag separately',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Smart Pointers',
      },

      // Threading and Synchronization (5 questions)
      {
        promptText: `<h3>Mutex Selection</h3>
<p>You have a data structure that needs to support multiple concurrent readers but exclusive writers.</p>
<p><strong>Which synchronization primitive is most appropriate?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::mutex</code>',
          '<strong><code>std::shared_mutex</code></strong>',
          '<code>std::recursive_mutex</code>',
          '<code>std::atomic&lt;bool&gt;</code>',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Threading',
      },
      {
        promptText: `<h3>Thread Synchronization</h3>
<p>A worker thread needs to wait for data to become available before processing it.</p>
<p><strong>Which synchronization mechanism is most appropriate?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Busy-wait loop with <code>std::this_thread::sleep_for(1ms)</code>',
          '<strong><code>std::condition_variable</code> with <code>std::unique_lock</code></strong>',
          '<code>std::this_thread::yield()</code> in a loop',
          '<code>std::atomic</code> spin lock',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Threading',
      },
      {
        promptText: `<h3>Thread-Safe String Access</h3>
<p>Multiple threads are accessing a shared std::string for reading and writing.</p>
<p><strong>What's the quickest safe fix for thread safety?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Make the string <code>std::atomic&lt;std::string&gt;</code>',
          '<strong>Protect access with a <code>std::mutex</code></strong>',
          'Switch to <code>char[]</code> array',
          "It's already thread-safe",
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Threading',
      },
      {
        promptText: `<h3>Atomic Operations</h3>
<p>You need to implement a shutdown flag that can be safely accessed by multiple threads.</p>
<p><strong>Which memory ordering provides the strongest guarantees for a shutdown flag?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'std::memory_order_relaxed',
          'std::memory_order_acquire',
          'std::memory_order_release',
          'std::memory_order_seq_cst',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Threading',
      },
      {
        promptText: `<h3>Async Task Execution</h3>
<p>You want to execute a function asynchronously and get the result later.</p>
<p><strong>What's the standard C++ approach for this?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'std::thread with global variables',
          'std::async with std::future',
          'Manual thread creation',
          'std::packaged_task only',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Threading',
      },

      // Modern C++ Features (5 questions)
      {
        promptText: `<h3>Compile-Time Constants</h3>
<p>You need to define a wheel diameter constant that can be used in template parameters and compile-time calculations.</p>
<p><strong>How should this be expressed in modern C++?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'const double WHEEL_DIAM = 0.32;',
          'constexpr double WHEEL_DIAM = 0.32;',
          '#define WHEEL_DIAM 0.32',
          'static const double WHEEL_DIAM = 0.32;',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Modern C++',
      },
      {
        promptText: `<h3>Conditional Compilation</h3>
<p>You want to conditionally compile different code paths based on template parameters without affecting the ABI.</p>
<p><strong>Which C++17 feature is best for this?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'std::variant',
          'constexpr if',
          'dynamic_cast',
          'virtual functions',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Modern C++',
      },
      {
        promptText: `<h3>Move Semantics</h3>
<p>You want to make a class non-copyable but movable with minimal code.</p>
<pre><code>class Sensor {
public:
    // What should go here?
};</code></pre>
<p><strong>What's the minimal approach?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Sensor(const Sensor&) = delete; Sensor& operator=(const Sensor&) = delete;',
          'Sensor(Sensor&&) = default; Sensor& operator=(Sensor&&) = default;',
          'Only declare move constructor and assignment',
          'Rely on compiler defaults',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Modern C++',
      },
      {
        promptText: `<h3>Enum Classes</h3>
<p>Compare traditional enums vs scoped enums:</p>
<pre><code>enum Color { RED, GREEN, BLUE };           // Traditional
enum class State { IDLE, RUNNING, ERROR }; // Scoped</code></pre>
<p><strong>What's a key advantage of scoped enums (enum class)?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Better type safety and no implicit conversions',
          'Faster switch-case performance',
          'Uses less memory',
          'Allows arithmetic operators by default',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Modern C++',
      },
      {
        promptText: `<h3>String Formatting</h3>
<p>You need to format output strings efficiently in modern C++.</p>
<p><strong>Which approach is recommended for C++20 and later?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::stringstream</code> with <code>&lt;&lt;</code> operator',
          '<strong><code>std::format</code> (C++20)</strong>',
          '<code>sprintf</code> with char arrays',
          'String concatenation with <code>+</code>',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Modern C++',
      },

      // Performance and Optimization (5 questions)
      {
        promptText: `<h3>Function Inlining</h3>
<p>You have a small interpolation function called frequently in a tight loop.</p>
<p><strong>What makes this function attractive for compiler optimization?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Using virtual functions',
          '<strong>Marking it <code>inline</code> or <code>constexpr</code> for inlining</strong>',
          'Making it a template',
          'Using function pointers',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Performance',
      },
      {
        promptText: `<h3>Cache Performance</h3>
<p>You have multiple float variables accessed by different threads, causing false sharing.</p>
<p><strong>What's a simple mitigation strategy?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<strong>Pack them into a struct and use <code>alignas(64)</code></strong>',
          'Use <code>volatile</code> keyword',
          'Convert floats to integers',
          'Use a bigger cache',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Performance',
      },
      {
        promptText: `<h3>Compiler Optimization</h3>
<p>You're debugging a release build and finding it difficult to step through code.</p>
<p><strong>Which optimization level may hinder debugging the most?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>-O2</code> (standard optimization)',
          '<code>-Og</code> (optimize for debugging)',
          '<strong><code>-O3</code> (aggressive optimization)</strong>',
          '<code>-Os</code> (optimize for size)',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Performance',
      },
      {
        promptText: `<h3>Exception Handling</h3>
<p>You're working on an embedded system where exceptions are disabled for performance.</p>
<p><strong>Which GCC/Clang flag disables exception handling?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<strong><code>-fno-exceptions</code></strong>',
          '<code>-fno-rtti</code>',
          '<code>-ffunction-sections</code>',
          '<code>-nostdlib</code>',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Performance',
      },
      {
        promptText: `<h3>Time Measurement</h3>
<p>You need to measure elapsed time for performance profiling in a way that's not affected by system clock changes.</p>
<p><strong>Which clock type should you use?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::chrono::system_clock</code>',
          '<strong><code>std::chrono::steady_clock</code></strong>',
          '<code>std::chrono::high_resolution_clock</code>',
          '<code>time_t</code> from <code>&lt;ctime&gt;</code>',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Performance',
      },

      // Memory Management (5 questions)
      {
        promptText: `<h3>Memory Allocation</h3>
<p>Consider this code with a potential memory leak:</p>
<pre><code>void processData() {
    int* data = new int[1000];
    // ... processing ...
    if (error_condition) {
        return; // Oops! Memory leak
    }
    delete[] data;
}</code></pre>
<p><strong>What's the best C++ fix?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Add try-catch blocks',
          '<strong>Use <code>std::unique_ptr&lt;int[]&gt;</code> or <code>std::vector&lt;int&gt;</code></strong>',
          'Use <code>malloc</code>/<code>free</code> instead',
          'Add more <code>delete[]</code> statements',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Memory Management',
      },
      {
        promptText: `<h3>RAII Principle</h3>
<p>You're managing a file handle that must be closed when done.</p>
<p><strong>Which approach best follows RAII (Resource Acquisition Is Initialization)?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Manual <code>fopen()</code> and <code>fclose()</code> calls',
          '<strong><code>std::ifstream</code>/<code>std::ofstream</code> objects</strong>',
          'Global file handles',
          'Static file pointers',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Memory Management',
      },
      {
        promptText: `<h3>Stack vs Heap</h3>
<p>You need to store a 3D position (x, y, z) with a fixed size known at compile time.</p>
<p><strong>What's the advantage of std::array&lt;float, 3&gt; over std::vector&lt;float&gt;?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'Vector uses heap memory, array uses stack',
          '<strong>Array enables better compiler optimizations</strong>',
          'Vector cannot store exactly 3 floats',
          'Array provides thread safety',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Memory Management',
      },
      {
        promptText: `<h3>Move Semantics Benefits</h3>
<p>Consider moving a large std::vector:</p>
<pre><code>std::vector&lt;uint8_t&gt; large_data(1000000);
std::vector&lt;uint8_t&gt; moved_data = std::move(large_data);</code></pre>
<p><strong>What's the primary benefit of std::move here?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          'It copies the data faster',
          '<strong>It avoids copying 1 million bytes</strong>',
          'It compresses the data',
          'It validates the data',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Memory Management',
      },
      {
        promptText: `<h3>Custom Deleters</h3>
<p>You're interfacing with a C library that requires special cleanup:</p>
<pre><code>// C library functions
Device* create_device();
void destroy_device(Device* dev);</code></pre>
<p><strong>How do you properly wrap this in a smart pointer?</strong></p>`,
        category: 'OTHER',
        timerSeconds: 90,
        answerOptions: [
          '<code>std::unique_ptr&lt;Device&gt; ptr(create_device());</code>',
          '<strong><code>std::unique_ptr&lt;Device, decltype(&destroy_device)&gt; ptr(create_device(), destroy_device);</code></strong>',
          '<code>std::shared_ptr&lt;Device&gt; ptr(create_device());</code>',
          'Use raw pointers only',
        ],
        correctAnswerIndex: 1,
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

      console.log(`   ✅ Question ${i + 1}: ${questionData.sectionTag}`);
    }

    console.log(`\n🎉 Successfully created improved C++ Programming Test!`);
    console.log(`   📊 Total questions: ${questions.length}`);
    console.log(`   🆔 Test ID: ${test.id}`);
    console.log(
      `   ⏱️  Time limit: ${test.overallTimeLimitSeconds / 60} minutes`
    );
    console.log(`\n💡 Features:`);
    console.log(`   🎨 HTML formatted questions with syntax highlighting`);
    console.log(`   📱 Optimized for single-page display`);
    console.log(
      `   🔧 Covers: STL, Smart Pointers, Threading, Modern C++, Performance`
    );
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
  } catch (error) {
    console.error('❌ Error creating improved C++ test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
