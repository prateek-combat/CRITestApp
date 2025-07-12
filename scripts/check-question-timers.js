const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkQuestionTimers() {
  try {
    console.log('🔍 Checking General Aptitude Test question timers...\n');

    // Find the General Aptitude Test
    const test = await prisma.test.findFirst({
      where: {
        title: 'General Aptitude Test',
      },
      include: {
        questions: {
          orderBy: {
            id: 'asc',
          },
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

    // Display timer for each question
    console.log('Question Timer Analysis:');
    console.log('========================');

    test.questions.forEach((q, index) => {
      const questionNumber = index + 1;
      const expectedTimer = questionNumber <= 40 ? 45 : 20;
      const isCorrect = q.timerSeconds === expectedTimer;
      const status = isCorrect ? '✅' : '❌';

      console.log(
        `Question ${questionNumber}: ${q.timerSeconds} seconds ${status} ${!isCorrect ? `(Expected: ${expectedTimer})` : ''}`
      );

      // Show first part of question text for questions 3 and 15
      if (questionNumber === 3 || questionNumber === 15) {
        console.log(`   → "${q.promptText.substring(0, 60)}..."`);
      }
    });

    // Summary
    console.log('\n📊 Summary:');
    const correctFirst40 = test.questions
      .slice(0, 40)
      .filter((q) => q.timerSeconds === 45).length;
    const correctLast10 = test.questions
      .slice(40, 50)
      .filter((q) => q.timerSeconds === 20).length;

    console.log(`   First 40 questions with 45 seconds: ${correctFirst40}/40`);
    console.log(`   Last 10 questions with 20 seconds: ${correctLast10}/10`);

    // Find problematic questions
    const problematicQuestions = [];
    test.questions.forEach((q, index) => {
      const questionNumber = index + 1;
      const expectedTimer = questionNumber <= 40 ? 45 : 20;
      if (q.timerSeconds !== expectedTimer) {
        problematicQuestions.push({
          number: questionNumber,
          id: q.id,
          current: q.timerSeconds,
          expected: expectedTimer,
        });
      }
    });

    if (problematicQuestions.length > 0) {
      console.log(
        `\n⚠️  Found ${problematicQuestions.length} questions with incorrect timers:`
      );
      problematicQuestions.forEach((pq) => {
        console.log(
          `   Question ${pq.number} (ID: ${pq.id}): ${pq.current}s → should be ${pq.expected}s`
        );
      });
    }
  } catch (error) {
    console.error('❌ Error checking question timers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkQuestionTimers();
