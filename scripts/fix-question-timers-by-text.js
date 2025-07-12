const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixQuestionTimersByText() {
  try {
    console.log(
      '🔍 Finding General Aptitude Test and fixing timers based on question numbers in text...\n'
    );

    // Find the General Aptitude Test
    const test = await prisma.test.findFirst({
      where: {
        title: 'General Aptitude Test',
      },
      include: {
        questions: {
          select: {
            id: true,
            promptText: true,
            timerSeconds: true,
          },
        },
      },
    });

    if (!test) {
      console.log('❌ General Aptitude Test not found');
      return;
    }

    console.log(
      `✅ Found ${test.title} with ${test.questions.length} questions\n`
    );

    // Find all questions to update based on their question number in the text
    const questionsToUpdate = [];

    test.questions.forEach((q) => {
      // Extract question number from the text
      const questionTextMatch = q.promptText.match(/###\s*Question\s*(\d+):/);
      if (questionTextMatch) {
        const textQuestionNumber = parseInt(questionTextMatch[1]);

        // Determine what the timer should be based on the question number in the text
        const expectedTimer = textQuestionNumber <= 40 ? 45 : 20;

        if (q.timerSeconds !== expectedTimer) {
          questionsToUpdate.push({
            id: q.id,
            textQuestionNumber: textQuestionNumber,
            currentTimer: q.timerSeconds,
            expectedTimer: expectedTimer,
            preview: q.promptText.substring(0, 80) + '...',
          });
        }
      }
    });

    if (questionsToUpdate.length === 0) {
      console.log('✅ All questions already have the correct timers!');
      return;
    }

    console.log(
      `⚠️  Found ${questionsToUpdate.length} questions with incorrect timers:\n`
    );

    // Sort by question number for clarity
    questionsToUpdate.sort(
      (a, b) => a.textQuestionNumber - b.textQuestionNumber
    );

    // Display questions that need updating
    questionsToUpdate.forEach((q) => {
      console.log(`Question ${q.textQuestionNumber}:`);
      console.log(
        `  Current timer: ${q.currentTimer}s → Should be: ${q.expectedTimer}s`
      );
      console.log(`  Preview: "${q.preview}"`);
      console.log('');
    });

    // Update all questions
    console.log('🔧 Updating timers...\n');

    for (const q of questionsToUpdate) {
      await prisma.question.update({
        where: { id: q.id },
        data: { timerSeconds: q.expectedTimer },
      });
      console.log(
        `✅ Updated Question ${q.textQuestionNumber}: ${q.currentTimer}s → ${q.expectedTimer}s`
      );
    }

    // Verify specific questions 3 and 15
    console.log('\n🎯 Verifying Questions 3 and 15...');

    const verifyQuestions = await prisma.test.findFirst({
      where: { title: 'General Aptitude Test' },
      include: {
        questions: {
          where: {
            OR: [
              { promptText: { contains: '### Question 3:' } },
              { promptText: { contains: '### Question 15:' } },
            ],
          },
          select: {
            promptText: true,
            timerSeconds: true,
          },
        },
      },
    });

    verifyQuestions.questions.forEach((q) => {
      const questionMatch = q.promptText.match(/###\s*Question\s*(\d+):/);
      if (questionMatch) {
        const qNum = questionMatch[1];
        console.log(
          `Question ${qNum}: ${q.timerSeconds} seconds ${q.timerSeconds === 45 ? '✅' : '❌'}`
        );
      }
    });

    console.log('\n🎉 Timer update completed successfully!');
  } catch (error) {
    console.error('❌ Error fixing question timers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixQuestionTimersByText();
