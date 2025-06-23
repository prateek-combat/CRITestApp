const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Questions 41-50 formatting...\n');

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
    console.log(`🔧 Fixing questions 41-50...\n`);

    // Define properly formatted questions 41-50 (General Knowledge)
    const fixedQuestions = [
      {
        index: 40, // Question 41
        promptText: `**Defence Technology**

Which organization is responsible for developing indigenous defence technologies in India?`,
      },
      {
        index: 41, // Question 42
        promptText: `**Military Aircraft**

What is the name of India's first indigenous fighter aircraft developed by HAL?`,
      },
      {
        index: 42, // Question 43
        promptText: `**Naval Systems**

Which is India's first indigenous aircraft carrier?`,
      },
      {
        index: 43, // Question 44
        promptText: `**Missile Technology**

What is the range classification of the Agni-V missile?`,
      },
      {
        index: 44, // Question 45
        promptText: `**Space Defence**

Which Indian organization is responsible for military satellite communications?`,
      },
      {
        index: 45, // Question 46
        promptText: `**Defence Manufacturing**

What does the term "Make in India" specifically promote in the defence sector?`,
      },
      {
        index: 46, // Question 47
        promptText: `**Current Technology Trends**

Which technology is primarily driving the development of autonomous vehicles in 2024?`,
      },
      {
        index: 47, // Question 48
        promptText: `**Global Defence**

Which country launched the world's first quantum communication satellite?`,
      },
      {
        index: 48, // Question 49
        promptText: `**Military Recognition**

What is the highest peacetime gallantry award in India?`,
      },
      {
        index: 49, // Question 50
        promptText: `**Defence History**

In which year was the Defence Research and Development Organisation (DRDO) established?`,
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
          `   ✅ Fixed Question ${fixedQ.index + 1}: Clean general knowledge format`
        );
      }
    }

    console.log(`\n🎉 Successfully fixed ${fixedQuestions.length} questions!`);
    console.log(`📊 Improvements made:`);
    console.log(`   • Simple, clean question format`);
    console.log(`   • No excessive formatting`);
    console.log(`   • Direct questions without explanations`);
    console.log(`   • Professional presentation`);
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
