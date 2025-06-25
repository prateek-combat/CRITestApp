const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting test data seeding...');

  try {
    await prisma.$connect();
    console.log('✅ Database connection established');

    // First, get or create an admin user
    let adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN',
      },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          passwordHash: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Created admin user');
    } else {
      console.log('✅ Using existing admin user');
    }

    // Create sample tests with questions
    const tests = [
      {
        title: 'JavaScript Fundamentals',
        description:
          'Test your knowledge of JavaScript basics including variables, functions, and control flow.',
        questions: [
          {
            text: 'What is the correct way to declare a constant in JavaScript?',
            options: [
              'var x = 5;',
              'let x = 5;',
              'const x = 5;',
              'constant x = 5;',
            ],
            correctAnswerIndex: 2,
            explanation:
              'The const keyword is used to declare constants in JavaScript.',
            points: 10,
            timeLimit: 30,
          },
          {
            text: 'Which of the following is NOT a primitive data type in JavaScript?',
            options: ['String', 'Number', 'Array', 'Boolean'],
            correctAnswerIndex: 2,
            explanation: 'Array is an object type, not a primitive data type.',
            points: 10,
            timeLimit: 30,
          },
          {
            text: 'What will console.log(typeof null) output?',
            options: ['null', 'undefined', 'object', 'number'],
            correctAnswerIndex: 2,
            explanation:
              'Due to a historical bug in JavaScript, typeof null returns "object".',
            points: 15,
            timeLimit: 45,
          },
        ],
      },
      {
        title: 'React Basics',
        description:
          'Assess your understanding of React fundamentals, components, and hooks.',
        questions: [
          {
            text: 'Which hook is used to manage state in a functional component?',
            options: ['useEffect', 'useState', 'useContext', 'useReducer'],
            correctAnswerIndex: 1,
            explanation:
              'useState is the primary hook for managing state in functional components.',
            points: 10,
            timeLimit: 30,
          },
          {
            text: 'What is the purpose of the key prop in React lists?',
            options: [
              'To style list items',
              'To help React identify which items have changed',
              'To set the order of items',
              'To validate list data',
            ],
            correctAnswerIndex: 1,
            explanation:
              'Keys help React identify which items in a list have changed, been added, or removed.',
            points: 10,
            timeLimit: 30,
          },
        ],
      },
      {
        title: 'Node.js Essentials',
        description:
          'Test your knowledge of Node.js runtime, modules, and async programming.',
        questions: [
          {
            text: 'Which module is used to work with file system in Node.js?',
            options: ['http', 'fs', 'path', 'os'],
            correctAnswerIndex: 1,
            explanation:
              'The fs (file system) module provides an API for interacting with the file system.',
            points: 10,
            timeLimit: 30,
          },
          {
            text: 'What is the purpose of package.json in a Node.js project?',
            options: [
              'To store environment variables',
              'To define project metadata and dependencies',
              'To configure the Node.js runtime',
              'To store API keys',
            ],
            correctAnswerIndex: 1,
            explanation:
              'package.json holds various metadata relevant to the project and manages dependencies.',
            points: 10,
            timeLimit: 30,
          },
        ],
      },
    ];

    // Create tests with questions
    for (const testData of tests) {
      const { questions, ...testInfo } = testData;

      const test = await prisma.test.create({
        data: {
          ...testInfo,
          createdById: adminUser.id,
          questions: {
            create: questions.map((q) => ({
              promptText: q.text,
              answerOptions: q.options,
              timerSeconds: q.timeLimit,
              category: 'OTHER',
              correctAnswerIndex: q.correctAnswerIndex,
            })),
          },
        },
        include: {
          questions: true,
        },
      });

      console.log(
        `✅ Created test: ${test.title} with ${test.questions.length} questions`
      );
    }

    // Count total tests and questions
    const testCount = await prisma.test.count();
    const questionCount = await prisma.question.count();

    console.log(`\n📊 Summary:`);
    console.log(`   - Total tests: ${testCount}`);
    console.log(`   - Total questions: ${questionCount}`);
    console.log('\n🎉 Test data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during test data seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
