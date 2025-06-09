const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TEST_ATTEMPT_ID = '0de64c9e-14ed-4d5c-aa16-24318688236a'; // Alice Johnson's attempt

async function testApiResponse() {
  try {
    console.log('🔍 Testing test attempt API response format...\n');

    // Fetch the test attempt directly from database
    const testAttempt = await prisma.testAttempt.findUnique({
      where: { id: TEST_ATTEMPT_ID },
      include: {
        test: {
          include: {
            questions: {
              include: {
                personalityDimension: true,
              },
            },
          },
        },
        invitation: {
          select: {
            candidateName: true,
            candidateEmail: true,
          },
        },
        submittedAnswers: {
          include: {
            question: true,
          },
        },
      },
    });

    if (!testAttempt) {
      console.log('❌ Test attempt not found');
      return;
    }

    console.log('✅ Test attempt found:');
    console.log(`   Candidate: ${testAttempt.invitation?.candidateName}`);
    console.log(`   Test: ${testAttempt.test.title}`);
    console.log(`   Total questions: ${testAttempt.test.questions.length}`);
    console.log(`   Submitted answers: ${testAttempt.submittedAnswers.length}`);

    // Check personality questions and their answer weights
    const personalityQuestions = testAttempt.test.questions.filter(
      (q) => q.questionType === 'PERSONALITY'
    );
    console.log(`\n📊 Personality questions analysis:`);
    console.log(
      `   Found ${personalityQuestions.length} personality questions`
    );

    personalityQuestions.forEach((q, index) => {
      const submittedAnswer = testAttempt.submittedAnswers.find(
        (sa) => sa.questionId === q.id
      );
      console.log(`\n   Question ${index + 1}:`);
      console.log(`     ID: ${q.id}`);
      console.log(`     Text: ${q.promptText.substring(0, 50)}...`);
      console.log(`     Answer weights: ${JSON.stringify(q.answerWeights)}`);
      console.log(
        `     Answer weights type: ${Array.isArray(q.answerWeights) ? 'array' : typeof q.answerWeights}`
      );
      console.log(`     Dimension: ${q.personalityDimension?.name || 'None'}`);

      if (submittedAnswer) {
        console.log(
          `     Selected answer index: ${submittedAnswer.selectedAnswerIndex}`
        );
        console.log(
          `     Selected option: ${q.answerOptions[submittedAnswer.selectedAnswerIndex]}`
        );

        // Test weight calculation
        if (q.answerWeights) {
          let weight = 0;
          if (Array.isArray(q.answerWeights)) {
            weight = q.answerWeights[submittedAnswer.selectedAnswerIndex] || 0;
            console.log(`     Weight (array access): ${weight}`);
          } else {
            const letterKey = String.fromCharCode(
              65 + submittedAnswer.selectedAnswerIndex
            );
            weight = q.answerWeights[letterKey] || 0;
            console.log(`     Weight (object access): ${weight}`);
          }
        }
      } else {
        console.log(`     ⚠️  No submitted answer found`);
      }
    });

    // Transform answers to expected format
    const answers = {};
    testAttempt.submittedAnswers.forEach((sa) => {
      answers[sa.questionId] = {
        answerIndex: sa.selectedAnswerIndex,
        timeTaken: sa.timeTakenSeconds,
      };
    });

    console.log(`\n📝 Transformed answers format sample:`);
    const sampleQuestionId = Object.keys(answers)[0];
    if (sampleQuestionId) {
      console.log(
        `   ${sampleQuestionId}: ${JSON.stringify(answers[sampleQuestionId])}`
      );
    }

    console.log('\n✅ API response format validation complete!');
  } catch (error) {
    console.error('❌ Error testing API response:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse();
