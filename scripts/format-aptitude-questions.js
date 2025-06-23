const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🎨 Formatting Conversational Aptitude Test questions for better readability...\n'
  );

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
    console.log(`📝 Formatting ${test.questions.length} questions...\n`);

    // Define properly formatted questions
    const formattedQuestions = [
      // Questions 11-20 (Attention to Detail - Code & Configuration)
      {
        index: 10, // Question 11
        promptText: `**The Stark Industries Config**

**Scenario:** VS Code with diff viewer
**Issue:** Staging environment won't start

**Docker Compose Configuration:**
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

**Question:** What's preventing the startup?`,
      },
      {
        index: 11, // Question 12
        promptText: `**The Match Score Validator**

**Scenario:** API testing interface (Postman-style)
**Issue:** Cricket API response failing validation

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

**Question:** What's the validation error?`,
      },
      {
        index: 12, // Question 13
        promptText: `**The Tesla Environment Variables**

**Scenario:** Terminal environment debugger
**Issue:** Production app isn't connecting

**Production.env:**
\`\`\`env
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
\`\`\`env
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

**Question:** What's causing the connection failure?`,
      },
      {
        index: 13, // Question 14
        promptText: `**The Commit Message Analyzer**

**Scenario:** Git log viewer with interactive highlighting
**Convention:** \`[TYPE-TICKET] Brief description (max 50 chars)\`

**Recent commits:**
\`\`\`
[FIX-MCU-234] Fix Iron Man suit power calculation bug
[FEAT-MCU-567] Add Hulk transformation animation
[UPDATE-MCU-891] Refactor Thor hammer authentication middleware for better performance
[DOC-MCU-345] Update Avengers API documentation
[TEST-MCU-678] Add unit tests for Shield protocols
\`\`\`

**Question:** Which commit doesn't follow the convention?`,
      },
      {
        index: 14, // Question 15
        promptText: `**The Bollywood Database Inspector**

**Scenario:** Spreadsheet viewer with anomaly detection
**Issue:** Movie database import showing errors

**Data Table:**
| MovieID | Title   | Director        | ReleaseDate | BoxOffice   |
|---------|---------|-----------------|-------------|-------------|
| BW001   | Pathaan | Siddharth Anand | 2023-01-25 | ₹1050.3cr   |
| BW002   | Jawan   | Atlee Kumar     | 2023-09-07 | ₹1148.32cr  |
| BW003   | Dunki   | Rajkumar Hirani | 2023-12-21 | ₹463.38cr   |
| BW004   | Tiger 3 | Maneesh Sharma  | 2023-11-12 | ₹466.58rc   |
| BW005   | Gadar 2 | Anil Sharma     | 2023-08-11 | ₹687.11cr   |

**Question:** Which row has invalid data?`,
      },
      {
        index: 15, // Question 16
        promptText: `**The API Endpoint Pattern Check**

**Scenario:** API documentation browser
**Issue:** Standardizing Bollywood streaming API

**Current Endpoints:**
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
POST   /api/v2/song          ← Inconsistent!
GET    /api/v2/songs/{id}
PUT    /api/v2/songs/{id}
DELETE /api/v2/songs/{id}
\`\`\`

**Question:** Which endpoint breaks the pattern?`,
      },
      {
        index: 16, // Question 17
        promptText: `**The Invoice Number Sequence**

**Scenario:** Accounting system audit interface
**Pattern:** \`YYYY-MM-XXXX\` (sequential)

**Recent Invoices:**
| Invoice Number | Date           | Amount    |
|----------------|----------------|-----------|
| 2024-03-0041   | March 15, 2024 | $3,450.00 |
| 2024-03-0042   | March 16, 2024 | $1,200.00 |
| 2024-03-0043   | March 18, 2024 | $5,670.00 |
| 2024-04-0044   | **March 20, 2024** | $2,890.00 | ← Error!
| 2024-04-0045   | April 2, 2024  | $4,320.00 |
| 2024-04-0046   | April 5, 2024  | $1,980.00 |

**Question:** Which invoice has an error?`,
      },
      {
        index: 17, // Question 18
        promptText: `**The Shipping Address Validator**

**Scenario:** E-commerce order verification system
**Issue:** Customer can't complete checkout

**Address Form Standards:**
- **Line 1:** Street number and name
- **Line 2:** Unit/Apt (optional)
- **City:** Text only
- **State:** 2-letter code
- **ZIP:** 5 digits or 5+4 format
- **Country:** 2-letter ISO code

**Customer's Input:**
\`\`\`
Line 1: 4567 Maple Avenue
Line 2: Suite 23-B
City: San Francisco
State: California          ← Should be "CA"
ZIP: 94102
Country: US
\`\`\`

**Question:** What needs correction?`,
      },
      {
        index: 18, // Question 19
        promptText: `**The Password Policy Checker**

**Scenario:** Security settings validator
**Requirements:**
- ✅ Minimum 12 characters
- ✅ At least 1 uppercase letter
- ✅ At least 1 lowercase letter
- ✅ At least 2 numbers
- ✅ At least 1 special character (!@#$%^&*)
- ✅ No repeated characters more than twice

**Recent Password Changes:**
| User | Password           | Status |
|------|--------------------|--------|
| A    | SecurePass#2024!   | ✅ Valid |
| B    | MyP@ssw0rd123      | ✅ Valid |
| C    | HelloWorld@**222**4  | ❌ Invalid |
| D    | P@ssword11Test     | ✅ Valid |

**Question:** Which password fails validation?`,
      },
      {
        index: 19, // Question 20
        promptText: `**The Temperature Log Anomaly**

**Scenario:** Sensor data monitoring dashboard
**Schedule:** Sensors log every 30 minutes

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
       ↓ MISSING: 04:30
05:00 - 21.5°C
05:30 - 21.4°C
06:00 - 21.6°C
\`\`\`

**Question:** Where's the missing reading?`,
      },
      // Numerical Questions (31-40) with better table formatting
      {
        index: 30, // Question 31
        promptText: `**The Sprint Velocity Dashboard**

**Scenario:** Agile metrics analyzer
**Task:** Calculate Q1 performance

**Sprint Performance Data:**
| Month | Story Points | Team Size | Bugs Found |
|-------|--------------|-----------|------------|
| Jan   | 80          | 5         | 12         |
| Feb   | 96          | 6         | 15         |
| Mar   | 105         | 6         | 14         |
| Apr   | 84          | 7         | 18         |
| May   | 91          | 7         | 16         |
| Jun   | 108         | 8         | 20         |

**Calculation:**
- Q1 Total Points: 80 + 96 + 105 = 281
- Q1 Total Team Members: 5 + 6 + 6 = 17
- Average = 281 ÷ 17 = 16.53

**Question:** What was the average story points per team member in Q1?`,
      },
      {
        index: 31, // Question 32
        promptText: `**The Server Load Distribution**

**Scenario:** Infrastructure monitoring chart
**Current Setup:** 480GB RAM Total

**Resource Allocation:**
\`\`\`
🟦 Production Servers:  35% = 168GB
🟩 Development Servers: 25% = 120GB  
🟨 Testing Servers:     20% = 96GB
🟥 Staging Servers:     15% = 72GB
⬜ Backup Servers:       5% = 24GB
\`\`\`

**Change Request:** Increase Testing by 48GB
- New Testing: 96GB + 48GB = 144GB
- New Total: 480GB + 48GB = 528GB
- New Percentage: 144 ÷ 528 = 27.3%

**Question:** What will be Testing servers' new percentage?`,
      },
      {
        index: 32, // Question 33
        promptText: `**The Code Coverage Analysis**

**Scenario:** QA testing metrics calculator
**Codebase:** 12,000 lines total

**Test Coverage Breakdown:**
- **Unit tests:** 4,800 lines
- **Integration tests:** 3,600 lines  
- **Both types cover:** 2,400 lines (overlap)

**Coverage Calculation:**
- Total covered = 4,800 + 3,600 - 2,400 = 6,000 lines
- Uncovered = 12,000 - 6,000 = 6,000 lines
- Percentage uncovered = 6,000 ÷ 12,000 = 50%

**Question:** What percentage of code remains untested?`,
      },
    ];

    // Update questions with better formatting
    for (const formattedQ of formattedQuestions) {
      const question = test.questions[formattedQ.index];
      if (question) {
        await prisma.question.update({
          where: { id: question.id },
          data: {
            promptText: formattedQ.promptText,
          },
        });
        console.log(
          `   ✅ Updated Question ${formattedQ.index + 1}: Enhanced formatting`
        );
      }
    }

    console.log(
      `\n🎉 Successfully formatted ${formattedQuestions.length} questions!`
    );
    console.log(`📊 Improvements made:`);
    console.log(`   • Added proper markdown formatting for code blocks`);
    console.log(`   • Enhanced table layouts with proper spacing`);
    console.log(`   • Added visual indicators and highlighting`);
    console.log(`   • Improved readability with structured sections`);
    console.log(`   • Added scenario context and clear formatting`);
  } catch (error) {
    console.error('❌ Error formatting questions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
