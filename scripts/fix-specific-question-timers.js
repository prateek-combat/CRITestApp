const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSpecificQuestionTimers() {
  try {
    console.log(
      '🔍 Finding General Aptitude Test and checking question order...\n'
    );

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

    // Look for questions that contain "Question 3" or "Question 15" in their text
    const problematicQuestions = [];

    test.questions.forEach((q, index) => {
      const actualPosition = index + 1;

      // Check if this question mentions a different question number in its text
      const questionTextMatch = q.promptText.match(/###\s*Question\s*(\d+):/);
      if (questionTextMatch) {
        const textQuestionNumber = parseInt(questionTextMatch[1]);

        if (textQuestionNumber !== actualPosition) {
          console.log(`⚠️  Position mismatch at position ${actualPosition}:`);
          console.log(`   - Database position: ${actualPosition}`);
          console.log(
            `   - Question text says: Question ${textQuestionNumber}`
          );
          console.log(`   - Current timer: ${q.timerSeconds} seconds`);
          console.log(`   - Question ID: ${q.id}`);
          console.log(
            `   - First 80 chars: "${q.promptText.substring(0, 80)}..."\n`
          );

          // Check if it's in positions 3 or 15 (as reported by user)
          if (actualPosition === 3 || actualPosition === 15) {
            problematicQuestions.push({
              id: q.id,
              position: actualPosition,
              currentTimer: q.timerSeconds,
              shouldBe: 45, // First 40 questions should have 45 seconds
            });
          }
        }
      }
    });

    if (problematicQuestions.length > 0) {
      console.log(
        `\n🔧 Fixing ${problematicQuestions.length} questions with incorrect timers...`
      );

      for (const pq of problematicQuestions) {
        const result = await prisma.question.update({
          where: { id: pq.id },
          data: { timerSeconds: pq.shouldBe },
        });

        console.log(
          `✅ Fixed question at position ${pq.position}: ${pq.currentTimer}s → ${pq.shouldBe}s`
        );
      }
    } else {
      // If no mismatches found, let's directly check positions 3 and 15
      console.log('\n🔍 Directly checking positions 3 and 15...');

      const position3 = test.questions[2]; // Index 2 = Position 3
      const position15 = test.questions[14]; // Index 14 = Position 15

      console.log(`\nPosition 3:`);
      console.log(`- Timer: ${position3.timerSeconds} seconds`);
      console.log(`- ID: ${position3.id}`);
      console.log(
        `- Text preview: "${position3.promptText.substring(0, 100)}..."`
      );

      console.log(`\nPosition 15:`);
      console.log(`- Timer: ${position15.timerSeconds} seconds`);
      console.log(`- ID: ${position15.id}`);
      console.log(
        `- Text preview: "${position15.promptText.substring(0, 100)}..."`
      );

      // Force update positions 3 and 15 to 45 seconds
      if (position3.timerSeconds !== 45 || position15.timerSeconds !== 45) {
        console.log(
          '\n🔧 Forcing update of positions 3 and 15 to 45 seconds...'
        );

        await prisma.question.update({
          where: { id: position3.id },
          data: { timerSeconds: 45 },
        });
        console.log('✅ Updated position 3 to 45 seconds');

        await prisma.question.update({
          where: { id: position15.id },
          data: { timerSeconds: 45 },
        });
        console.log('✅ Updated position 15 to 45 seconds');
      }
    }

    // Verify the fix
    console.log('\n🎯 Verifying the fix...');
    const updatedTest = await prisma.test.findFirst({
      where: { title: 'General Aptitude Test' },
      include: {
        questions: {
          orderBy: { id: 'asc' },
          select: { timerSeconds: true },
        },
      },
    });

    const pos3Timer = updatedTest.questions[2].timerSeconds;
    const pos15Timer = updatedTest.questions[14].timerSeconds;

    console.log(
      `Position 3 timer: ${pos3Timer} seconds ${pos3Timer === 45 ? '✅' : '❌'}`
    );
    console.log(
      `Position 15 timer: ${pos15Timer} seconds ${pos15Timer === 45 ? '✅' : '❌'}`
    );
  } catch (error) {
    console.error('❌ Error fixing question timers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificQuestionTimers();
