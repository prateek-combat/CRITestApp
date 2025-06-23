const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Adding remaining questions to Conversational Aptitude Test for Engineering Roles...\n'
  );

  try {
    // Find the existing test
    const test = await prisma.test.findFirst({
      where: {
        title: 'Conversational Aptitude Test for Engineering Roles',
      },
      include: {
        questions: true,
      },
    });

    if (!test) {
      throw new Error(
        'Conversational Aptitude Test for Engineering Roles not found. Please run the main script first.'
      );
    }

    console.log(`✅ Found existing test: ${test.title}`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Current questions: ${test.questions.length}\n`);

    // Batch 3: LOGICAL REASONING (10 Questions)
    console.log(`🔄 Creating Batch 3 - LOGICAL REASONING (10 Questions)...`);
    const logicalQuestions = [
      {
        promptText:
          'The Memory Usage Pattern\n\nSystem analyst observes: "RAM usage spikes follow this pattern: 4, 9, 25, 49, 121, 169, ?"\n\nPredict next spike (GB):',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: ['225', '289', '256', '361'],
        correctAnswerIndex: 1,
        sectionTag: 'Pattern Recognition',
      },
      {
        promptText:
          'The Database Query Optimizer\n\nDatabase admin\'s log: "Query optimization times: 2, 5, 11, 23, 47, ?, 191"\n\nFind missing time (ms):',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: ['95', '94', '96', '93'],
        correctAnswerIndex: 0,
        sectionTag: 'Pattern Recognition',
      },
      {
        promptText:
          'The System Crash Analysis\n\nPost-mortem finding: "The server crashed at 3 PM. The memory usage graph shows a spike at 2:55 PM. A new feature was deployed at 2:45 PM."\n\nIdentify the relationship:',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'The crash caused the memory spike',
          'The memory spike caused the crash',
          'The deployment caused both spike and crash',
          'These events are unrelated',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Cause & Effect Analysis',
      },
      {
        promptText:
          'The Code Deployment Schedule\n\nDevOps question: "On which day was the production deployment done?"\n\nStatement I: "Deployment was 3 days after code freeze, which was on Tuesday"\nStatement II: "Testing completed on Thursday, deployment was next working day"\n\nAnalyze sufficiency:',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'Statement I alone is sufficient',
          'Statement II alone is sufficient',
          'Both statements needed',
          'Cannot be determined',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Data Sufficiency',
      },
      {
        promptText:
          'The Remote Work Debate\n\nStatement: "All developers should be required to work from office at least 3 days a week."\n\nWhich is the strongest argument against this?',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'Developers prefer working from home',
          'Remote developers have proven equally productive',
          'Office space is expensive to maintain',
          'Some developers live far from the office',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Argument Analysis',
      },
      {
        promptText:
          'The Framework Logic\n\nArchitecture meeting notes: "All microservices use Docker. Some Docker applications use Kubernetes. All Kubernetes deployments are cloud-based."\n\nConclusion checker - which must be true?',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'All microservices are cloud-based',
          'Some microservices use Kubernetes',
          'Some cloud deployments are microservices',
          'None of the above must be true',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Logical Deduction',
      },
      {
        promptText:
          'The Programming Language Deduction\n\nHR database logic: "No Python developers know COBOL. All full-stack developers know Python. Sarah knows COBOL."\n\nWhat can we conclude?',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'Sarah is not a full-stack developer',
          "Sarah doesn't know Python",
          'Sarah is a backend developer',
          'Both A and B are correct',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Logical Deduction',
      },
      {
        promptText:
          'The Office Navigation Puzzle\n\nFacilities message: "From the entrance, walk 10m North to reach the lobby. Turn East and walk 15m to the cafeteria. From there, walk 10m South, then 20m West to reach the server room. How far and in which direction is the server room from the entrance?"\n\nCalculate displacement:',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: ['5m West', '5m East', '10m Northwest', '5m Southwest'],
        correctAnswerIndex: 0,
        sectionTag: 'Spatial Reasoning',
      },
      {
        promptText:
          "The Tech Team Family\n\nNew hire orientation: \"Pointing to a photo, the CTO says: 'This person's father is my father's only son.' The person in the photo is our new DevOps engineer. How is the DevOps engineer related to the CTO?\"\n\nIdentify relationship:",
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'Son',
          'Daughter',
          'Nephew',
          'Could be son or daughter',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Logical Deduction',
      },
      {
        promptText:
          'The API Performance Logic\n\nPerformance team notes: "Response time increases when concurrent users exceed 1000. Database queries slow down when response time is over 2 seconds. Cache hit ratio drops when database is slow."\n\nGiven: "Cache hit ratio just dropped to 60%"\n\nWhat can we deduce?',
        category: 'LOGICAL',
        timerSeconds: 30,
        answerOptions: [
          'Concurrent users are over 1000',
          'Response time is over 2 seconds',
          'Database queries are slow',
          'All of the above are likely true',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Logical Chain Analysis',
      },
    ];

    for (let i = 0; i < logicalQuestions.length; i++) {
      await prisma.question.create({
        data: {
          ...logicalQuestions[i],
          testId: test.id,
        },
      });
      console.log(
        `   ✅ Question ${test.questions.length + i + 1}: ${logicalQuestions[i].sectionTag}`
      );
    }

    // Batch 4: NUMERICAL (10 Questions)
    console.log(`\n🔄 Creating Batch 4 - NUMERICAL (10 Questions)...`);
    const numericalQuestions = [
      {
        promptText:
          'The Sprint Velocity Dashboard\n\nSprint Performance Over 6 Months:\nMonth | Story Points Completed | Team Size | Bugs Found\nJan   | 80                     | 5         | 12\nFeb   | 96                     | 6         | 15\nMar   | 105                    | 6         | 14\nApr   | 84                     | 7         | 18\nMay   | 91                     | 7         | 16\nJun   | 108                    | 8         | 20\n\nWhat was the average story points per team member in Q1 (Jan-Mar)?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '16.5 points/person',
          '17.0 points/person',
          '16.0 points/person',
          '15.5 points/person',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Data Analysis',
      },
      {
        promptText:
          'The Server Load Distribution\n\nServer Resource Allocation (Total: 480GB RAM)\nProduction Servers: 35%\nDevelopment Servers: 25%\nTesting Servers: 20%\nStaging Servers: 15%\nBackup Servers: 5%\n\nIf we need to increase Testing servers by 48GB, what will be their new percentage of total allocation?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['28%', '30%', '27%', '25%'],
        correctAnswerIndex: 2,
        sectionTag: 'Percentage Calculations',
      },
      {
        promptText:
          'The Code Coverage Analysis\n\nQA Lead\'s report:\n"Our codebase has 12,000 lines of code. Current test coverage:\nUnit tests cover 4,800 lines\nIntegration tests cover 3,600 lines\n2,400 lines are covered by both test types\n\nWhat percentage of code remains untested?"',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['40%', '45%', '50%', '55%'],
        correctAnswerIndex: 2,
        sectionTag: 'Set Theory & Coverage',
      },
      {
        promptText:
          'The Cloud Cost Optimization\n\nFinOps report:\n"Monthly cloud costs for Q1:\nJanuary: $24,000 (20% over budget)\nFebruary: $22,000 (10% over budget)\nMarch: $19,000 (5% under budget)\n\nWhat was the total Q1 budget?"',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['$60,000', '$62,000', '$64,000', '$66,000'],
        correctAnswerIndex: 0,
        sectionTag: 'Budget Analysis',
      },
      {
        promptText:
          'The User Growth Projection\n\nProduct manager\'s data:\n"Monthly active users (MAU) growth:\nMonth 1: 10,000 MAU\nMonth 2: 12,000 MAU\nMonth 3: 14,400 MAU\n\nFollowing this growth pattern, what\'s the expected MAU in Month 5?"',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['17,280', '20,736', '19,200', '24,883'],
        correctAnswerIndex: 1,
        sectionTag: 'Growth Patterns',
      },
      {
        promptText:
          'Monthly Bug Count\n\nBugs Found Per Month:\nJan: 40\nFeb: 30\nMar: 60\nApr: 20\n\nWhat percentage of Q1 bugs were found in March?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['46%', '50%', '54%', '60%'],
        correctAnswerIndex: 1,
        sectionTag: 'Basic Percentages',
      },
      {
        promptText:
          'Deployment Speed\n\nPipeline Performance:\n"5 deployments completed in 2 hours"\n\nAt this rate, how many deployments in 8 hours?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['15', '18', '20', '24'],
        correctAnswerIndex: 2,
        sectionTag: 'Rate Calculations',
      },
      {
        promptText:
          "The User Journey Flow\n\nUser Journey Flow (1000 users start):\nHomepage → Product Page (600)\nProduct Page → Cart (400)\nCart → Checkout (300)\nCheckout → Purchase (250)\n\nWhat's the cart abandonment rate?",
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['20%', '25%', '30%', '33%'],
        correctAnswerIndex: 1,
        sectionTag: 'Conversion Analysis',
      },
      {
        promptText:
          'The CI/CD Pipeline Flow\n\nBuild Pipeline Flow (1000 commits/week):\nCommits → Build Stage (900)\nBuild Stage → Unit Tests (850)\nUnit Tests → Integration Tests (750)\nIntegration Tests → Deploy to Staging (700)\nDeploy to Staging → Production (600)\n\nWhat percentage of commits that pass unit tests eventually reach production?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['70.6%', '75.0%', '80.0%', '85.7%'],
        correctAnswerIndex: 0,
        sectionTag: 'Pipeline Success Rate',
      },
      {
        promptText:
          'The API Request Distribution Flow\n\nAPI Request Flow (10,000 requests/minute):\nIncoming → Region US-East (4,000)\nUS-East → Database (800), Timeout (50)\nRegion EU-West (3,500)\nEU-West → Database (700), Timeout (20)\nRegion APAC (2,500)\nAPAC → Database (750), Timeout (50)\n\nWhich region has the highest database timeout rate?',
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: ['US-East', 'EU-West', 'APAC', 'All equal'],
        correctAnswerIndex: 2,
        sectionTag: 'Comparative Analysis',
      },
    ];

    for (let i = 0; i < numericalQuestions.length; i++) {
      await prisma.question.create({
        data: {
          ...numericalQuestions[i],
          testId: test.id,
        },
      });
      console.log(
        `   ✅ Question ${test.questions.length + logicalQuestions.length + i + 1}: ${numericalQuestions[i].sectionTag}`
      );
    }

    // Batch 5: GENERAL KNOWLEDGE (10 Questions)
    console.log(`\n🔄 Creating Batch 5 - GENERAL KNOWLEDGE (10 Questions)...`);
    const gkQuestions = [
      {
        promptText: 'What does the acronym "DRDO" stand for?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Defence Robotics Development Organization',
          'Defence Research and Development Organisation',
          'Drone Research and Design Office',
          'Defence Resources and Deployment Organization',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Defence Knowledge',
      },
      {
        promptText:
          "What is the name of India's first indigenous aircraft carrier?",
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'INS Vikramaditya',
          'INS Viraat',
          'INS Vikrant',
          'INS Vishal',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Defence Knowledge',
      },
      {
        promptText: 'Who is the current Defence Minister of India?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Amit Shah',
          'Rajnath Singh',
          'S. Jaishankar',
          'Nirmala Sitharaman',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Current Affairs',
      },
      {
        promptText: 'Who is the current Vice President of India?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Venkaiah Naidu',
          'Jagdeep Dhankhar',
          'Droupadi Murmu',
          'Om Birla',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Current Affairs',
      },
      {
        promptText: 'What is the highest rank in the Indian Army?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'General',
          'Field Marshal',
          'Lieutenant General',
          'Major General',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Defence Knowledge',
      },
      {
        promptText: 'Which is the highest peacetime gallantry award in India?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Param Vir Chakra',
          'Ashoka Chakra',
          'Kirti Chakra',
          'Shaurya Chakra',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Awards & Honours',
      },
      {
        promptText: 'How many Field Marshals has India had?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: ['One', 'Two', 'Three', 'Four'],
        correctAnswerIndex: 1,
        sectionTag: 'Defence History',
      },
      {
        promptText: 'What is the motto of the Indian Army?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Service Before Self',
          'Duty, Honor, Country',
          'Victory is Ours',
          'Nation First, Always and Every Time',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Defence Knowledge',
      },
      {
        promptText: 'What is the motto of the Indian Air Force?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Touch the Sky with Glory',
          'Fly High, Strike Hard',
          'Guardians of the Sky',
          'Wings of Steel',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Defence Knowledge',
      },
      {
        promptText: 'What is the motto of the Indian Navy?',
        category: 'OTHER',
        timerSeconds: 30,
        answerOptions: [
          'Brave on the Seas',
          'May the Lord of the Water be Auspicious Unto Us',
          'Defenders of the Deep',
          'Silent Service',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Defence Knowledge',
      },
    ];

    for (let i = 0; i < gkQuestions.length; i++) {
      await prisma.question.create({
        data: {
          ...gkQuestions[i],
          testId: test.id,
        },
      });
      console.log(
        `   ✅ Question ${test.questions.length + logicalQuestions.length + numericalQuestions.length + i + 1}: ${gkQuestions[i].sectionTag}`
      );
    }

    const totalQuestionsAdded =
      logicalQuestions.length + numericalQuestions.length + gkQuestions.length;

    console.log(
      `\n🎉 Successfully completed Conversational Aptitude Test for Engineering Roles!`
    );
    console.log(`📊 Final Summary:`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(
      `   📝 Total questions: ${test.questions.length + totalQuestionsAdded}`
    );
    console.log(`   📝 Questions added in this run: ${totalQuestionsAdded}`);
    console.log(`   ⏱️  Time per question: 30 seconds`);
    console.log(
      `   🕒 Total test time: ${((test.questions.length + totalQuestionsAdded) * 30) / 60} minutes`
    );
    console.log(`\n🔧 All sections covered:`);
    console.log(`   • Verbal Reasoning (10 questions)`);
    console.log(`   • Attention to Detail (10 questions)`);
    console.log(`   • Logical Reasoning (10 questions)`);
    console.log(`   • Numerical Reasoning (10 questions)`);
    console.log(`   • General Knowledge (10 questions)`);
    console.log(
      `\n💡 You can now use this test by creating invitations or public links!`
    );
  } catch (error) {
    console.error('❌ Error adding questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
