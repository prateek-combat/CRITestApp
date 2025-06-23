const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Questions 31-40 formatting...\n');

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
    console.log(`🔧 Fixing questions 31-40...\n`);

    // Define properly formatted questions 31-40 (Numerical Reasoning)
    const fixedQuestions = [
      {
        index: 30, // Question 31
        promptText: `**Sprint Velocity Analysis**

Review the sprint performance data:

| Month | Story Points | Team Size | Bugs Found |
|-------|--------------|-----------|------------|
| Jan   | 80          | 5         | 12         |
| Feb   | 96          | 6         | 15         |
| Mar   | 105         | 6         | 14         |
| Apr   | 84          | 7         | 18         |
| May   | 91          | 7         | 16         |
| Jun   | 108         | 8         | 20         |

What was the average story points per team member in Q1 (Jan-Mar)?`,
      },
      {
        index: 31, // Question 32
        promptText: `**Server Resource Allocation**

Current server setup has 480GB RAM total with this allocation:
- Production Servers: 35%
- Development Servers: 25%
- Testing Servers: 20%
- Staging Servers: 15%
- Backup Servers: 5%

If Testing servers are increased by 48GB, what will be the new percentage for Testing servers?`,
      },
      {
        index: 32, // Question 33
        promptText: `**Code Coverage Analysis**

Codebase analysis shows:
- Total lines of code: 12,000
- Unit tests cover: 4,800 lines
- Integration tests cover: 3,600 lines
- Both types cover: 2,400 lines (overlap)

What percentage of code remains untested?`,
      },
      {
        index: 33, // Question 34
        promptText: `**Cloud Cost Analysis**

Q1 cloud costs and budget status:

| Month    | Actual Cost | Budget Status    |
|----------|-------------|------------------|
| January  | $24,000     | 20% over budget  |
| February | $22,000     | 10% over budget  |
| March    | $19,000     | 5% under budget  |

What was the total Q1 budget?`,
      },
      {
        index: 34, // Question 35
        promptText: `**User Growth Projection**

Monthly Active Users (MAU) growth pattern:
- Month 1: 10,000 MAU
- Month 2: 12,000 MAU (20% growth)
- Month 3: 14,400 MAU (20% growth)

Following this 20% monthly growth pattern, what's the expected MAU in Month 5?`,
      },
      {
        index: 35, // Question 36
        promptText: `**Bug Count Analysis**

Monthly bug counts:
- Jan: 40 bugs
- Feb: 30 bugs
- Mar: 60 bugs
- Apr: 20 bugs

What percentage of Q1 bugs (Jan-Mar) were found in March?`,
      },
      {
        index: 36, // Question 37
        promptText: `**Deployment Rate Calculation**

Current deployment performance: 5 deployments completed in 2 hours.

At this rate, how many deployments can be completed in 8 hours?`,
      },
      {
        index: 37, // Question 38
        promptText: `**User Journey Conversion**

E-commerce conversion funnel:
- Homepage: 1,000 users
- Product Page: 600 users
- Cart: 400 users
- Checkout: 300 users
- Purchase: 250 users

What is the cart abandonment rate (users who added to cart but didn't proceed to checkout)?`,
      },
      {
        index: 38, // Question 39
        promptText: `**CI/CD Pipeline Success Rate**

Weekly pipeline data:
- Commits: 1,000
- Build Stage: 900
- Unit Tests: 850
- Integration Tests: 750
- Staging: 700
- Production: 600

What percentage of commits that pass unit tests eventually reach production?`,
      },
      {
        index: 39, // Question 40
        promptText: `**API Request Distribution**

Global load balancer distributes 10,000 requests/minute:
- US-East: 4,000 requests → 800 database hits, 50 timeouts
- EU-West: 3,500 requests → 700 database hits, 20 timeouts
- APAC: 2,500 requests → 750 database hits, 50 timeouts

Which region has the highest database timeout rate?`,
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
          `   ✅ Fixed Question ${fixedQ.index + 1}: Clean numerical format`
        );
      }
    }

    console.log(`\n🎉 Successfully fixed ${fixedQuestions.length} questions!`);
    console.log(`📊 Improvements made:`);
    console.log(`   • Clean table layouts`);
    console.log(`   • Numerical data without calculations shown`);
    console.log(`   • Clear question presentation`);
    console.log(`   • No excessive formatting`);
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
