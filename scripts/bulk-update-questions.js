const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const allQuestions = [
  // VERBAL REASONING (1-10)
  {
    promptText: `### Question 1: The Sprint Review

Format: Slack message from your tech lead

Message:
"Team, our sprint velocity has been impressive, but I'm concerned that our technical debt is accumulating. We need to find a sustainable balance before it becomes unmanageable."

Your colleague asks: "What's the main issue here?"`,
    answerOptions: [
      "We're moving too slowly",
      "We're prioritizing speed over code quality",
      'We need to work faster',
      'Our velocity is too low',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 2: The Stark Industries Feedback

Format: Email thread viewer

Client email:
"The prototype exceeded our expectations in terms of functionality. However, the user interface lacks the polish we've come to expect from your team. We trust you'll iterate on this aspect."

Manager's chat: "How should we interpret this feedback?"`,
    answerOptions: [
      'They love everything about it!',
      'UI needs work, but functionality is great',
      "They're disappointed with everything",
      'They want us to start over',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 3: The Tesla Supplier Communication

Format: Teams message thread

Vendor message:
"Due to unprecedented demand for battery cells, our lead times have extended considerably. While we remain committed to our partnership, we must be transparent about current constraints affecting our supply chain."

Procurement asks you: "What are they really saying?"`,
    answerOptions: [
      'Deliveries will be delayed',
      'They want to end our partnership',
      "They're increasing prices",
      'They have too much inventory',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 4: The IPL Team Manager Hint

Format: 1-on-1 meeting notes

Manager's comment:
"Your technical contributions have been solid. I'd love to see you leverage your expertise to elevate the entire team's capabilities through knowledge sharing and mentorship."

HR chatbot asks: "What growth area is being suggested?"`,
    answerOptions: [
      'Improve technical skills',
      'Take on leadership and teaching responsibilities',
      'Focus more on coding',
      'Work more independently',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 5: The Tech Stack Comparison

Format: Interactive comparison builder

Setup: "Help the new intern understand our tools..."

Prompt: "If Git is to version control what Jira is to _____?"`,
    answerOptions: [
      'bug fixing',
      'project tracking',
      'file storage',
      'code compilation',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 6: The Bollywood Production Analogy

Format: Chat conversation with senior engineer

Senior engineer: "Think of debugging like being Sherlock in a Bollywood mystery, and refactoring like being a film editor. So code review is like being a _____?"`,
    answerOptions: [
      'judge - making final decisions',
      'editor - improving clarity and quality',
      'runner - executing the code',
      'artist - making it beautiful',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 7: The Cricket Strategy Pattern

Format: Team skills matrix builder

Scenario: "Complete the pattern for our job posting..."

Given: "Algorithm design : Problem-solving :: System architecture : ____ ?"`,
    answerOptions: [
      'Big-picture thinking',
      'Debugging skills',
      'Data analysis',
      'Quick coding',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 8: The SpaceX Meeting Dynamics

Format: Virtual meeting transcript

Transcript excerpt:
Product Manager: "We need this feature by Q2." Engineer: "That's technically possible, but..." Product Manager: "Great! I'll tell the stakeholders it's confirmed." Engineer: "Wait, I haven't finished—"

Post-meeting survey: "What communication issue occurred here?"`,
    answerOptions: [
      'The engineer was being negative',
      "The PM didn't listen to the complete response",
      'The timeline was too aggressive',
      'The engineer spoke too quietly',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 9: The Documentation Gap Filler

Format: Wiki editor assistant

Incomplete documentation:
"The system scales horizontally by adding more servers. This _____ approach ensures high availability, unlike vertical scaling which _____ by upgrading existing hardware."`,
    answerOptions: [
      `"distributed" / "grows"`,
      `"complex" / "shrinks"`,
      `"expensive" / "fails"`,
      `"simple" / "improves"`,
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 10: The Mumbai Startup Culture Decoder

Format: Company handbook chatbot

Handbook excerpt:
"We value engineers who challenge assumptions constructively, collaborate across boundaries, and prioritize learning over being right."

Chatbot question: "Which behavior would NOT align with these values?"`,
    answerOptions: [
      "Questioning a senior engineer's design decision respectfully",
      'Working in isolation to prove your solution is best',
      'Partnering with the design team on UI decisions',
      "Admitting you don't know something and asking for help",
    ],
    correctAnswerIndex: 1,
  },
  // ATTENTION TO DETAIL (11-20)
  {
    promptText: `### Question 11: The Stark Industries Config
Format: VS Code with diff viewer

Colleague's Slack message:
"Hey, can you check my deployment config? The staging environment won't start..."

\`\`\`yaml
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
\`\`\`

Question: "What's preventing startup?"`,
    answerOptions: [
      'Port 3000 conflict',
      'Wrong API_URL format',
      "Service name 'postgress' is misspelled",
      'Missing volume mounts',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 12: The Match Score Validator

Format: API testing interface (Postman-style)

QA Engineer's request:
"This cricket API response is failing validation. Can you spot why?"

**Expected Schema:**
\`\`\`json
{
  "matchId": "string",
  "timestamp": "ISO-8601",
  "scoreData": {
    "runs": "number",
    "wickets": "number",
    "overs": "string"
  }
}
\`\`\`

**Actual Response:**
\`\`\`json
{
  "matchId": "IPL_2024_MI_CSK_045",
  "timestamp": "2024-03-15T19:30:00Z",
  "scoreData": {
    "runs": 186,
    "wickets": "4",
    "overs": "18.3"
  }
}
\`\`\`

Select the validation error:`,
    answerOptions: [
      'matchId format incorrect',
      'timestamp not ISO-8601',
      'wickets should be number, not string',
      'Missing required fields',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 13: The Tesla Environment Variables

Format: Terminal environment debugger

DevOps alert:
"Production Tesla app isn't connecting. Compare these environments:"

**Production.env:**
\`\`\`
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
\`\`\`

**Staging.env (working):**
\`\`\`
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
\`\`\`

Question: "What's causing the connection failure?"`,
    answerOptions: [
      'Wrong database port',
      'Invalid password characters',
      'Different env variable name',
      'Missing quotes around password',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 14: The Commit Message Analyzer

Format: Git log viewer with interactive highlighting

Team lead's review request:
"One of these commits doesn't follow our convention. Which one?"

Commit convention: [TYPE-TICKET] Brief description (max 50 chars)

Recent commits:
\`\`\`
[FIX-MCU-234] Fix Iron Man suit power calculation bug
[FEAT-MCU-567] Add Hulk transformation animation
[UPDATE-MCU-891] Refactor Thor's hammer authentication middleware for better performance
[DOC-MCU-345] Update Avengers API documentation
[TEST-MCU-678] Add unit tests for Shield protocols
\`\`\`
Flag the non-compliant commit:`,
    answerOptions: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5'],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 15: The Bollywood Database Inspector

Format: Spreadsheet viewer with anomaly detection

Data analyst's dataset:
"Movie database import showing errors. Find the problematic row?"

| MovieID | Title       | Director        | ReleaseDate | BoxOffice  |
|---------|-------------|-----------------|-------------|------------|
| BW001   | Pathaan     | Siddharth Anand | 2023-01-25  | ₹1050.3cr  |
| BW002   | Jawan       | Atlee Kumar     | 2023-09-07  | ₹1148.32cr |
| BW003   | Dunki       | Rajkumar Hirani | 2023-12-21  | ₹463.38cr  |
| BW004   | Tiger 3     | Maneesh Sharma  | 2023-11-12  | ₹466.58rc  |
| BW005   | Gadar 2     | Anil Sharma     | 2023-08-11  | ₹687.11cr  |

Click the row with invalid data:`,
    answerOptions: ['Row 1', 'Row 2', 'Row 3', 'Row 4', 'Row 5'],
    correctAnswerIndex: 3,
  },
  {
    promptText: `### Question 16: The API Endpoint Pattern Check

Format: API documentation browser

Backend team's endpoint list:
"We're standardizing our Bollywood streaming API. Which endpoint breaks the pattern?"

Current Endpoints:
\`\`\`
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
\`\`\`
Spot the inconsistency:`,
    answerOptions: [
      'GET /api/v2/movies',
      'DELETE /api/v2/artists/{id}',
      'POST /api/v2/song',
      'PUT /api/v2/songs/{id}',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 17: The Invoice Number Sequence

Format: Accounting system audit interface

Finance team's request:
"Our invoice numbering should follow pattern: YYYY-MM-XXXX (sequential). Find the error."

Recent Invoices:
| Invoice Number | Date           | Amount      |
|----------------|----------------|-------------|
| 2024-03-0041   | March 15, 2024 | $3,450.00   |
| 2024-03-0042   | March 16, 2024 | $1,200.00   |
| 2024-03-0043   | March 18, 2024 | $5,670.00   |
| 2024-04-0044   | March 20, 2024 | $2,890.00   |
| 2024-04-0045   | April 2, 2024  | $4,320.00   |
| 2024-04-0046   | April 5, 2024  | $1,980.00   |

Click the problematic invoice:`,
    answerOptions: [
      'Invoice 2024-03-0041',
      'Invoice 2024-03-0042',
      'Invoice 2024-03-0043',
      'Invoice 2024-04-0044',
      'Invoice 2024-04-0045',
      'Invoice 2024-04-0046',
    ],
    correctAnswerIndex: 3,
  },
  {
    promptText: `### Question 18: The Shipping Address Validator

Format: E-commerce order verification system

Customer service alert:
"Customer says they can't complete checkout. Verify their shipping address format."

**Address Form Standards:**
- Line 1: Street number and name
- Line 2: Unit/Apt (optional)
- City: Text only
- State: 2-letter code
- ZIP: 5 digits or 5+4 format
- Country: 2-letter ISO code

**Customer's Input:**
\`\`\`
Line 1: 4567 Maple Avenue
Line 2: Suite 23-B
City: San Francisco
State: California
ZIP: 94102
Country: US
\`\`\`
What needs correction?`,
    answerOptions: [
      'Suite number format',
      'City contains numbers',
      "State should be 'CA' not 'California'",
      'ZIP should include +4',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 19: The Password Policy Checker

Format: Security settings validator

IT Security notice:
"New passwords must meet ALL requirements. Which user's password fails validation?"

**Password Requirements:**
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 2 numbers
- At least 1 special character (!@#$%^&*)
- No repeated characters more than twice

**Recent Password Changes:**
| User | Password         |
|------|------------------|
| A    | SecurePass#2024! |
| B    | MyP@ssw0rd123    |
| C    | HelloWorld@2224  |
| D    | P@ssword11Test   |

Flag the non-compliant password:`,
    answerOptions: ['User A', 'User B', 'User C', 'User D'],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 20: The Temperature Log Anomaly

Format: Sensor data monitoring dashboard

Facility manager's alert:
"Our sensors log every 30 minutes. Find the gap in today's readings."

**Temperature Log (°C):**
\`\`\`
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
\`\`\`
Where's the missing reading?`,
    answerOptions: [
      'Between 03:30 and 04:00',
      'Between 04:00 and 05:00',
      'Between 05:00 and 05:30',
      'Between 05:30 and 06:00',
    ],
    correctAnswerIndex: 1,
  },
  // LOGICAL REASONING (21-30)
  {
    promptText: `### Question 21: The Memory Usage Pattern

Format: Performance monitoring dashboard

System analyst's observation:
"RAM usage spikes follow this pattern: 4, 9, 25, 49, 121, 169, ?"

Predict next spike (GB):`,
    answerOptions: ['225', '289', '256', '361'],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 22: The Database Query Optimizer

Format: Query execution time analyzer

Database admin's log:
"Query optimization times: 2, 5, 11, 23, 47, ?, 191"

Find missing time (ms):`,
    answerOptions: ['95', '94', '96', '93'],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 23: The System Crash Analysis

Format: Incident investigation tool

Post-mortem finding:
"The server crashed at 3 PM. The memory usage graph shows a spike at 2:55 PM. A new feature was deployed at 2:45 PM."

Identify the relationship:`,
    answerOptions: [
      'The crash caused the memory spike',
      'The memory spike caused the crash',
      'The deployment caused both spike and crash',
      'These events are unrelated',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 24: The Code Deployment Schedule

Format: Release planning assistant

DevOps question:
"On which day was the production deployment done?"

Statement I: "Deployment was 3 days after code freeze, which was on Tuesday"
Statement II: "Testing completed on Thursday, deployment was next working day"

Analyze sufficiency:`,
    answerOptions: [
      'Statement I alone is sufficient',
      'Statement II alone is sufficient',
      'Both statements needed',
      'Cannot be determined',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 25: The Remote Work Debate

Format: Policy decision evaluator

Statement: "All developers should be required to work from office at least 3 days a week."

Which is the strongest argument against this?`,
    answerOptions: [
      'Developers prefer working from home',
      'Remote developers have proven equally productive',
      'Office space is expensive to maintain',
      'Some developers live far from the office',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 26: The System Crash Analysis

Format: Incident investigation tool

Post-mortem finding:
"The server crashed at 3 PM. The memory usage graph shows a spike at 2:55 PM. A new feature was deployed at 2:45 PM."

Identify the relationship:`,
    answerOptions: [
      'The crash caused the memory spike',
      'The memory spike caused the crash',
      'The deployment caused both spike and crash',
      'These events are unrelated',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 27: The Framework Logic

Format: Tech stack decision tree

Architecture meeting notes:
"All microservices use Docker. Some Docker applications use Kubernetes. All Kubernetes deployments are cloud-based."

Conclusion checker - which must be true?`,
    answerOptions: [
      'All microservices are cloud-based',
      'Some microservices use Kubernetes',
      'Some cloud deployments are microservices',
      'None of the above must be true',
    ],
    correctAnswerIndex: 3,
  },
  {
    promptText: `### Question 28: The Programming Language Deduction

Format: Skills matrix analyzer

HR database logic:
"No Python developers know COBOL. All full-stack developers know Python. Sarah knows COBOL."

What can we conclude?`,
    answerOptions: [
      'Sarah is not a full-stack developer',
      "Sarah doesn't know Python",
      'Sarah is a backend developer',
      'Both A and B are correct',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 29: The Office Navigation Puzzle

Format: Floor plan navigator

Facilities message:
"From the entrance, walk 10m North to reach the lobby. Turn East and walk 15m to the cafeteria. From there, walk 10m South, then 20m West to reach the server room. How far and in which direction is the server room from the entrance?"

Calculate displacement:`,
    answerOptions: ['5m West', '5m East', '10m Northwest', '5m Southwest'],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 30: The Tech Team Family

Format: Team introduction puzzle

New hire orientation:
"Pointing to a photo, the CTO says: 'This person's father is my father's only son.' The person in the photo is our new DevOps engineer. How is the DevOps engineer related to the CTO?"

Identify relationship:`,
    answerOptions: ['Son', 'Daughter', 'Nephew', 'Could be son or daughter'],
    correctAnswerIndex: 3,
  },
  // NUMERICAL (31-37)
  {
    promptText: `### Question 31: The Sprint Velocity Dashboard

Format: Agile metrics analyzer

Scrum master's dashboard:
**Sprint Performance Over 6 Months**
| Month | Story Points Completed | Team Size | Bugs Found |
|-------|------------------------|-----------|------------|
| Jan   | 80                     | 5         | 12         |
| Feb   | 96                     | 6         | 15         |
| Mar   | 105                    | 6         | 14         |
| Apr   | 84                     | 7         | 18         |
| May   | 91                     | 7         | 16         |
| Jun   | 108                    | 8         | 20         |

Question: "What was the average story points per team member in Q1 (Jan-Mar)?"`,
    answerOptions: [
      '16.5 points/person',
      '17.0 points/person',
      '16.0 points/person',
      '15.5 points/person',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 32: The Server Load Distribution

Format: Infrastructure monitoring chart

DevOps team's pie chart:
Server Resource Allocation (Total: 480GB RAM)
- Production Servers: 35%
- Development Servers: 25%
- Testing Servers: 20%
- Staging Servers: 15%
- Backup Servers: 5%

Question: "If we need to increase Testing servers by 48GB, what will be their new percentage of total allocation?"`,
    answerOptions: ['28%', '30%', '27%', '25%'],
    correctAnswerIndex: 1, // Corrected from list. Old answer was 27%. New calculation: 20% of 480 is 96. 96+48=144. New total RAM is not specified to increase, so 144/480 = 30%.
  },
  {
    promptText: `### Question 33: The Code Coverage Analysis

Format: Testing metrics calculator

QA Lead's report:
"Our codebase has 12,000 lines of code. Current test coverage:
- Unit tests cover 4,800 lines
- Integration tests cover 3,600 lines
- 2,400 lines are covered by both test types
What percentage of code remains untested?"`,
    answerOptions: ['40%', '45%', '50%', '55%'],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 34: The Cloud Cost Optimization

Format: AWS billing analyzer

FinOps report:
"Monthly cloud costs for Q1:
- January: $24,000 (20% over budget)
- February: $22,000 (10% over budget)
- March: $19,000 (5% under budget)
What was the total Q1 budget?"`,
    answerOptions: ['$60,000', '$62,000', '$64,000', '$66,000'],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 35: The User Growth Projection

Format: Analytics dashboard predictor

Product manager's data:
"Monthly active users (MAU) growth:
- Month 1: 10,000 MAU
- Month 2: 12,000 MAU
- Month 3: 14,400 MAU
Following this growth pattern, what's the expected MAU in Month 5?"`,
    answerOptions: ['17,280', '20,736', '19,200', '24,883'],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 36: Monthly Bug Count

Format: Bug tracking dashboard

QA Dashboard - Bugs Found Per Month:
- Jan: 40
- Feb: 30
- Mar: 60
- Apr: 20

Question: "What percentage of Q1 bugs were found in March?"`,
    answerOptions: ['46%', '50%', '54%', '60%'],
    correctAnswerIndex: 0, // Corrected: 60 / (40+30+60) = 60/130 = 0.4615... ~46%
  },
  {
    promptText: `### Question 37: Deployment Speed

Format: CI/CD metrics

Pipeline Performance:
"5 deployments completed in 2 hours"

Question: "At this rate, how many deployments in 8 hours?"`,
    answerOptions: ['15', '18', '20', '24'],
    correctAnswerIndex: 2,
  },
  // GK (41-50)
  {
    promptText: `### Question 41: GK

What does the acronym "DRDO" stand for?`,
    answerOptions: [
      'Defence Robotics Development Organization',
      'Defence Research and Development Organisation',
      'Drone Research and Design Office',
      'Defence Resources and Deployment Organization',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 42: GK

What is the name of India's first indigenous aircraft carrier?`,
    answerOptions: [
      'INS Vikramaditya',
      'INS Viraat',
      'INS Vikrant',
      'INS Vishal',
    ],
    correctAnswerIndex: 2,
  },
  {
    promptText: `### Question 43: GK

Who is the current Defence Minister of India?`,
    answerOptions: [
      'Amit Shah',
      'Rajnath Singh',
      'S. Jaishankar',
      'Nirmala Sitharaman',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 44: GK

Who is the current Vice President of India?`,
    answerOptions: [
      'Venkaiah Naidu',
      'Jagdeep Dhankhar',
      'Droupadi Murmu',
      'Om Birla',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 45: GK

What is the highest rank in the Indian Army?`,
    answerOptions: [
      'General',
      'Field Marshal',
      'Lieutenant General',
      'Major General',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 46: GK

Which is the highest peacetime gallantry award in India?`,
    answerOptions: [
      'Param Vir Chakra',
      'Ashoka Chakra',
      'Kirti Chakra',
      'Shaurya Chakra',
    ],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 47: GK

How many Field Marshals has India had?`,
    answerOptions: ['One', 'Two', 'Three', 'Four'],
    correctAnswerIndex: 1,
  },
  {
    promptText: `### Question 48: GK

What is the motto of the Indian Army?`,
    answerOptions: [
      'Service Before Self',
      'Duty, Honor, Country',
      'Victory is Ours',
      'Nation First, Always and Every Time',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 49: GK

What is the motto of the Indian Air Force?`,
    answerOptions: [
      'Touch the Sky with Glory',
      'Fly High, Strike Hard',
      'Guardians of the Sky',
      'Wings of Steel',
    ],
    correctAnswerIndex: 0,
  },
  {
    promptText: `### Question 50: GK

What is the motto of the Indian Navy?`,
    answerOptions: [
      'Brave on the Seas',
      'May the Lord of the Water be Auspicious Unto Us',
      'Defenders of the Deep',
      'Silent Service',
    ],
    correctAnswerIndex: 1,
  },
];

async function main() {
  const test = await prisma.test.findFirst({
    where: { title: 'Conversational Aptitude Test for Engineering Roles' },
    include: {
      questions: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!test) {
    console.error('Test not found!');
    return;
  }

  // Map questions to their target indices
  const questionUpdateMap = new Map();
  allQuestions.forEach((q, index) => {
    let targetDbIndex;
    if (index < 37) {
      // Questions 1-37
      targetDbIndex = index;
    } else {
      // Questions 41-50 are mapped to indices 40-49
      targetDbIndex = index + 3;
    }
    questionUpdateMap.set(targetDbIndex, q);
  });

  for (let i = 0; i < test.questions.length; i++) {
    if (questionUpdateMap.has(i)) {
      const questionToUpdate = test.questions[i];
      const newQuestionData = questionUpdateMap.get(i);

      await prisma.question.update({
        where: { id: questionToUpdate.id },
        data: {
          promptText: newQuestionData.promptText,
          answerOptions: newQuestionData.answerOptions,
          correctAnswerIndex: newQuestionData.correctAnswerIndex,
        },
      });
      console.log(`Updated question at index ${i} (DB Question ${i + 1})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
