const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating Conversational Aptitude Test for Engineering Roles...\n'
  );

  try {
    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Conversational Aptitude Test for Engineering Roles',
        description:
          'A comprehensive aptitude test covering verbal reasoning, logical reasoning, attention to detail, numerical reasoning, and general knowledge specifically designed for engineering roles.',
        lockOrder: false,
        allowReview: true,
        createdById: '4387fa5a-2267-45c6-a68d-ad372276dcc6', // Default admin user
      },
    });

    console.log(`✅ Test created successfully!`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Title: ${test.title}`);
    console.log(`   📄 Description: ${test.description}\n`);

    // Batch 1: VERBAL REASONING (10 Questions)
    const verbalQuestions = [
      {
        promptText: `The Sprint Review

Format: Slack message from your tech lead

Message:
"Team, our sprint velocity has been impressive, but I'm concerned that our technical debt is accumulating. We need to find a sustainable balance before it becomes unmanageable."

Your colleague asks: "What's the main issue here?"

Response options:`,
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
        promptText: `The Stark Industries Feedback

Format: Email thread viewer

Client email:
"The prototype exceeded our expectations in terms of functionality. However, the user interface lacks the polish we've come to expect from your team. We trust you'll iterate on this aspect."

Manager's chat: "How should we interpret this feedback?"

Options as chat replies:`,
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
        promptText: `The Tesla Supplier Communication

Format: Teams message thread

Vendor message:
"Due to unprecedented demand for battery cells, our lead times have extended considerably. While we remain committed to our partnership, we must be transparent about current constraints affecting our supply chain."

Procurement asks you: "What are they really saying?"

Quick reply options:`,
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
        promptText: `The IPL Team Manager Hint

Format: 1-on-1 meeting notes

Manager's comment:
"Your technical contributions have been solid. I'd love to see you leverage your expertise to elevate the entire team's capabilities through knowledge sharing and mentorship."

HR chatbot asks: "What growth area is being suggested?"

Select your interpretation:`,
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
        promptText: `The Tech Stack Comparison

Format: Interactive comparison builder

Setup: "Help the new intern understand our tools..."

Prompt: "If Git is to version control what Jira is to _____?"

Drag the right answer:`,
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
        promptText: `The Bollywood Production Analogy

Format: Chat conversation with senior engineer

Senior engineer: "Think of debugging like being Sherlock in a Bollywood mystery, and refactoring like being a film editor. So code review is like being a _____?"

Your response options:`,
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
        promptText: `The Cricket Strategy Pattern

Format: Team skills matrix builder

Scenario: "Complete the pattern for our job posting..."

Given: "Algorithm design : Problem-solving :: System architecture : ____ ?"

Click to complete:`,
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
        promptText: `The SpaceX Meeting Dynamics

Format: Virtual meeting transcript

Transcript excerpt:
Product Manager: "We need this feature by Q2." 
Engineer: "That's technically possible, but..." 
Product Manager: "Great! I'll tell the stakeholders it's confirmed." 
Engineer: "Wait, I haven't finished—"

Post-meeting survey: "What communication issue occurred here?"

Select your observation:`,
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
        promptText: `The Documentation Gap Filler

Format: Wiki editor assistant

Incomplete documentation:
"The system scales horizontally by adding more servers. This _____ approach ensures high availability, unlike vertical scaling which _____ by upgrading existing hardware."

Auto-complete suggestions (select two):`,
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
        promptText: `The Mumbai Startup Culture Decoder

Format: Company handbook chatbot

Handbook excerpt:
"We value engineers who challenge assumptions constructively, collaborate across boundaries, and prioritize learning over being right."

Chatbot question: "Which behavior would NOT align with these values?"

Choose the mismatch:`,
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

    console.log(`🔄 Creating Batch 1 - VERBAL REASONING (10 Questions)...`);
    for (let i = 0; i < verbalQuestions.length; i++) {
      const questionData = verbalQuestions[i];
      await prisma.question.create({
        data: {
          promptText: questionData.promptText,
          timerSeconds: questionData.timerSeconds,
          answerOptions: questionData.answerOptions,
          correctAnswerIndex: questionData.correctAnswerIndex,
          category: questionData.category,
          sectionTag: questionData.sectionTag,
          testId: test.id,
        },
      });
      console.log(`   ✅ Question ${i + 1}: ${questionData.sectionTag}`);
    }

    // Batch 2: ATTENTION TO DETAIL (10 Questions)
    const attentionQuestions = [
      {
        promptText: `The Stark Industries Config

Format: VS Code with diff viewer

Colleague's Slack message:
"Hey, can you check my deployment config? The staging environment won't start..."

version: '3.8'
services:
  frontend:
    image: stark/jarvis-ui:latest
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:8080
    depends_on:
      - backend
  
  backend:
    image: stark/jarvis-api:latest
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=jarvis_staging
    depends_on:
      - postgress
  
  postgress:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=jarvis_staging
      - POSTGRES_PASSWORD=arc_reactor_2024

Question: "What's preventing startup?"

Click to add review comment:`,
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
        promptText: `The Match Score Validator

Format: API testing interface (Postman-style)

QA Engineer's request:
"This cricket API response is failing validation. Can you spot why?"

Expected Schema:
{
  "matchId": "string",
  "timestamp": "ISO-8601",
  "scoreData": {
    "runs": "number",
    "wickets": "number",
    "overs": "string"
  }
}

Actual Response:
{
  "matchId": "IPL_2024_MI_CSK_045",
  "timestamp": "2024-03-15T19:30:00Z",
  "scoreData": {
    "runs": 186,
    "wickets": "4",
    "overs": "18.3"
  }
}

Select the validation error:`,
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
        promptText: `The Tesla Environment Variables

Format: Terminal environment debugger

DevOps alert:
"Production Tesla app isn't connecting. Compare these environments:"

Production.env:
NODE_ENV=production
API_PORT=8080
DB_HOST=tesla-prod.aws.com
DB_PORT=5432
DB_NAME=autopilot_prod
DB_USER=tesla_app
DB_PASSWORD=M0del3_Secure!2024
REDIS_HOST=tesla-cache.aws.com
REDIS_PORT=6379
LOG_LEVEL=info

Staging.env (working):
NODE_ENV=staging
API_PORT=8080
DB_HOST=tesla-stage.aws.com
DB_PORT=5432
DB_NAME=autopilot_stage
DB_USER=tesla_app
DB_PASS=M0delS_Test!2024
REDIS_HOST=tesla-cache-stage.aws.com
REDIS_PORT=6379
LOG_LEVEL=debug

Question: "What's causing the connection failure?"

Debug options:`,
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
        promptText: `The Commit Message Analyzer

Format: Git log viewer with interactive highlighting

Team lead's review request:
"One of these commits doesn't follow our convention. Which one?"

Commit convention: [TYPE-TICKET] Brief description (max 50 chars)

Recent commits:
[FIX-MCU-234] Fix Iron Man suit power calculation bug
[FEAT-MCU-567] Add Hulk transformation animation
[UPDATE-MCU-891] Refactor Thor's hammer authentication middleware for better performance
[DOC-MCU-345] Update Avengers API documentation
[TEST-MCU-678] Add unit tests for Shield protocols

Flag the non-compliant commit:`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['Line 1', 'Line 2', 'Line 3', 'Line 4'],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText: `The Bollywood Database Inspector

Format: Spreadsheet viewer with anomaly detection

Data analyst's dataset:
"Movie database import showing errors. Find the problematic row?"

MovieID | Title | Director | ReleaseDate | BoxOffice
BW001 | Pathaan | Siddharth Anand | 2023-01-25 | ₹1050.3cr
BW002 | Jawan | Atlee Kumar | 2023-09-07 | ₹1148.32cr
BW003 | Dunki | Rajkumar Hirani | 2023-12-21 | ₹463.38cr
BW004 | Tiger 3 | Maneesh Sharma | 2023-11-12 | ₹466.58rc
BW005 | Gadar 2 | Anil Sharma | 2023-08-11 | ₹687.11cr

Click the row with invalid data:`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['Row 1', 'Row 2', 'Row 3', 'Row 4'],
        correctAnswerIndex: 3,
        sectionTag: 'Data Validation & Pattern Matching',
      },
      {
        promptText: `The API Endpoint Pattern Check

Format: API documentation browser

Backend team's endpoint list:
"We're standardizing our Bollywood streaming API. Which endpoint breaks the pattern?"

Current Endpoints:
GET /api/v2/movies
POST /api/v2/movies
GET /api/v2/movies/{id}
PUT /api/v2/movies/{id}
DELETE /api/v2/movies/{id}

GET /api/v2/artists
POST /api/v2/artists
GET /api/v2/artists/{id}
PUT /api/v2/artists/{id}
DELETE /api/v2/artists/{id}

GET /api/v2/songs
POST /api/v2/song
GET /api/v2/songs/{id}
PUT /api/v2/songs/{id}
DELETE /api/v2/songs/{id}

Spot the inconsistency:`,
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
        promptText: `The Invoice Number Sequence

Format: Accounting system audit interface

Finance team's request:
"Our invoice numbering should follow pattern: YYYY-MM-XXXX (sequential). Find the error."

Recent Invoices:
2024-03-0041  |  March 15, 2024  |  $3,450.00
2024-03-0042  |  March 16, 2024  |  $1,200.00
2024-03-0043  |  March 18, 2024  |  $5,670.00
2024-04-0044  |  March 20, 2024  |  $2,890.00
2024-04-0045  |  April 2, 2024   |  $4,320.00
2024-04-0046  |  April 5, 2024   |  $1,980.00

Click the problematic invoice:`,
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
        promptText: `The Shipping Address Validator

Format: E-commerce order verification system

Customer service alert:
"Customer says they can't complete checkout. Verify their shipping address format."

Address Form Standards:
Line 1: Street number and name
Line 2: Unit/Apt (optional)
City: Text only
State: 2-letter code
ZIP: 5 digits or 5+4 format
Country: 2-letter ISO code

Customer's Input:
Line 1: 4567 Maple Avenue
Line 2: Suite 23-B
City: San Francisco
State: California
ZIP: 94102
Country: US

What needs correction?`,
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
        promptText: `The Password Policy Checker

Format: Security settings validator

IT Security notice:
"New passwords must meet ALL requirements. Which user's password fails validation?"

Password Requirements:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 2 numbers
- At least 1 special character (!@#$%^&*)
- No repeated characters more than twice

Recent Password Changes:
User A: SecurePass#2024!
User B: MyP@ssw0rd123
User C: HelloWorld@2224
User D: P@ssword11Test

Flag the non-compliant password:`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 30,
        answerOptions: ['User A', 'User B', 'User C', 'User D'],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText: `The Temperature Log Anomaly

Format: Sensor data monitoring dashboard

Facility manager's alert:
"Our sensors log every 30 minutes. Find the gap in today's readings."

Temperature Log (°C):
00:00 - 22.5°C
00:30 - 22.3°C
01:00 - 22.4°C
01:30 - 22.2°C
02:00 - 22.1°C
02:30 - 22.0°C
03:00 - 21.9°C
03:30 - 21.8°C
04:00 - 21.7°C
05:00 - 21.5°C
05:30 - 21.4°C
06:00 - 21.6°C

Where's the missing reading?`,
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

    console.log(
      `\n🔄 Creating Batch 2 - ATTENTION TO DETAIL (10 Questions)...`
    );
    for (let i = 0; i < attentionQuestions.length; i++) {
      const questionData = attentionQuestions[i];
      await prisma.question.create({
        data: {
          promptText: questionData.promptText,
          timerSeconds: questionData.timerSeconds,
          answerOptions: questionData.answerOptions,
          correctAnswerIndex: questionData.correctAnswerIndex,
          category: questionData.category,
          sectionTag: questionData.sectionTag,
          testId: test.id,
        },
      });
      console.log(`   ✅ Question ${i + 11}: ${questionData.sectionTag}`);
    }

    console.log(
      `\n🎉 Successfully created Conversational Aptitude Test for Engineering Roles - Part 1!`
    );
    console.log(`📊 Summary so far:`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Questions created: 20`);
    console.log(`   ⏱️  Time per question: 30 seconds`);
    console.log(`\n🔧 Sections covered:`);
    console.log(`   • Verbal Reasoning (10 questions)`);
    console.log(`   • Attention to Detail (10 questions)`);
    console.log(`\n💡 Run the next script to add remaining questions!`);
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
