const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Questions 21-30 formatting...\n');

  try {
    const test = await prisma.test.findFirst({
      where: { title: 'Conversational Aptitude Test for Engineering Roles' },
      include: {
        questions: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!test) {
      throw new Error('Test not found');
    }

    console.log(`✅ Found test: ${test.title}`);
    console.log(`🔧 Fixing questions 21-30...\n`);

    // Define properly formatted questions 21-30 (Logical Reasoning)
    const fixedQuestions = [
      {
        index: 20, // Question 21
        promptText: `**Memory Usage Pattern**

System performance monitoring shows this RAM usage spike sequence:

\`\`\`
4, 9, 25, 49, 121, 169, ?
\`\`\`

What is the next number in the sequence?`,
      },
      {
        index: 21, // Question 22
        promptText: `**Database Query Optimizer**

Query optimization times are recorded in milliseconds:

\`\`\`
2, 5, 11, 23, 47, ?, 191
\`\`\`

What is the missing time?`,
      },
      {
        index: 22, // Question 23
        promptText: `**Server Load Analysis**

If the database server crashes, the application will stop working. The application stopped working.

What can you conclude?`,
      },
      {
        index: 23, // Question 24
        promptText: `**Code Coverage Decision**

To determine if the project is ready for production:
- Statement 1: Test coverage is above 80%
- Statement 2: All critical bugs are fixed

Which statement alone is sufficient to decide if the project is production-ready?`,
      },
      {
        index: 24, // Question 25
        promptText: `**Team Performance Argument**

"Our development team is the most productive because we deliver more features per sprint than any other team in the company."

What assumption does this argument make?`,
      },
      {
        index: 25, // Question 26
        promptText: `**API Response Logic**

Given these conditions:
- If response time > 500ms, then log warning
- If error rate > 5%, then send alert
- If both conditions are true, then escalate to manager

Response time is 600ms and error rate is 3%. What actions are taken?`,
      },
      {
        index: 26, // Question 27
        promptText: `**System Architecture Logic**

All microservices use Docker containers. All Docker containers require orchestration. Some services require load balancing.

If a service requires load balancing, what can you conclude?`,
      },
      {
        index: 27, // Question 28
        promptText: `**Network Topology Logic**

In a network diagram:
- Server A connects to Router B
- Router B connects to Switch C  
- Switch C connects to Server D

If Server A sends data to Server D, what is the minimum number of hops?`,
      },
      {
        index: 28, // Question 29
        promptText: `**Code Deployment Chain**

The deployment process follows this sequence:
1. Code commit triggers build
2. Build success triggers tests
3. Test success triggers staging deployment
4. Staging approval triggers production deployment

If production deployment failed, what definitely happened?`,
      },
      {
        index: 29, // Question 30
        promptText: `**Security Logic Chain**

Security policy states:
- Authentication is required for all API access
- Authorization is required after authentication
- Logging is required for all authorized actions

A user successfully performs an API action. What security steps definitely occurred?`,
      },
    ];

    // Update questions with clean formatting
    for (const fixedQ of fixedQuestions) {
      const question = test.questions[fixedQ.index];
      if (question) {
        await prisma.question.update({
          where: { id: question.id },
          data: {
            promptText: fixedQ.promptText,
          },
        });
        console.log(
          `   ✅ Fixed Question ${fixedQ.index + 1}: Clean logical reasoning format`
        );
      }
    }

    console.log(`\n🎉 Successfully fixed ${fixedQuestions.length} questions!`);
    console.log(`📊 Improvements made:`);
    console.log(`   • Clean pattern sequences`);
    console.log(`   • Logical reasoning without solutions`);
    console.log(`   • Minimal formatting (titles only bold)`);
    console.log(`   • Clear question presentation`);
  } catch (error) {
    console.error('❌ Error fixing questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
