const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Questions 1-10 formatting...\n');

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
    console.log(`🔧 Fixing first 10 questions...\n`);

    // Define properly formatted questions 1-10 (Verbal Reasoning)
    const fixedQuestions = [
      {
        index: 0, // Question 1
        promptText: `**Team Lead's Email Analysis**

You receive this email from your team lead:

"Hi Team, I hope you're doing well. I wanted to touch base regarding the upcoming sprint planning. As you know, we've been working on the new feature implementation, and I believe we're making good progress. However, I've noticed some concerns that need to be addressed before we move forward. The current timeline might be a bit ambitious given the complexity of the integration with the legacy system. I think we should consider adjusting our approach or extending the deadline. What are your thoughts on this? Let me know your availability for a quick discussion tomorrow."

What is the primary concern expressed by the team lead?`,
      },
      {
        index: 1, // Question 2
        promptText: `**Client Requirements Email**

A client sends this message:

"Hello, I wanted to follow up on our previous conversation about the project deliverables. While I appreciate the technical expertise your team has demonstrated, I have some reservations about the current direction. The solution you've proposed seems overly complex for our needs, and I'm concerned about the long-term maintenance requirements. Additionally, the budget allocation you've outlined exceeds what we initially discussed. I think we need to revisit our approach and find a more streamlined solution that aligns with our budget constraints. Can we schedule a meeting to discuss alternative approaches?"

What is the client's main request?`,
      },
      {
        index: 2, // Question 3
        promptText: `**Project Status Update**

Your project manager sends:

"Team Update: I wanted to provide you with a quick status update on our current projects. The Alpha project is progressing well and should be completed by the end of this week. However, the Beta project has encountered some unexpected challenges with the third-party API integration. The vendor has informed us of a delay in their system update, which will impact our timeline. I've already reached out to the client to discuss potential solutions and timeline adjustments. For now, let's focus our resources on completing the Alpha project and preparing contingency plans for Beta. Please let me know if you have any questions or concerns."

What action is the project manager taking regarding the Beta project?`,
      },
      {
        index: 3, // Question 4
        promptText: `**Performance Review Discussion**

Your supervisor writes:

"I've been reviewing your recent work, and I'm impressed with the quality and attention to detail you've shown. Your contributions to the recent project were particularly noteworthy, especially your innovative approach to solving the database optimization challenge. However, I've noticed that you tend to work in isolation and rarely participate in team discussions during our weekly meetings. While your technical skills are excellent, I believe you could benefit from more collaboration with your colleagues. This would not only help the team but also provide you with different perspectives that could enhance your problem-solving abilities."

What improvement area is the supervisor suggesting?`,
      },
      {
        index: 4, // Question 5
        promptText: `**Software Development Analogy**

Complete this analogy:

**Database** is to **Data Storage** as **API** is to ______?`,
      },
      {
        index: 5, // Question 6
        promptText: `**Engineering Process Analogy**

Complete this analogy:

**Code Review** is to **Quality Assurance** as **Unit Testing** is to ______?`,
      },
      {
        index: 6, // Question 7
        promptText: `**System Architecture Analogy**

Complete this analogy:

**Load Balancer** is to **Traffic Distribution** as **Cache** is to ______?`,
      },
      {
        index: 7, // Question 8
        promptText: `**Technical Documentation Context**

You're reading a technical specification that states:

"The system architecture follows a microservices pattern with containerized deployment. Each service is independently scalable and communicates through RESTful APIs. The data persistence layer utilizes a distributed database system with automatic failover capabilities. Monitoring and logging are implemented across all services to ensure system reliability and performance tracking."

Based on this description, what can you infer about the system's design priorities?`,
      },
      {
        index: 8, // Question 9
        promptText: `**Code Documentation Analysis**

A developer writes in the code comments:

"This function handles user authentication and session management. It validates credentials against the database and creates secure session tokens. The implementation includes rate limiting to prevent brute force attacks and automatic session expiration for security. Error handling is comprehensive, logging all authentication attempts while maintaining user privacy."

What security measures are mentioned in this documentation?`,
      },
      {
        index: 9, // Question 10
        promptText: `**System Requirements Interpretation**

A requirements document states:

"The application must support concurrent users with minimal latency. Data consistency is critical, and the system should handle peak loads without degradation. Backup and recovery procedures must be automated, and the solution should be scalable to accommodate future growth. Integration with existing enterprise systems is required, and all data transmissions must be encrypted."

What are the key performance requirements mentioned?`,
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
          `   ✅ Fixed Question ${fixedQ.index + 1}: Cleaned formatting`
        );
      }
    }

    console.log(`\n🎉 Successfully fixed ${fixedQuestions.length} questions!`);
    console.log(`📊 Improvements made:`);
    console.log(`   • Removed excessive bold formatting`);
    console.log(`   • Cleaned up question presentation`);
    console.log(`   • Removed reasoning and explanations`);
    console.log(`   • Made content more concise and readable`);
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
