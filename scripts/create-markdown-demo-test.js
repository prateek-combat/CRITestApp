const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating Markdown Demo Test...');

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

    // Create a test to demonstrate markdown capabilities
    const test = await prisma.test.create({
      data: {
        title: 'Markdown Formatting Demo Test',
        description:
          'Demonstrates various markdown formatting options for questions',

        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`Created test: ${test.title} (ID: ${test.id})`);

    // Sample questions with markdown formatting
    const questions = [
      {
        promptText: `# JavaScript Array Methods

Which of the following code snippets correctly filters an array to get only even numbers?

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
\`\`\`

**Requirements:**
- Use the \`filter()\` method
- Return only even numbers
- Maintain original array order`,
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          'numbers.filter(n => n % 2 === 0)',
          'numbers.filter(n => n % 2 === 1)',
          'numbers.map(n => n % 2 === 0)',
          'numbers.reduce((acc, n) => n % 2 === 0 ? [...acc, n] : acc, [])',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'JavaScript Fundamentals',
      },
      {
        promptText: `## Python Data Structures

Consider the following Python code:

\`\`\`python
data = {
    'users': [
        {'name': 'Alice', 'age': 25, 'active': True},
        {'name': 'Bob', 'age': 30, 'active': False},
        {'name': 'Charlie', 'age': 35, 'active': True}
    ]
}
\`\`\`

What will be the output of this code?

\`\`\`python
active_users = [user['name'] for user in data['users'] if user['active']]
print(len(active_users))
\`\`\``,
        category: 'LOGICAL',
        timerSeconds: 45,
        answerOptions: ['2', '3', '1', 'Error - invalid syntax'],
        correctAnswerIndex: 0,
        sectionTag: 'Python Programming',
      },
      {
        promptText: `### SQL Query Analysis

Given the following database schema:

**Table: employees**
| Column | Type | Description |
|--------|------|-------------|
| id | INT | Primary key |
| name | VARCHAR(100) | Employee name |
| department | VARCHAR(50) | Department name |
| salary | DECIMAL(10,2) | Monthly salary |
| hire_date | DATE | Date of hiring |

Which SQL query will find the **average salary** by department for employees hired after 2020?`,
        category: 'LOGICAL',
        timerSeconds: 90,
        answerOptions: [
          `SELECT department, AVG(salary) FROM employees WHERE hire_date > '2020-12-31' GROUP BY department`,
          `SELECT department, SUM(salary) FROM employees WHERE hire_date > '2020-12-31' GROUP BY department`,
          `SELECT AVG(salary) FROM employees WHERE hire_date > '2020-12-31'`,
          `SELECT department, AVG(salary) FROM employees GROUP BY department HAVING hire_date > '2020-12-31'`,
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Database Queries',
      },
    ];

    // Add questions to the test
    for (let i = 0; i < questions.length; i++) {
      const questionData = {
        ...questions[i],
        testId: test.id,
      };

      const question = await prisma.question.create({
        data: questionData,
      });

      console.log(
        `Added question ${i + 1}: ${question.promptText.substring(0, 50)}...`
      );
    }

    console.log(
      `\n✅ Successfully created test with ${questions.length} markdown-formatted questions!`
    );
    console.log(`Test ID: ${test.id}`);
    console.log(`\n🎯 This test demonstrates:`);
    console.log(`   • Code syntax highlighting`);
    console.log(`   • Tables and structured data`);
    console.log(`   • Headers and formatting`);
    console.log(`   • Lists and bullet points`);
    console.log(`   • Bold and italic text`);
  } catch (error) {
    console.error('Error creating test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
