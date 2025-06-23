const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Questions 11-20 formatting...\n');

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
    console.log(`🔧 Fixing questions 11-20...\n`);

    // Define properly formatted questions 11-20 (Attention to Detail)
    const fixedQuestions = [
      {
        index: 10, // Question 11
        promptText: `**Docker Configuration Issue**

The staging environment won't start. Review this docker-compose.yml:

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

What's preventing the startup?`,
      },
      {
        index: 11, // Question 12
        promptText: `**API Response Validation**

The cricket API response is failing validation.

Expected Schema:
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

Actual Response:
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

What's the validation error?`,
      },
      {
        index: 12, // Question 13
        promptText: `**Environment Variable Issue**

Production app isn't connecting. Compare these environment files:

Production.env:
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

Staging.env (working):
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

What's causing the connection failure?`,
      },
      {
        index: 13, // Question 14
        promptText: `**Git Commit Convention**

Review these commit messages. Convention: [TYPE-TICKET] Brief description (max 50 chars)

\`\`\`
[FIX-MCU-234] Fix Iron Man suit power calculation bug
[FEAT-MCU-567] Add Hulk transformation animation
[UPDATE-MCU-891] Refactor Thor hammer authentication middleware for better performance
[DOC-MCU-345] Update Avengers API documentation
[TEST-MCU-678] Add unit tests for Shield protocols
\`\`\`

Which commit doesn't follow the convention?`,
      },
      {
        index: 14, // Question 15
        promptText: `**Database Import Error**

Movie database import is showing errors:

| MovieID | Title   | Director        | ReleaseDate | BoxOffice   |
|---------|---------|-----------------|-------------|-------------|
| BW001   | Pathaan | Siddharth Anand | 2023-01-25 | ₹1050.3cr   |
| BW002   | Jawan   | Atlee Kumar     | 2023-09-07 | ₹1148.32cr  |
| BW003   | Dunki   | Rajkumar Hirani | 2023-12-21 | ₹463.38cr   |
| BW004   | Tiger 3 | Maneesh Sharma  | 2023-11-12 | ₹466.58rc   |
| BW005   | Gadar 2 | Anil Sharma     | 2023-08-11 | ₹687.11cr   |

Which row has invalid data?`,
      },
      {
        index: 15, // Question 16
        promptText: `**API Endpoint Pattern**

Review the API endpoints for consistency:

\`\`\`
Movies:
GET    /api/v2/movies
POST   /api/v2/movies
GET    /api/v2/movies/{id}
PUT    /api/v2/movies/{id}
DELETE /api/v2/movies/{id}

Artists:
GET    /api/v2/artists
POST   /api/v2/artists
GET    /api/v2/artists/{id}
PUT    /api/v2/artists/{id}
DELETE /api/v2/artists/{id}

Songs:
GET    /api/v2/songs
POST   /api/v2/song
GET    /api/v2/songs/{id}
PUT    /api/v2/songs/{id}
DELETE /api/v2/songs/{id}
\`\`\`

Which endpoint breaks the pattern?`,
      },
      {
        index: 16, // Question 17
        promptText: `**Invoice Number Sequence**

Review the invoice numbering pattern: YYYY-MM-XXXX (sequential)

| Invoice Number | Date           | Amount    |
|----------------|----------------|-----------|
| 2024-03-0041   | March 15, 2024 | $3,450.00 |
| 2024-03-0042   | March 16, 2024 | $1,200.00 |
| 2024-03-0043   | March 18, 2024 | $5,670.00 |
| 2024-04-0044   | March 20, 2024 | $2,890.00 |
| 2024-04-0045   | April 2, 2024  | $4,320.00 |
| 2024-04-0046   | April 5, 2024  | $1,980.00 |

Which invoice has an error?`,
      },
      {
        index: 17, // Question 18
        promptText: `**Address Validation**

Customer can't complete checkout. Review the address form standards:

Standards:
- Line 1: Street number and name
- Line 2: Unit/Apt (optional)
- City: Text only
- State: 2-letter code
- ZIP: 5 digits or 5+4 format
- Country: 2-letter ISO code

Customer's Input:
\`\`\`
Line 1: 4567 Maple Avenue
Line 2: Suite 23-B
City: San Francisco
State: California
ZIP: 94102
Country: US
\`\`\`

What needs correction?`,
      },
      {
        index: 18, // Question 19
        promptText: `**Password Policy Validation**

Review password requirements and recent changes:

Requirements:
- Minimum 12 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 2 numbers
- At least 1 special character (!@#$%^&*)
- No repeated characters more than twice

| User | Password           | Status |
|------|--------------------|--------|
| A    | SecurePass#2024!   | Valid  |
| B    | MyP@ssw0rd123      | Valid  |
| C    | HelloWorld@2224    | Invalid|
| D    | P@ssword11Test     | Valid  |

Which password fails validation?`,
      },
      {
        index: 19, // Question 20
        promptText: `**Temperature Log Analysis**

Sensors log every 30 minutes. Review this temperature log:

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

What time is missing a reading?`,
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
          `   ✅ Fixed Question ${fixedQ.index + 1}: Clean code blocks and tables`
        );
      }
    }

    console.log(`\n🎉 Successfully fixed ${fixedQuestions.length} questions!`);
    console.log(`📊 Improvements made:`);
    console.log(`   • Proper code block formatting (vertical display)`);
    console.log(`   • Clean table layouts with borders`);
    console.log(`   • Removed all reasoning and explanations`);
    console.log(`   • Minimal bold text (titles only)`);
    console.log(`   • No horizontal scrolling needed`);
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
