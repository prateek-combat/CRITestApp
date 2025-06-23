const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating Conversational Aptitude Test for Engineering Roles...\n'
  );

  try {
    // Check for existing admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    });

    if (!adminUser) {
      throw new Error(
        'No SUPER_ADMIN user found. Please run setup-local-admin.js first.'
      );
    }

    console.log(`✅ Using admin user: ${adminUser.email}`);

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Conversational Aptitude Test for Engineering Roles',
        description:
          'A comprehensive aptitude test covering verbal reasoning, logical reasoning, attention to detail, numerical reasoning, and general knowledge specifically designed for engineering roles.',
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
      },
    });

    console.log(`✅ Test created successfully!`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Title: ${test.title}\n`);

    // Batch 1: VERBAL REASONING (10 Questions)
    console.log(`🔄 Creating Batch 1 - VERBAL REASONING (10 Questions)...`);
    const verbalQuestions = [
      {
        promptText:
          'The Sprint Review\n\nYour tech lead says: "Team, our sprint velocity has been impressive, but I\'m concerned that our technical debt is accumulating. We need to find a sustainable balance before it becomes unmanageable."\n\nYour colleague asks: "What\'s the main issue here?"\n\nResponse options:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          "We're moving too slowly",
          "We're prioritizing speed over code quality",
          'We need to work faster',
          'Our velocity is too low',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Stark Industries Feedback\n\nClient email: "The prototype exceeded our expectations in terms of functionality. However, the user interface lacks the polish we\'ve come to expect from your team. We trust you\'ll iterate on this aspect."\n\nManager asks: "How should we interpret this feedback?"',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'They love everything about it!',
          'UI needs work, but functionality is great',
          "They're disappointed with everything",
          'They want us to start over',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Tesla Supplier Communication\n\nVendor message: "Due to unprecedented demand for battery cells, our lead times have extended considerably. While we remain committed to our partnership, we must be transparent about current constraints affecting our supply chain."\n\nProcurement asks you: "What are they really saying?"',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'Deliveries will be delayed',
          'They want to end our partnership',
          "They're increasing prices",
          'They have too much inventory',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The IPL Team Manager Hint\n\nManager\'s comment: "Your technical contributions have been solid. I\'d love to see you leverage your expertise to elevate the entire team\'s capabilities through knowledge sharing and mentorship."\n\nHR asks: "What growth area is being suggested?"',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'Improve technical skills',
          'Take on leadership and teaching responsibilities',
          'Focus more on coding',
          'Work more independently',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Tech Stack Comparison\n\nPrompt: "If Git is to version control what Jira is to _____?"\n\nDrag the right answer:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'bug fixing',
          'project tracking',
          'file storage',
          'code compilation',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The Bollywood Production Analogy\n\nSenior engineer: "Think of debugging like being Sherlock in a Bollywood mystery, and refactoring like being a film editor. So code review is like being a _____?"',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'judge - making final decisions',
          'editor - improving clarity and quality',
          'runner - executing the code',
          'artist - making it beautiful',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The Cricket Strategy Pattern\n\nGiven: "Algorithm design : Problem-solving :: System architecture : ____ ?"\n\nClick to complete:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'Big-picture thinking',
          'Debugging skills',
          'Data analysis',
          'Quick coding',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The SpaceX Meeting Dynamics\n\nTranscript excerpt:\nProduct Manager: "We need this feature by Q2."\nEngineer: "That\'s technically possible, but..."\nProduct Manager: "Great! I\'ll tell the stakeholders it\'s confirmed."\nEngineer: "Wait, I haven\'t finished—"\n\nWhat communication issue occurred here?',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'The engineer was being negative',
          "The PM didn't listen to the complete response",
          'The timeline was too aggressive',
          'The engineer spoke too quietly',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference Questions',
      },
      {
        promptText:
          'The Documentation Gap Filler\n\nIncomplete documentation: "The system scales horizontally by adding more servers. This _____ approach ensures high availability, unlike vertical scaling which _____ by upgrading existing hardware."\n\nAuto-complete suggestions:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          'distributed / grows',
          'complex / shrinks',
          'expensive / fails',
          'simple / improves',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Context & Inference Questions',
      },
      {
        promptText:
          'The Mumbai Startup Culture Decoder\n\nHandbook excerpt: "We value engineers who challenge assumptions constructively, collaborate across boundaries, and prioritize learning over being right."\n\nWhich behavior would NOT align with these values?',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          "Questioning a senior engineer's design decision respectfully",
          'Working in isolation to prove your solution is best',
          'Partnering with the design team on UI decisions',
          "Admitting you don't know something and asking for help",
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference Questions',
      },
    ];

    for (let i = 0; i < verbalQuestions.length; i++) {
      await prisma.question.create({
        data: {
          ...verbalQuestions[i],
          testId: test.id,
        },
      });
      console.log(`   ✅ Question ${i + 1}: ${verbalQuestions[i].sectionTag}`);
    }

    // Batch 2: ATTENTION TO DETAIL (10 Questions)
    console.log(
      `\n🔄 Creating Batch 2 - ATTENTION TO DETAIL (10 Questions)...`
    );
    const attentionQuestions = [
      {
        promptText:
          'The Stark Industries Config\n\nDeployment config issue:\n\nversion: \'3.8\'\nservices:\n  frontend:\n    image: stark/jarvis-ui:latest\n    ports:\n      - "3000:3000"\n    environment:\n      - API_URL=http://backend:8080\n    depends_on:\n      - backend\n  \n  backend:\n    image: stark/jarvis-api:latest\n    ports:\n      - "8080:8080"\n    environment:\n      - DB_HOST=postgres\n      - DB_PORT=5432\n      - DB_NAME=jarvis_staging\n    depends_on:\n      - postgress\n  \n  postgress:\n    image: postgres:14\n    ports:\n      - "5432:5432"\n    environment:\n      - POSTGRES_DB=jarvis_staging\n      - POSTGRES_PASSWORD=arc_reactor_2024\n\nWhat\'s preventing startup?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'Port 3000 conflict',
          'Wrong API_URL format',
          "Service name 'postgress' is misspelled",
          'Missing volume mounts',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          'The Match Score Validator\n\nAPI response validation failure:\n\nExpected Schema:\n{\n  "matchId": "string",\n  "timestamp": "ISO-8601",\n  "scoreData": {\n    "runs": "number",\n    "wickets": "number",\n    "overs": "string"\n  }\n}\n\nActual Response:\n{\n  "matchId": "IPL_2024_MI_CSK_045",\n  "timestamp": "2024-03-15T19:30:00Z",\n  "scoreData": {\n    "runs": 186,\n    "wickets": "4",\n    "overs": "18.3"\n  }\n}\n\nWhat\'s the validation error?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'matchId format incorrect',
          'timestamp not ISO-8601',
          'wickets should be number, not string',
          'Missing required fields',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          "The Tesla Environment Variables\n\nProduction.env:\nNODE_ENV=production\nAPI_PORT=8080\nDB_HOST=tesla-prod.aws.com\nDB_PORT=5432\nDB_NAME=autopilot_prod\nDB_USER=tesla_app\nDB_PASSWORD=M0del3_Secure!2024\nREDIS_HOST=tesla-cache.aws.com\nREDIS_PORT=6379\nLOG_LEVEL=info\n\nStaging.env (working):\nNODE_ENV=staging\nAPI_PORT=8080\nDB_HOST=tesla-stage.aws.com\nDB_PORT=5432\nDB_NAME=autopilot_stage\nDB_USER=tesla_app\nDB_PASS=M0delS_Test!2024\nREDIS_HOST=tesla-cache-stage.aws.com\nREDIS_PORT=6379\nLOG_LEVEL=debug\n\nWhat's causing the connection failure?",
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'Wrong database port',
          'Invalid password characters',
          'Different env variable name (DB_PASSWORD vs DB_PASS)',
          'Missing quotes around password',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          "The Commit Message Analyzer\n\nCommit convention: [TYPE-TICKET] Brief description (max 50 chars)\n\nRecent commits:\n[FIX-MCU-234] Fix Iron Man suit power calculation bug\n[FEAT-MCU-567] Add Hulk transformation animation\n[UPDATE-MCU-891] Refactor Thor hammer authentication middleware for better performance\n[DOC-MCU-345] Update Avengers API documentation\n[TEST-MCU-678] Add unit tests for Shield protocols\n\nWhich commit doesn't follow the convention?",
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          'The Bollywood Database Inspector\n\nMovieID | Title | Director | ReleaseDate | BoxOffice\nBW001 | Pathaan | Siddharth Anand | 2023-01-25 | ₹1050.3cr\nBW002 | Jawan | Atlee Kumar | 2023-09-07 | ₹1148.32cr\nBW003 | Dunki | Rajkumar Hirani | 2023-12-21 | ₹463.38cr\nBW004 | Tiger 3 | Maneesh Sharma | 2023-11-12 | ₹466.58rc\nBW005 | Gadar 2 | Anil Sharma | 2023-08-11 | ₹687.11cr\n\nWhich row has invalid data?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['Row 1', 'Row 2', 'Row 3', 'Row 4'],
        correctAnswerIndex: 3,
        sectionTag: 'Data Validation & Pattern Matching',
      },
      {
        promptText:
          'The API Endpoint Pattern Check\n\nCurrent Endpoints:\nGET /api/v2/movies\nPOST /api/v2/movies\nGET /api/v2/movies/{id}\nPUT /api/v2/movies/{id}\nDELETE /api/v2/movies/{id}\n\nGET /api/v2/artists\nPOST /api/v2/artists\nGET /api/v2/artists/{id}\nPUT /api/v2/artists/{id}\nDELETE /api/v2/artists/{id}\n\nGET /api/v2/songs\nPOST /api/v2/song\nGET /api/v2/songs/{id}\nPUT /api/v2/songs/{id}\nDELETE /api/v2/songs/{id}\n\nWhich endpoint breaks the pattern?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'GET /api/v2/movies',
          'DELETE /api/v2/artists/{id}',
          'POST /api/v2/song',
          'PUT /api/v2/songs/{id}',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          'The Invoice Number Sequence\n\nInvoice numbering pattern: YYYY-MM-XXXX (sequential)\n\nRecent Invoices:\n2024-03-0041 | March 15, 2024 | $3,450.00\n2024-03-0042 | March 16, 2024 | $1,200.00\n2024-03-0043 | March 18, 2024 | $5,670.00\n2024-04-0044 | March 20, 2024 | $2,890.00\n2024-04-0045 | April 2, 2024 | $4,320.00\n2024-04-0046 | April 5, 2024 | $1,980.00\n\nWhich invoice has an error?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'Invoice 2024-03-0041',
          'Invoice 2024-03-0042',
          'Invoice 2024-04-0044',
          'Invoice 2024-04-0045',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          'The Shipping Address Validator\n\nAddress Form Standards:\nLine 1: Street number and name\nLine 2: Unit/Apt (optional)\nCity: Text only\nState: 2-letter code\nZIP: 5 digits or 5+4 format\nCountry: 2-letter ISO code\n\nCustomer Input:\nLine 1: 4567 Maple Avenue\nLine 2: Suite 23-B\nCity: San Francisco\nState: California\nZIP: 94102\nCountry: US\n\nWhat needs correction?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'Suite number format',
          'City contains numbers',
          "State should be 'CA' not 'California'",
          'ZIP should include +4',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          'The Password Policy Checker\n\nPassword Requirements:\n- Minimum 12 characters\n- At least 1 uppercase letter\n- At least 1 lowercase letter\n- At least 2 numbers\n- At least 1 special character (!@#$%^&*)\n- No repeated characters more than twice\n\nRecent Password Changes:\nUser A: SecurePass#2024!\nUser B: MyP@ssw0rd123\nUser C: HelloWorld@2224\nUser D: P@ssword11Test\n\nWhich password fails validation?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['User A', 'User B', 'User C', 'User D'],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          "The Temperature Log Anomaly\n\nSensors log every 30 minutes:\n\nTemperature Log (°C):\n00:00 - 22.5°C\n00:30 - 22.3°C\n01:00 - 22.4°C\n01:30 - 22.2°C\n02:00 - 22.1°C\n02:30 - 22.0°C\n03:00 - 21.9°C\n03:30 - 21.8°C\n04:00 - 21.7°C\n05:00 - 21.5°C\n05:30 - 21.4°C\n06:00 - 21.6°C\n\nWhere's the missing reading?",
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: [
          'Between 03:30 and 04:00',
          'Between 04:00 and 05:00',
          'Between 05:00 and 05:30',
          'Between 05:30 and 06:00',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
    ];

    for (let i = 0; i < attentionQuestions.length; i++) {
      await prisma.question.create({
        data: {
          ...attentionQuestions[i],
          testId: test.id,
        },
      });
      console.log(
        `   ✅ Question ${i + 11}: ${attentionQuestions[i].sectionTag}`
      );
    }

    console.log(
      `\n🎉 Successfully created Conversational Aptitude Test for Engineering Roles!`
    );
    console.log(`📊 Summary:`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(
      `   📝 Questions created: ${verbalQuestions.length + attentionQuestions.length}`
    );
    console.log(`   ⏱️  Time per question: 30 seconds`);
    console.log(`\n🔧 Sections covered:`);
    console.log(`   • Verbal Reasoning (10 questions)`);
    console.log(`   • Attention to Detail (10 questions)`);
  } catch (error) {
    console.error('❌ Error creating test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
