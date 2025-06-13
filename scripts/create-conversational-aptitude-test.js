#!/usr/bin/env node

/**
 * Script to create the Complete Conversational Aptitude Test for Engineering Roles
 * This script creates a comprehensive test with 40 questions across 4 categories
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating Conversational Aptitude Test for Engineering Roles...\n'
  );

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@testplatform.com',
          passwordHash: 'admin', // In real app, this would be hashed
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Complete Conversational Aptitude Test for Engineering Roles',
        description:
          'A comprehensive assessment covering verbal reasoning, logical reasoning, numerical reasoning, and attention to detail - designed for engineering roles with modern interactive formats.',
        overallTimeLimitSeconds: 3600, // 60 minutes total
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all questions with their data
    const questions = [
      // VERBAL REASONING (10 Questions)
      {
        promptText:
          'The Sprint Review\n\nSlack message from your tech lead:\n"Team, our sprint velocity has been impressive, but I\'m concerned that our technical debt is accumulating. We need to find a sustainable balance before it becomes unmanageable."\n\nYour colleague asks: "What\'s the main issue here?"\n\nWhat\'s the correct interpretation?',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          "😄 We're moving too slowly",
          "🎯 We're prioritizing speed over code quality",
          '🔧 We need to work faster',
          '📊 Our velocity is too low',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Stark Industries Feedback\n\nClient email:\n"The prototype exceeded our expectations in terms of functionality. However, the user interface lacks the polish we\'ve come to expect from your team. We trust you\'ll iterate on this aspect."\n\nManager\'s chat: "How should we interpret this feedback?"\n\nWhat\'s the best response?',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          '💪 They love everything about it!',
          '🎨 UI needs work, but functionality is great',
          "😟 They're disappointed with everything",
          '🔄 They want us to start over',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Tesla Supplier Communication\n\nVendor message:\n"Due to unprecedented demand for battery cells, our lead times have extended considerably. While we remain committed to our partnership, we must be transparent about current constraints affecting our supply chain."\n\nProcurement asks you: "What are they really saying?"\n\nSelect the correct interpretation:',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          '⏰ Deliveries will be delayed',
          '🤝 They want to end our partnership',
          "💰 They're increasing prices",
          '📦 They have too much inventory',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The IPL Team Manager Hint\n\n1-on-1 meeting notes:\nManager\'s comment: "Your technical contributions have been solid. I\'d love to see you leverage your expertise to elevate the entire team\'s capabilities through knowledge sharing and mentorship."\n\nHR chatbot asks: "What growth area is being suggested?"\n\nWhat\'s the manager suggesting?',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          '📚 Improve technical skills',
          '👥 Take on leadership and teaching responsibilities',
          '💻 Focus more on coding',
          '📉 Work more independently',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Email/Message Interpretation',
      },
      {
        promptText:
          'The Tech Stack Comparison\n\nSetup: "Help the new intern understand our tools..."\n\nPrompt: "If Git is to version control what Jira is to _____?"\n\nComplete the analogy:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '🔧 bug fixing',
          '📋 project tracking',
          '💾 file storage',
          '🏗️ code compilation',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The Bollywood Production Analogy\n\nSenior engineer: "Think of debugging like being Sherlock in a Bollywood mystery, and refactoring like being a film editor. So code review is like being a _____?"\n\nComplete the pattern:',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '👨‍⚖️ judge - making final decisions',
          '📝 editor - improving clarity and quality',
          '🏃 runner - executing the code',
          '🎨 artist - making it beautiful',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The Cricket Strategy Pattern\n\nScenario: "Complete the pattern for our job posting..."\n\nGiven: "Algorithm design : Problem-solving :: System architecture : ____ ?"\n\nWhat completes this analogy?',
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '🧩 Big-picture thinking',
          '🔍 Debugging skills',
          '📊 Data analysis',
          '⚡ Quick coding',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Analogy & Relationship Builders',
      },
      {
        promptText:
          'The SpaceX Meeting Dynamics\n\nTranscript excerpt:\nProduct Manager: "We need this feature by Q2."\nEngineer: "That\'s technically possible, but..."\nProduct Manager: "Great! I\'ll tell the stakeholders it\'s confirmed."\nEngineer: "Wait, I haven\'t finished—"\n\nPost-meeting survey: "What communication issue occurred here?"',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          '🚫 The engineer was being negative',
          "👂 The PM didn't listen to the complete response",
          '⏰ The timeline was too aggressive',
          '🤐 The engineer spoke too quietly',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference Questions',
      },
      {
        promptText:
          'The Documentation Gap Filler\n\nIncomplete documentation:\n"The system scales horizontally by adding more servers. This _____ approach ensures high availability, unlike vertical scaling which _____ by upgrading existing hardware."\n\nSelect the two words that best complete this:',
        category: 'VERBAL',
        timerSeconds: 45,
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
          'The Mumbai Startup Culture Decoder\n\nHandbook excerpt:\n"We value engineers who challenge assumptions constructively, collaborate across boundaries, and prioritize learning over being right."\n\nChatbot question: "Which behavior would NOT align with these values?"',
        category: 'VERBAL',
        timerSeconds: 45,
        answerOptions: [
          "🤔 Questioning a senior engineer's design decision respectfully",
          '🚪 Working in isolation to prove your solution is best',
          '🤝 Partnering with the design team on UI decisions',
          "📚 Admitting you don't know something and asking for help",
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference Questions',
      },

      // LOGICAL REASONING (10 Questions)
      {
        promptText:
          'The Rocket Launch Sequence\n\nDevOps Chat:\n"Our SpaceX-inspired deployment pipeline has these dependencies:\n- Stage-1 Testing must complete before Stage-2 can begin\n- Stage-2 needs either Integration Tests OR Load Tests (not both - server limitation)\n- Production launch requires Stage-2 + Security Clearance\n- Security Clearance only happens after Integration Tests finish"\n\nCurrent Status:\n✅ Stage-1 Testing: Complete\n⏸️ Integration Tests: Not started\n❓ Security Clearance: Waiting\n🚀 Stage-2: Ready\n\nWhat can we deploy now?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '📦 Stage-2 only',
          '🚀 Both Stage-2 and Production',
          '🔒 Nothing - need Security first',
          '⏳ Must complete Integration Tests',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'System Dependencies & Workflow Logic',
      },
      {
        promptText:
          'The T20 Stadium Booking Logic\n\nIPL Venue Manager\'s message:\n"Stadium booking rules for tech events:\n- Wankhede Stadium: Needs Mumbai office approval OR CEO presence\n- Eden Gardens: Available when (Attendees < 5000) AND (Not weekend)\n- Chinnaswamy: Requires AV setup booking + Tech team confirmed\n- If Wankhede is booked, Eden Gardens blocks 4-hour window"\n\nYour tech conference details:\n- 3000 attendees\n- Wednesday 3 PM\n- Mumbai office approved\n- No special AV needed\n- Wankhede is available\n\nWhich venues can you book?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '🏟️ Wankhede only',
          '🏟️ Wankhede and Eden Gardens',
          '🏟️ All venues',
          '🏟️ Wankhede and Chinnaswamy',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'System Dependencies & Workflow Logic',
      },
      {
        promptText:
          'The Jarvis System Dependencies\n\nSystem Alert:\n"AI Assistant dependencies detected:\n- Voice Interface → Neural Processor → Response Engine\n- Response Engine → Knowledge Base OR Cache Memory\n- Full Monitoring needs all components active\n- If Neural Processor fails, Backup kicks in but Monitoring stops"\n\nIncident Report: "Neural Processor just crashed"\n\nWhat\'s our system status?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '🟢 Everything running on Backup',
          '🟡 Voice working but no Monitoring',
          '🔴 Complete system down',
          '🟠 Only Knowledge Base affected',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'System Dependencies & Workflow Logic',
      },
      {
        promptText:
          'The Film Production Access Control\n\nDharma Productions security explains:\n"Set access rules:\n- Director access = Department head + Security badge + Biometric enrolled\n- Crew access = Team assignment + Daily pass\n- Visitor access = Guest badge + Escort required\n- If Director access active, Crew access auto-revoked (protocol)"\n\nCheck Karan\'s credentials:\n✓ Department head\n✓ Security badge\n✗ Biometric not enrolled\n✓ Daily pass issued\n\nWhat access can Karan have?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '🎬 Director (just needs biometric)',
          '🎭 Crew only',
          '🎪 Both Director and Crew',
          '🚫 No access currently',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'System Dependencies & Workflow Logic',
      },
      {
        promptText:
          "The Marvel Phase Planning\n\nKevin Feige's rules for project sequence:\n\"Production must follow this order:\n- Script Approval before any Filming\n- Principal Photography before VFX\n- VFX immediately after Principal Photography\n- Marketing can't be last\n- Post-Production between VFX and Final Cut\"\n\nAvailable phases: Script Approval | Principal Photography | VFX | Post-Production | Final Cut | Marketing\n\nWhat's a valid production sequence?",
        category: 'LOGICAL',
        timerSeconds: 45,
        answerOptions: [
          'Script → Principal → VFX → Post → Marketing → Final Cut',
          'Script → Principal → VFX → Post → Final Cut → Marketing',
          'Script → Marketing → Principal → VFX → Post → Final Cut',
          'Marketing → Script → Principal → VFX → Post → Final Cut',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Sequential Logic & Patterns',
      },
      {
        promptText:
          'The Tesla Gigafactory Staffing\n\nHR Manager\'s message:\n"Factory staffing formula:\n- Every Battery line needs 4 engineers\n- Motor assembly needs 1.5x Battery engineers\n- Quality Control needs same as Motor assembly\n- Supervisors need 1/4 of total engineer count"\n\nCurrent plan: "3 Battery lines operational"\n\nTotal staff needed?',
        category: 'LOGICAL',
        timerSeconds: 45,
        answerOptions: [
          '👥 42 people',
          '👥 48 people',
          '👥 54 people',
          '👥 60 people',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Sequential Logic & Patterns',
      },
      {
        promptText:
          'The Software Version Pattern\n\nTech Lead explains:\n"Our versioning follows:\n- Major.Minor.Patch format\n- Major release resets Minor and Patch to 0\n- Minor release resets only Patch to 0\n- Hotfixes increment Patch only"\n\nCurrent version: 3.2.7\nScenario: "Shipping new feature (Minor) then fixing critical bug"\n\nFinal version after both updates?',
        category: 'LOGICAL',
        timerSeconds: 45,
        answerOptions: ['📌 3.3.1', '📌 4.0.0', '📌 3.2.8', '📌 3.3.0'],
        correctAnswerIndex: 0,
        sectionTag: 'Sequential Logic & Patterns',
      },
      {
        promptText:
          "The Debugging Mystery\n\nQA Team's report:\n\"Three developers worked on the broken module:\n- Amit says: 'Raj's commit broke it'\n- Raj says: 'It wasn't me or Priya'\n- Priya says: 'Amit is lying'\n\nOnly one person is telling the truth.\"\n\nWho caused the bug?",
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '🔍 Amit caused it',
          '🔍 Raj caused it',
          '🔍 Priya caused it',
          '🔍 Cannot determine',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Truth Tables & Elimination Logic',
      },
      {
        promptText:
          'The Cloud Service Selection\n\nRequirements:\n"Need a service that:\n- Supports Docker OR Kubernetes (not both - license restriction)\n- Has GPU for AI workloads\n- Costs < ₹40,000/month OR includes support"\n\nOptions:\n- Service A: Docker ✓, K8s ✗, GPU ✓, ₹50,000/month, Support ✓\n- Service B: Docker ✓, K8s ✓, GPU ✗, ₹35,000/month, Support ✗\n- Service C: Docker ✗, K8s ✓, GPU ✓, ₹38,000/month, Support ✗\n- Service D: Docker ✓, K8s ✗, GPU ✗, ₹25,000/month, Support ✗\n\nAI workload planned: Yes\n\nWhich services work?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '☑️ Only A',
          '☑️ A and C',
          '☑️ C and D',
          '☑️ None qualify',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Truth Tables & Elimination Logic',
      },
      {
        promptText:
          'The Code Review Logic Puzzle\n\nReview feedback:\n"Four reviewers checked the code:\n- Either Rahul OR Neha found the memory leak (not both)\n- If Vikram found issues, then Sneha found none\n- Sneha found exactly 3 bugs\n- The memory leak was the only critical bug"\n\nWhat must be true?',
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          '✓ Rahul found the memory leak',
          '✓ Vikram found no issues and Sneha found non-critical bugs',
          '✓ Neha found the memory leak',
          '✓ All reviewers found issues',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Truth Tables & Elimination Logic',
      },

      // NUMERICAL REASONING (10 Questions)
      {
        promptText:
          'The Starlink Cost Calculator\n\nSpaceX Finance Manager\'s Slack:\n"Quick update on our satellite internet expansion:\n- Current: $15,000/month operational cost\n- User base grew 40% last quarter\n- Costs scale at 75% of user growth (efficiency gains!)\n- Elon wants projection for next quarter with same growth rate"\n\nWhat should we budget for next quarter?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: ['💰 $18,500', '💰 $19,500', '💰 $20,250', '💰 $21,000'],
        correctAnswerIndex: 1,
        sectionTag: 'Resource Planning & Optimization',
      },
      {
        promptText:
          'The IPL Team Performance Tracker\n\nMumbai Indians analyst\'s report:\n"Team run rate over last 5 matches:\n- Match 1: 8.5 runs/over\n- Match 2: 9.2 runs/over\n- Match 3: 8.8 runs/over\n- Match 4: 9.6 runs/over\n- Match 5: 9.4 runs/over\n\nNeed average of 9.5 runs/over in next 3 matches to qualify. Can we make it?"\n\nYour analysis:',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '📈 Yes, we average 9.1 and need 9.5',
          '📊 Yes, we average 9.5 exactly',
          '📉 No, we average 9.1 and need 9.5',
          '✅ Close call, but recent form shows improvement',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Resource Planning & Optimization',
      },
      {
        promptText:
          'The Marvel Server Capacity\n\nDisney+ SRE message:\n"MCU release day planning:\n- 4 servers: each handles 50,000 concurrent streams\n- Current load: 160,000 viewers (80% capacity)\n- New Avengers trailer expects 3x normal traffic\n- Each new server takes 45 min to provision\n- Servers cost $750/day"\n\nHow many additional servers needed?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '🖥️ +3 servers',
          '🖥️ +4 servers',
          '🖥️ +5 servers',
          '🖥️ +6 servers',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Resource Planning & Optimization',
      },
      {
        promptText:
          'The Bollywood Production Budget\n\nYash Raj Films producer\'s constraints:\n"Movie budget allocation:\n- Cast: 35% of budget\n- Production: 40% of budget\n- Post-production: 25% of budget\n- Total budget: ₹200 crores\n- Each department gets 85% efficiency (realistic spending)\n- Cast budget can cover post-production overruns"\n\nActual spending per department:',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '🎬 Cast: ₹60cr, Production: ₹68cr, Post: ₹42cr',
          '🎬 Cast: ₹59.5cr, Production: ₹68cr, Post: ₹42.5cr',
          '🎬 Cast: ₹70cr, Production: ₹80cr, Post: ₹50cr',
          '🎬 Cast: ₹55cr, Production: ₹70cr, Post: ₹45cr',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Resource Planning & Optimization',
      },
      {
        promptText:
          'The Tesla API Performance\n\nPerformance data stream:\n"Tesla app API metrics this hour:\n- Requests: 3.6 million\n- Success rate: 97.5%\n- Average response: 150ms\n- Timeout threshold: 600ms\n- 0.4% of requests timeout"\n\nAlert threshold: "Failed requests > 100K/hour triggers Elon\'s attention"\n\nAre we triggering alerts?',
        category: 'NUMERICAL',
        timerSeconds: 45,
        answerOptions: [
          '🟢 No - only 90K failures',
          '🔴 Yes - 104K failures',
          '🟡 Borderline - exactly 100K',
          '⚠️ No - 82K failures',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Performance Metrics & Rates',
      },
      {
        promptText:
          'The Data Center Growth\n\nInfosys DBA\'s analysis:\n"Bangalore data center growth:\n- Month 1: 4.0 TB\n- Month 2: 4.8 TB\n- Month 3: 5.76 TB\n- Each month grows 20% more than previous month\'s growth\n- Current capacity: 12 TB"\n\nWhen do we hit 80% capacity (9.6 TB)?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: ['📅 Month 5', '📅 Month 6', '📅 Month 7', '📅 Month 8'],
        correctAnswerIndex: 1,
        sectionTag: 'Performance Metrics & Rates',
      },
      {
        promptText:
          'The Match Success Rate\n\nIPL team analyst\'s weekly stats:\n"Batting success by match:\n- Mon: 180/4 in 20 overs (target: 175)\n- Tue: 165/7 in 20 overs (target: 170)\n- Wed: 190/3 in 20 overs (target: 185)\n- Thu: 155/8 in 20 overs (target: 160)\n- Fri: 145/9 in 20 overs (target: 150)\n\nTarget: Win rate > 60%"\n\nWhat\'s our win rate?',
        category: 'NUMERICAL',
        timerSeconds: 45,
        answerOptions: [
          '✅ 80% - Exceeding target',
          '✅ 60% - Just meeting target',
          '❌ 40% - Below target',
          '✅ 100% - Perfect week',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Performance Metrics & Rates',
      },
      {
        promptText:
          'The Streaming Platform Optimizer\n\nHotstar architect\'s dilemma:\n"CDN options for IPL streaming:\n- Basic: 300ms latency, ₹1.50 per GB\n- Premium: 75ms latency, ₹6.00 per GB\n- Current: 500ms latency, ₹0.75 per GB\n- Monthly transfer: 80TB during IPL\n- Each 100ms latency reduction = 8% more subscribers\n- 1% subscribers = ₹15,000 revenue"\n\nWhich option maximizes profit?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '💵 Stay with Current',
          '💵 Upgrade to Basic',
          '💵 Go Premium',
          '💵 Mix of Basic + Premium',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Complex Calculations & Trade-offs',
      },
      {
        promptText:
          'The Multi-Region Load Distribution\n\nAWS engineer\'s setup:\n"3 regions with different capacities:\n- Mumbai: Can handle 40% of traffic\n- Singapore: Can handle 35% of traffic\n- Frankfurt: Can handle 25% of traffic\n\nActual traffic:\n- India: 24,000 requests/sec\n- SEA: 18,000 requests/sec\n- Europe: 12,000 requests/sec"\n\nIf we redistribute optimally, max total traffic?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '🌐 54,000 req/sec',
          '🌐 60,000 req/sec',
          '🌐 67,500 req/sec',
          '🌐 72,000 req/sec',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Complex Calculations & Trade-offs',
      },
      {
        promptText:
          'The Automation ROI Challenge\n\nTCS automation proposal:\n"RPA project details:\n- Initial cost: ₹1.2 crores\n- Saves 8 engineer-hours daily\n- Engineer cost: ₹1,200/hour\n- 250 working days/year\n- Maintenance: ₹20,000/month"\n\nBreak-even time?',
        category: 'NUMERICAL',
        timerSeconds: 60,
        answerOptions: [
          '📊 10 months',
          '📊 12 months',
          '📊 15 months',
          '📊 18 months',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Complex Calculations & Trade-offs',
      },

      // ATTENTION TO DETAIL (10 Questions)
      {
        promptText:
          'The Stark Industries Config\n\nColleague\'s Slack message:\n"Hey, can you check my deployment config? The staging environment won\'t start..."\n\nversion: \'3.8\'\nservices:\n  frontend:\n    image: stark/jarvis-ui:latest\n    ports:\n      - "3000:3000"\n    environment:\n      - API_URL=http://backend:8080\n    depends_on:\n      - backend\n  \n  backend:\n    image: stark/jarvis-api:latest\n    ports:\n      - "8080:8080"\n    environment:\n      - DB_HOST=postgres\n      - DB_PORT=5432\n      - DB_NAME=jarvis_staging\n    depends_on:\n      - postgress\n  \n  postgress:\n    image: postgres:14\n    ports:\n      - "5432:5432"\n    environment:\n      - POSTGRES_DB=jarvis_staging\n      - POSTGRES_PASSWORD=arc_reactor_2024\n\nWhat\'s preventing startup?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 60,
        answerOptions: [
          '💭 Port 3000 conflict',
          '💭 Wrong API_URL format',
          "💭 Service name 'postgress' is misspelled",
          '💭 Missing volume mounts',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          'The Match Score Validator\n\nQA Engineer\'s request:\n"This cricket API response is failing validation. Can you spot why?"\n\nExpected Schema:\n{\n  "matchId": "string",\n  "timestamp": "ISO-8601",\n  "scoreData": {\n    "runs": "number",\n    "wickets": "number",\n    "overs": "string"\n  }\n}\n\nActual Response:\n{\n  "matchId": "IPL_2024_MI_CSK_045",\n  "timestamp": "2024-03-15T19:30:00Z",\n  "scoreData": {\n    "runs": 186,\n    "wickets": "4",\n    "overs": "18.3"\n  }\n}\n\nWhat\'s the validation error?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🔴 matchId format incorrect',
          '🔴 timestamp not ISO-8601',
          '🔴 wickets should be number, not string',
          '🔴 Missing required fields',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          'The Tesla Environment Variables\n\nDevOps alert:\n"Production Tesla app isn\'t connecting. Compare these environments:"\n\nProduction.env:\nNODE_ENV=production\nAPI_PORT=8080\nDB_HOST=tesla-prod.aws.com\nDB_PORT=5432\nDB_NAME=autopilot_prod\nDB_USER=tesla_app\nDB_PASSWORD=M0del3_Secure!2024\nREDIS_HOST=tesla-cache.aws.com\nREDIS_PORT=6379\nLOG_LEVEL=info\n\nStaging.env (working):\nNODE_ENV=staging\nAPI_PORT=8080\nDB_HOST=tesla-stage.aws.com\nDB_PORT=5432\nDB_NAME=autopilot_stage\nDB_USER=tesla_app\nDB_PASS=M0delS_Test!2024\nREDIS_HOST=tesla-cache-stage.aws.com\nREDIS_PORT=6379\nLOG_LEVEL=debug\n\nWhat\'s causing the connection failure?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 60,
        answerOptions: [
          '🐛 Wrong database port',
          '🐛 Invalid password characters',
          '🐛 Different env variable name (DB_PASSWORD vs DB_PASS)',
          '🐛 Missing quotes around password',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          "The Commit Message Analyzer\n\nTeam lead's review request:\n\"One of these commits doesn't follow our convention. Which one?\"\n\nCommit convention: [TYPE-TICKET] Brief description (max 50 chars)\n\nRecent commits:\n1. [FIX-MCU-234] Fix Iron Man suit power calculation bug\n2. [FEAT-MCU-567] Add Hulk transformation animation\n3. [UPDATE-MCU-891] Refactor Thor's hammer authentication middleware for better performance\n4. [DOC-MCU-345] Update Avengers API documentation\n5. [TEST-MCU-678] Add unit tests for Shield protocols\n\nFlag the non-compliant commit:",
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: ['📌 Line 1', '📌 Line 2', '📌 Line 3', '📌 Line 4'],
        correctAnswerIndex: 2,
        sectionTag: 'Code Review & Configuration Checks',
      },
      {
        promptText:
          'The Bollywood Database Inspector\n\nData analyst\'s dataset:\n"Movie database import showing errors. Find the problematic row?"\n\nMovieID | Title | Director | ReleaseDate | BoxOffice\nBW001 | Pathaan | Siddharth Anand | 2023-01-25 | ₹1050.3cr\nBW002 | Jawan | Atlee Kumar | 2023-09-07 | ₹1148.32cr\nBW003 | Dunki | Rajkumar Hirani | 2023-12-21 | ₹463.38cr\nBW004 | Tiger 3 | Maneesh Sharma | 2023-11-12 | ₹466.58rc\nBW005 | Gadar 2 | Anil Sharma | 2023-08-11 | ₹687.11cr\n\nWhich row has invalid data?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: ['📋 Row 1', '📋 Row 2', '📋 Row 3', '📋 Row 4'],
        correctAnswerIndex: 3,
        sectionTag: 'Data Validation & Pattern Matching',
      },
      {
        promptText:
          'The Log Pattern Matcher\n\nSRE\'s investigation:\n"These SpaceX launch logs show one anomaly. Which entry?"\n\n[2024-03-15 10:23:45] INFO: GET /api/launch/falcon9 - 200 OK - 45ms\n[2024-03-15 10:23:46] INFO: POST /api/telemetry/submit - 200 OK - 123ms\n[2024-03-15 10:23:47] INFO: GET /api/status?stage=2 - 200 OK - 67ms\n[2024-03-15 10:23:48] WARN: GET /api/mission/control - 401 Unauthorized - 12ms\n[2024-03-15 10:23:49] INFO: PUT /api/trajectory/update - 200 0K - 89ms\n[2024-03-15 10:23:50] INFO: DELETE /api/logs/temp - 204 No Content - 23ms\n\nIdentify the anomaly:',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🔍 Line 1 - timestamp format',
          '🔍 Line 2 - response time too high',
          '🔍 Line 4 - unauthorized access',
          '🔍 Line 5 - status code has zero instead of letter O',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Data Validation & Pattern Matching',
      },
      {
        promptText:
          'The Player Statistics Audit\n\nIPL team manager\'s roster check:\n"Player database has an error. Which entry is incorrect?"\n\nCurrent Squad:\nJersey | Player | Role | Matches | Average\n7 | MS Dhoni | WK-Batsman | 185 | 38.09\n18 | Virat Kohli | Batsman | 223 | 36.96\n45 | Rohit Sharma | Batsman | 241 | 31.64\n33 | Hardik Pandya | All-rounder | 107 | 28.73\n93 | Jasprit Bumrah | Bowler | 124 | 7.41\n\nWhich entry has invalid data?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🏏 MS Dhoni',
          '🏏 Virat Kohli',
          '🏏 Rohit Sharma',
          '🏏 Jasprit Bumrah',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Data Validation & Pattern Matching',
      },
      {
        promptText:
          'The Marvel App Component Inspector\n\nDesigner\'s message:\n"One button doesn\'t match our Marvel design system. Can you spot it?"\n\nDesign System Rules:\n- Primary buttons: Red (#DC143C), 16px font, 12px padding\n- Secondary buttons: Gray (#757575), 16px font, 12px padding\n- All buttons: Border-radius 6px, Bold font-weight\n\nComponent Inspector shows:\n- Button A: {color: #DC143C, font: 16px bold, padding: 12px, radius: 6px}\n- Button B: {color: #757575, font: 16px bold, padding: 12px, radius: 6px}\n- Button C: {color: #DC143C, font: 16px bold, padding: 12px, radius: 6px}\n- Button D: {color: #DC143C, font: 16px semi-bold, padding: 12px, radius: 6px}\n- Button E: {color: #757575, font: 16px bold, padding: 12px, radius: 6px}\n\nWhich button is non-compliant?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🎨 Button A',
          '🎨 Button B',
          '🎨 Button C',
          '🎨 Button D',
        ],
        correctAnswerIndex: 3,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          'The API Endpoint Pattern Check\n\nBackend team\'s endpoint list:\n"We\'re standardizing our Bollywood streaming API. Which endpoint breaks the pattern?"\n\nCurrent Endpoints:\nGET /api/v2/movies\nPOST /api/v2/movies\nGET /api/v2/movies/{id}\nPUT /api/v2/movies/{id}\nDELETE /api/v2/movies/{id}\n\nGET /api/v2/artists\nPOST /api/v2/artists\nGET /api/v2/artists/{id}\nPUT /api/v2/artists/{id}\nDELETE /api/v2/artists/{id}\n\nGET /api/v2/songs\nPOST /api/v2/song\nGET /api/v2/songs/{id}\nPUT /api/v2/songs/{id}\nDELETE /api/v2/songs/{id}\n\nSpot the inconsistency:',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🔗 GET /api/v2/movies',
          '🔗 DELETE /api/v2/artists/{id}',
          '🔗 POST /api/v2/song',
          '🔗 PUT /api/v2/songs/{id}',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
      {
        promptText:
          'The Launch Checklist Validator\n\nSpaceX mission control\'s final check:\n"Pre-launch checklist - all items should show ✓. What\'s missing?"\n\nLaunch Dashboard:\n📋 Falcon Heavy Pre-Launch - Mission ISRO-X1\n═══════════════════════════════════════════\n✓ Flight Software Verified\n✓ All Systems Go (42/42)\n✓ Weather Clearance Obtained  \n✓ Range Safety Approved\n✓ Fuel Loading Complete\n✓ Payload Integration Verified\n✓ Ground Systems: Connection Stable\n✓ Telemetry: Signal Strength > 95%\n✓ Launch Window Confirmed\n✗ Recovery Ships Positioned\n✓ Mission Control Team Ready\n✓ Countdown Sequence Loaded\n\nSystem shows: "11/12 checks complete"\n\nWhat needs attention?',
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 45,
        answerOptions: [
          '🚨 Telemetry signal weak',
          '🚨 Missing system checks',
          '🚨 Recovery ships not in position',
          '🚨 Fuel loading incomplete',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern Recognition & UI Consistency',
      },
    ];

    console.log(`📝 Creating ${questions.length} questions...\n`);

    // Create questions in batches for better performance
    const batchSize = 5;
    let createdCount = 0;

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (questionData) => {
          const question = await prisma.question.create({
            data: {
              ...questionData,
              testId: test.id,
            },
          });
          createdCount++;
          console.log(
            `✅ Question ${createdCount}: ${question.promptText.substring(0, 50)}...`
          );
        })
      );
    }

    console.log(`\n🎉 Test creation completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Test ID: ${test.id}`);
    console.log(`   - Total Questions: ${createdCount}`);
    console.log(`   - Verbal Reasoning: 10 questions`);
    console.log(`   - Logical Reasoning: 10 questions`);
    console.log(`   - Numerical Reasoning: 10 questions`);
    console.log(`   - Attention to Detail: 10 questions`);
    console.log(`   - Total Time Limit: 60 minutes`);
    console.log(`\n🔗 Test URL: http://localhost:3000/admin/tests/${test.id}`);
  } catch (error) {
    console.error('❌ Error creating test:', error);
    throw error;
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
