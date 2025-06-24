#!/usr/bin/env node

/**
 * Script to create the Complete Conversational Aptitude Test for Engineering Roles
 * Updated with comprehensive HTML-formatted questions
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log(
    '🚀 Creating Updated Conversational Aptitude Test for Engineering Roles...\n'
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
          passwordHash: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Delete existing test if it exists
    const existingTest = await prisma.test.findFirst({
      where: {
        title: 'Complete Conversational Aptitude Test for Engineering Roles',
      },
    });

    if (existingTest) {
      console.log('🗑️ Deleting existing conversational aptitude test...');
      await prisma.test.delete({ where: { id: existingTest.id } });
      console.log('✅ Existing test deleted');
    }

    // Create the test
    const test = await prisma.test.create({
      data: {
        title: 'Complete Conversational Aptitude Test for Engineering Roles',
        description:
          'A comprehensive assessment covering verbal reasoning, logical reasoning, numerical reasoning, and attention to detail - designed for engineering roles with modern interactive formats.',

        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`✅ Test created: ${test.title}`);
    console.log(`   Test ID: ${test.id}\n`);

    // Define all questions with HTML formatting
    const questions = [
      // VERBAL REASONING (10 Questions)
      {
        promptText: `<h3>The Project Update</h3>
<p><strong>Format:</strong> Slack message from your team lead</p>
<p><strong>Message:</strong></p>
<blockquote>"The client was impressed with our progress, but they mentioned that while the speed is excellent, they'd like us to double-check our work more thoroughly before submissions."</blockquote>
<p><strong>Your colleague asks:</strong> "What's the client really asking for?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Work faster"',
          '<strong>"Focus more on quality control"</strong>',
          '"Submit work more frequently"',
          '"Reduce the project scope"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Message Interpretation & Context',
      },
      {
        promptText: `<h3>The Vendor Response</h3>
<p><strong>Format:</strong> Email thread viewer</p>
<p><strong>Supplier email:</strong></p>
<blockquote>"We appreciate your interest in expediting the order. While our standard timeline remains unchanged, we understand your urgency and can explore premium options that would require additional investment."</blockquote>
<p><strong>Manager asks:</strong> "What are they offering?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Free expedited shipping"',
          '<strong>"Faster delivery for extra cost"</strong>',
          '"They can\'t help us"',
          '"Standard delivery only"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Message Interpretation & Context',
      },
      {
        promptText: `<h3>The Performance Review Hint</h3>
<p><strong>Format:</strong> Teams message from supervisor</p>
<p><strong>Message:</strong></p>
<blockquote>"Your technical work has been consistently strong. For your next growth phase, I'd encourage you to share your knowledge more actively with the team and take ownership of training initiatives."</blockquote>
<p><strong>HR asks:</strong> "What skill should they develop?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Time management"',
          '<strong>"Leadership and mentoring"</strong>',
          '"Technical expertise"',
          '"Project planning"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Message Interpretation & Context',
      },
      {
        promptText: `<h3>The Meeting Feedback</h3>
<p><strong>Format:</strong> Post-meeting chat</p>
<p><strong>Colleague's message:</strong></p>
<blockquote>"That presentation covered all the technical details thoroughly. However, I noticed several stakeholders checking their phones during the middle section."</blockquote>
<p><strong>Your manager asks:</strong> "What should we improve?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Add more technical details"',
          '<strong>"Make it more engaging"</strong>',
          '"Shorten the presentation"',
          '"Include more data"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Message Interpretation & Context',
      },
      {
        promptText: `<h3>The Process Comparison</h3>
<p><strong>Format:</strong> Interactive comparison builder</p>
<p><strong>Setup:</strong> "Help explain our workflow..."</p>
<p><strong>Prompt:</strong> "If planning is to building what testing is to _____?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"breaking"',
          '<strong>"launching"</strong>',
          '"debugging"',
          '"documenting"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Recognition',
      },
      {
        promptText: `<h3>The Team Dynamic Analogy</h3>
<p><strong>Format:</strong> Chat with senior colleague</p>
<p><strong>Senior:</strong> "Think of code review like proofreading an essay, and debugging like editing for clarity. So refactoring is like _____?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"grading the paper"',
          '<strong>"reorganizing for better flow"</strong>',
          '"writing a summary"',
          '"adding illustrations"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Analogy & Relationship Recognition',
      },
      {
        promptText: `<h3>The Skill Relationship</h3>
<p><strong>Format:</strong> Competency matrix builder</p>
<p><strong>Scenario:</strong> "Complete the pattern..."</p>
<p><strong>Given:</strong> "Detail-oriented : Quality :: Big-picture thinking : _____ ?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '<strong>"Strategy"</strong>',
          '"Accuracy"',
          '"Speed"',
          '"Precision"',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Analogy & Relationship Recognition',
      },
      {
        promptText: `<h3>The Communication Breakdown</h3>
<p><strong>Format:</strong> Meeting transcript viewer</p>
<p><strong>Transcript excerpt:</strong></p>
<blockquote>
Manager: "We need this by end of week."<br>
Engineer: "That's possible if we skip—"<br>
Manager: "Perfect! I'll inform the client."<br>
Engineer: "But I haven't explained the trade-offs..."
</blockquote>
<p><strong>Post-meeting survey:</strong> "What went wrong?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Engineer was too negative"',
          '<strong>"Manager didn\'t listen to full response"</strong>',
          '"Timeline was unrealistic"',
          '"Engineer wasn\'t clear"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference',
      },
      {
        promptText: `<h3>The Policy Interpretation</h3>
<p><strong>Format:</strong> Company handbook assistant</p>
<p><strong>Policy excerpt:</strong></p>
<blockquote>"Team members should collaborate openly, challenge ideas respectfully, and prioritize collective success over individual recognition."</blockquote>
<p><strong>Question:</strong> "Which behavior conflicts with this policy?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Questioning a decision in a team meeting"',
          '<strong>"Working alone to get personal credit"</strong>',
          '"Sharing credit for team achievements"',
          '"Asking teammates for help"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference',
      },
      {
        promptText: `<h3>The Status Update Subtext</h3>
<p><strong>Format:</strong> Project status dashboard</p>
<p><strong>Team member's update:</strong></p>
<blockquote>"Task is progressing. I've found a creative solution that nobody has tried before. Still figuring out some details on my own."</blockquote>
<p><strong>Lead asks:</strong> "What concern does this raise?"</p>`,
        category: 'VERBAL',
        timerSeconds: 30,
        answerOptions: [
          '"Too slow progress"',
          '<strong>"Working in isolation without validation"</strong>',
          '"Lack of creativity"',
          '"Not following process"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Context & Inference',
      },

      // LOGICAL REASONING (10 Questions)
      {
        promptText: `<h3>The Deployment Pipeline</h3>
<p><strong>Format:</strong> Interactive pipeline dashboard</p>
<p><strong>Pipeline rules:</strong></p>
<blockquote>
"Our deployment process:<br>
- Testing must complete before Review<br>
- Review must pass before Staging<br>
- Staging must run 24 hours before Production<br>
- If Review fails, return to Development<br>
- Hotfixes skip Staging but not Testing"
</blockquote>
<p><strong>Current Status:</strong></p>
<ul>
<li>✅ Development: Complete</li>
<li>✅ Testing: Passed</li>
<li>❌ Review: Failed</li>
<li>⏸️ Staging: Waiting</li>
<li>🚀 Production: Scheduled</li>
</ul>
<p><strong>Question:</strong> "What happens next?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '"Move to Staging"',
          '"Deploy to Production"',
          '<strong>"Back to Development"</strong>',
          '"Continue to Review"',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Sequential Dependencies',
      },
      {
        promptText: `<h3>The Access Control Logic</h3>
<p><strong>Format:</strong> Security system interface</p>
<p><strong>Building access rules:</strong></p>
<blockquote>
"Entry requirements:<br>
- Badge OR Biometric required (not both)<br>
- Visitors need Badge + Escort<br>
- After-hours needs Manager approval<br>
- Emergency exits override all rules<br>
- If fire alarm active, all doors unlock"
</blockquote>
<p><strong>Scenario:</strong></p>
<ul>
<li>Visitor with badge ✓</li>
<li>No escort available ✗</li>
<li>Business hours ✓</li>
<li>No emergencies ✓</li>
</ul>
<p><strong>Question:</strong> "Can visitor enter?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '"Yes - badge is sufficient"',
          '<strong>"No - needs escort"</strong>',
          '"Only with manager approval"',
          '"Only through emergency exit"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Sequential Dependencies',
      },
      {
        promptText: `<h3>The Approval Workflow</h3>
<p><strong>Format:</strong> Process flow simulator</p>
<p><strong>Approval chain:</strong></p>
<blockquote>
"Budget requests:<br>
- Under $1000: Team lead only<br>
- $1000-$5000: Team lead then Manager<br>
- Over $5000: Team lead, Manager, then Director<br>
- Urgent requests can skip one level<br>
- Safety equipment skips all approvals"
</blockquote>
<p><strong>Request:</strong> "$3000 normal equipment purchase"</p>
<p><strong>Question:</strong> "Whose approvals needed?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '"Team lead only"',
          '<strong>"Team lead + Manager"</strong>',
          '"All three levels"',
          '"No approvals needed"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Sequential Dependencies',
      },
      {
        promptText: `<h3>The Task Prioritization</h3>
<p><strong>Format:</strong> Task scheduling matrix</p>
<p><strong>Priority rules:</strong></p>
<blockquote>
"Task scheduling:<br>
- Urgent + Important: Do immediately<br>
- Not Urgent + Important: Schedule for later<br>
- Urgent + Not Important: Delegate<br>
- Not Urgent + Not Important: Delete<br>
- Customer-facing issues upgrade to Urgent"
</blockquote>
<p><strong>New task:</strong> "Internal process improvement (Important but not Urgent)"</p>
<p><strong>Customer complaint arrives about the process</strong></p>
<p><strong>Question:</strong> "How does priority change?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '<strong>"Becomes Do Immediately"</strong>',
          '"Stays Schedule for Later"',
          '"Changes to Delegate"',
          '"Moves to Delete"',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Sequential Dependencies',
      },
      {
        promptText: `<h3>The Review Schedule Pattern</h3>
<p><strong>Format:</strong> Calendar planning tool</p>
<p><strong>Review meeting pattern:</strong></p>
<blockquote>
"Reviews happen:<br>
- Week 1: Monday<br>
- Week 2: Wednesday<br>
- Week 3: Friday<br>
- Week 4: Tuesday<br>
- Week 5: Thursday<br>
- Week 6: ?"
</blockquote>
<p><strong>Question:</strong> "When is Week 6 review?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '<strong>Monday</strong>',
          'Tuesday',
          'Wednesday',
          'Saturday',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Pattern Recognition & Sequences',
      },
      {
        promptText: `<h3>The Workload Distribution</h3>
<p><strong>Format:</strong> Resource planning dashboard</p>
<p><strong>Team allocation pattern:</strong></p>
<blockquote>
"Project assignments:<br>
- Small project: 2 people for 3 weeks<br>
- Medium project: 3 people for 4 weeks<br>
- Large project: 4 people for 5 weeks<br>
- Extra-large project: ?"
</blockquote>
<p><strong>Question:</strong> "Following the pattern, Extra-large needs?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '<strong>5 people for 6 weeks</strong>',
          '6 people for 6 weeks',
          '5 people for 7 weeks',
          '4 people for 8 weeks',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Pattern Recognition & Sequences',
      },
      {
        promptText: `<h3>The Backup Rotation</h3>
<p><strong>Format:</strong> Schedule optimizer</p>
<p><strong>On-call rotation pattern:</strong></p>
<blockquote>
"On-call rotation:<br>
- Amy: Monday, Thursday<br>
- Bob: Tuesday, Friday<br>
- Carl: Wednesday, Saturday<br>
- Dana: Sunday, ?"
</blockquote>
<p><strong>Question:</strong> "Complete Dana's schedule?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          'Monday',
          'Tuesday',
          '<strong>Wednesday</strong>',
          'Thursday',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pattern Recognition & Sequences',
      },
      {
        promptText: `<h3>The Meeting Room Mystery</h3>
<p><strong>Format:</strong> Booking system investigation</p>
<p><strong>Clues:</strong></p>
<blockquote>
"Three teams booked rooms this morning:<br>
- Alex says: 'Beta team took Room 2'<br>
- Beta team says: 'We didn't take Room 2 or 3'<br>
- Charlie says: 'Alex is lying'<br><br>
Only one team is telling the truth."
</blockquote>
<p><strong>Question:</strong> "Which room did Beta team take?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          'Room 1',
          '<strong>Room 2</strong>',
          'Room 3',
          'Cannot determine',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Deductive Reasoning',
      },
      {
        promptText: `<h3>The Equipment Selection</h3>
<p><strong>Format:</strong> Requirement matching matrix</p>
<p><strong>Requirements:</strong></p>
<blockquote>
"Need equipment that:<br>
- Works indoors OR outdoors (not both environments)<br>
- Has battery backup<br>
- Costs under budget OR includes warranty<br>
- Is portable"
</blockquote>
<p><strong>Options:</strong></p>
<ul>
<li>Model A: Indoor only ✓, Battery ✓, Over budget but warranty ✓, Portable ✓</li>
<li>Model B: Both environments ✗, Battery ✓, Under budget ✓, Not portable ✗</li>
<li>Model C: Outdoor only ✓, No battery ✗, Under budget ✓, Portable ✓</li>
<li>Model D: Indoor only ✓, Battery ✓, Over budget no warranty ✗, Portable ✓</li>
</ul>
<p><strong>Question:</strong> "Which models qualify?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          '<strong>Only A</strong>',
          'A and B',
          'A and C',
          'None qualify',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Deductive Reasoning',
      },
      {
        promptText: `<h3>The Schedule Constraint Puzzle</h3>
<p><strong>Format:</strong> Planning optimizer</p>
<p><strong>Constraints:</strong></p>
<blockquote>
"Four tasks with rules:<br>
- Task A or B must be first (not both)<br>
- If A is first, C cannot be last<br>
- D must come after B<br>
- C and D cannot be adjacent"
</blockquote>
<p><strong>Question:</strong> "If B is first, what must be true?"</p>`,
        category: 'LOGICAL',
        timerSeconds: 40,
        answerOptions: [
          'A cannot be second',
          'D must be last',
          '<strong>C can be last</strong>',
          'A must be third',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Deductive Reasoning',
      },

      // NUMERICAL REASONING (10 Questions)
      {
        promptText: `<h3>The Resource Scaling</h3>
<p><strong>Format:</strong> Interactive scaling dashboard</p>
<p><strong>Current setup:</strong></p>
<blockquote>
"Our system handles:<br>
- 100 users with 4 servers<br>
- Response time: 2 seconds<br>
- Each server handles equal load<br>
- Adding servers reduces response time proportionally"
</blockquote>
<p><strong>Question:</strong> "To handle 250 users with same 2-second response, how many servers needed?"</p>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '8 servers',
          '<strong>10 servers</strong>',
          '12 servers',
          '16 servers',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Proportional Reasoning',
      },
      {
        promptText: `<h3>The Efficiency Comparison</h3>
<p><strong>Format:</strong> Performance comparison chart</p>
<p><strong>Two processes:</strong></p>
<blockquote>
"Process A: Completes 60 units in 3 hours<br>
Process B: Completes 45 units in 2 hours<br><br>
Need to complete 300 units. Which is faster?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '"Process A takes 15 hours"',
          '<strong>"Process B takes 13.3 hours"</strong>',
          '"Both take same time"',
          '"Process A takes 12 hours"',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Proportional Reasoning',
      },
      {
        promptText: `<h3>The Cost Distribution</h3>
<p><strong>Format:</strong> Budget allocation tool</p>
<p><strong>Project budget rules:</strong></p>
<blockquote>
"Total budget: $50,000<br>
- Development: 40% of total<br>
- Testing: 25% of total<br>
- Documentation: 15% of total<br>
- Remaining goes to training"
</blockquote>
<p><strong>Question:</strong> "How much for training?"</p>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '$5,000',
          '$7,500',
          '<strong>$10,000</strong>',
          '$12,500',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Proportional Reasoning',
      },
      {
        promptText: `<h3>The Time Estimation</h3>
<p><strong>Format:</strong> Project timeline calculator</p>
<p><strong>Task pattern:</strong></p>
<blockquote>
"Previous similar tasks:<br>
- Task 1 (complexity 3): Took 6 days<br>
- Task 2 (complexity 4): Took 8 days<br>
- Task 3 (complexity 5): Took 10 days<br><br>
New task has complexity 7. Estimate duration?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '12 days',
          '<strong>14 days</strong>',
          '16 days',
          '21 days',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Proportional Reasoning',
      },
      {
        promptText: `<h3>The Productivity Metrics</h3>
<p><strong>Format:</strong> Team performance dashboard</p>
<p><strong>Weekly output data:</strong></p>
<blockquote>
"Team performance:<br>
- Week 1: 5 people completed 100 tasks<br>
- Week 2: 6 people completed 132 tasks<br>
- Week 3: 4 people completed 92 tasks<br><br>
Which week was most productive per person?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          'Week 1 (20 tasks/person)',
          'Week 2 (22 tasks/person)',
          '<strong>Week 3 (23 tasks/person)</strong>',
          'All weeks equal',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Rate & Ratio Analysis',
      },
      {
        promptText: `<h3>The Growth Projection</h3>
<p><strong>Format:</strong> Trend analyzer</p>
<p><strong>Monthly user growth:</strong></p>
<blockquote>
"User count:<br>
- Month 1: 1,000 users<br>
- Month 2: 1,200 users<br>
- Month 3: 1,440 users<br><br>
Pattern continues. Predict Month 5?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '1,728 users',
          '1,920 users',
          '<strong>2,074 users</strong>',
          '2,160 users',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Rate & Ratio Analysis',
      },
      {
        promptText: `<h3>The Capacity Planning</h3>
<p><strong>Format:</strong> Utilization optimizer</p>
<p><strong>Current metrics:</strong></p>
<blockquote>
"System capacity:<br>
- Running at 75% capacity<br>
- Handling 450 requests/minute<br>
- Performance degrades after 85% capacity<br><br>
Maximum safe request rate?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '480 requests/min',
          '<strong>510 requests/min</strong>',
          '540 requests/min',
          '600 requests/min',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Rate & Ratio Analysis',
      },
      {
        promptText: `<h3>The Efficiency Trade-off</h3>
<p><strong>Format:</strong> Decision analyzer</p>
<p><strong>Two options:</strong></p>
<blockquote>
"Option A: Costs $100/day, produces 500 units/day<br>
Option B: Costs $150/day, produces 800 units/day<br><br>
Need 3,000 units. Which is more cost-effective?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          'Option A: $600 total',
          '<strong>Option B: $563 total</strong>',
          'Both cost the same',
          'Option A: $500 total',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Comparative Analysis',
      },
      {
        promptText: `<h3>The Workload Balance</h3>
<p><strong>Format:</strong> Distribution optimizer</p>
<p><strong>Three team members' current load:</strong></p>
<blockquote>
"Alice: Working on 4 tasks (capacity: 6)<br>
Bob: Working on 5 tasks (capacity: 7)<br>
Carol: Working on 3 tasks (capacity: 5)<br><br>
5 new tasks arrive. Optimal distribution?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '<strong>Alice: +2, Bob: +2, Carol: +1</strong>',
          'Alice: +1, Bob: +2, Carol: +2',
          'Alice: +2, Bob: +1, Carol: +2',
          'Alice: +3, Bob: +1, Carol: +1',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Comparative Analysis',
      },
      {
        promptText: `<h3>The Break-even Analysis</h3>
<p><strong>Format:</strong> Investment calculator</p>
<p><strong>New tool proposal:</strong></p>
<blockquote>
"Tool costs: $6,000 upfront<br>
Saves: 5 hours per week<br>
Hour value: $50<br>
Weekly savings = 5 × $50 = $250<br><br>
How many weeks to break even?"
</blockquote>`,
        category: 'NUMERICAL',
        timerSeconds: 30,
        answerOptions: [
          '20 weeks',
          '<strong>24 weeks</strong>',
          '30 weeks',
          '32 weeks',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Comparative Analysis',
      },

      // ATTENTION TO DETAIL (10 Questions)
      {
        promptText: `<h3>The Data Entry Verification</h3>
<p><strong>Format:</strong> Spreadsheet viewer</p>
<p><strong>Employee records to verify:</strong></p>
<table border="1" style="border-collapse: collapse; width: 100%;">
<tr><th>ID</th><th>Name</th><th>Email</th><th>Department</th></tr>
<tr><td>1001</td><td>John Smith</td><td>jsmith@company.com</td><td>Engineering</td></tr>
<tr><td>1002</td><td>Sarah Jones</td><td>sjones@company.com</td><td>Marketing</td></tr>
<tr><td>1003</td><td>Mike Brown</td><td>mbrown@compnay.com</td><td>Sales</td></tr>
<tr><td>1004</td><td>Lisa Davis</td><td>ldavis@company.com</td><td>Engineering</td></tr>
<tr><td>1005</td><td>Tom Wilson</td><td>twilson@company.com</td><td>Design</td></tr>
</table>
<p><strong>Question:</strong> "Which record has an error?"</p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: ['Row 1', 'Row 2', '<strong>Row 3</strong>', 'Row 4'],
        correctAnswerIndex: 2,
        sectionTag: 'Pattern & Consistency Checks',
      },
      {
        promptText: `<h3>The Schedule Inconsistency</h3>
<p><strong>Format:</strong> Calendar conflict checker</p>
<p><strong>Meeting schedule:</strong></p>
<pre><code>Monday 9:00 - Team Standup (Room A)
Monday 10:00 - Client Call (Room B)
Monday 11:00 - Design Review (Room A)
Monday 2:00 - Sprint Planning (Room B)
Monday 2:30 - Budget Review (Room B)
Monday 3:00 - Tech Discussion (Room A)</code></pre>
<p><strong>Find the conflict:</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Room A double-booked',
          '<strong>Room B has overlapping meetings</strong>',
          'Too many meetings scheduled',
          'Incorrect time format',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Pattern & Consistency Checks',
      },
      {
        promptText: `<h3>The Sequence Anomaly</h3>
<p><strong>Format:</strong> ID number validator</p>
<p><strong>System-generated IDs:</strong></p>
<pre><code>PRJ-2024-001-A
PRJ-2024-002-A
PRJ-2024-003-B
PRJ-2024-004-A
PRJ-2024-005-B
PRJ-2024-006-A
PRJ-2024-008-B
PRJ-2024-009-A</code></pre>
<p><strong>What's wrong with this sequence?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Wrong year used',
          'Letter pattern broken',
          '<strong>Missing ID number</strong>',
          'Format inconsistent',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pattern & Consistency Checks',
      },
      {
        promptText: `<h3>The Report Formatting</h3>
<p><strong>Format:</strong> Document reviewer</p>
<p><strong>Report sections:</strong></p>
<pre><code>1. Introduction
2. Methodology  
3. Results
   3.1 Phase One Results
   3.2 Phase Two Results
   3.3 Phase Three results
4. Discussion
5. Conclusion</code></pre>
<p><strong>Find the formatting inconsistency:</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Section numbering error',
          'Indentation problem',
          '<strong>Capitalization inconsistency</strong>',
          'Missing section',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Pattern & Consistency Checks',
      },
      {
        promptText: `<h3>The Form Validation</h3>
<p><strong>Format:</strong> Input form checker</p>
<p><strong>Form requirements:</strong></p>
<blockquote>
"Phone: (XXX) XXX-XXXX format<br>
Date: MM/DD/YYYY<br>
ID: Two letters followed by 4 digits"
</blockquote>
<p><strong>Submitted entries:</strong></p>
<table border="1" style="border-collapse: collapse;">
<tr><th>Field</th><th>Entry</th></tr>
<tr><td>Phone</td><td>(555) 123-4567</td></tr>
<tr><td>Date</td><td>12/05/2023</td></tr>
<tr><td>ID</td><td>AB1234</td></tr>
</table>
<p><strong>Which entry is correct?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          '<strong>All entries valid</strong>',
          'Phone format wrong',
          'Date format wrong',
          'ID format wrong',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Instruction Following & Compliance',
      },
      {
        promptText: `<h3>The Process Compliance</h3>
<p><strong>Format:</strong> Workflow checker</p>
<p><strong>Required steps:</strong></p>
<blockquote>
"1. Create draft<br>
2. Internal review<br>
3. Update based on feedback<br>
4. Final review<br>
5. Publish"
</blockquote>
<p><strong>Actual process followed:</strong></p>
<pre><code>✓ Draft created
✓ Sent for internal review  
✓ Published to website
✓ Feedback incorporated
✓ Final review completed</code></pre>
<p><strong>What's the compliance issue?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Missing step',
          '<strong>Wrong sequence</strong>',
          'Extra step added',
          'No issues',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Instruction Following & Compliance',
      },
      {
        promptText: `<h3>The Specification Match</h3>
<p><strong>Format:</strong> Requirements validator</p>
<p><strong>Job posting requirements:</strong></p>
<blockquote>
"Must have:<br>
- 5+ years experience<br>
- Bachelor's degree<br>
- Project management certification<br>
- Team leadership experience"
</blockquote>
<p><strong>Candidate profile:</strong></p>
<pre><code>Experience: 6 years
Education: Master's degree  
Certifications: PMP, Agile
Leadership: Led team of 8</code></pre>
<p><strong>Does candidate meet ALL requirements?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          '<strong>Yes - meets all requirements</strong>',
          'No - missing experience',
          'No - missing certification',
          'No - missing degree',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Instruction Following & Compliance',
      },
      {
        promptText: `<h3>The Code Review Checklist</h3>
<p><strong>Format:</strong> Pull request review interface</p>
<p><strong>Code review requirements:</strong></p>
<blockquote>
"Before approving any pull request:<br>
✓ All unit tests must pass<br>
✓ Code coverage must be ≥ 80%<br>
✓ No security vulnerabilities detected<br>
✓ Documentation updated for new features<br>
✓ At least 2 reviewer approvals required"
</blockquote>
<p><strong>Current PR status:</strong></p>
<ul>
<li>✅ Unit tests: 47/47 passing</li>
<li>✅ Code coverage: 82.3%</li>
<li>✅ Security scan: No issues found</li>
<li>✅ Documentation: Updated</li>
<li>✅ Reviewers: Alice ✓, Bob ✓, Charlie ✓</li>
<li>🔄 Status: Ready to merge</li>
</ul>
<p><strong>What should you do?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          '<strong>Approve and merge - all requirements met</strong>',
          'Request more tests - coverage too low',
          'Need more reviewers - only 2 approved',
          'Wait for security scan completion',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Visual Pattern & Layout',
      },
      {
        promptText: `<h3>The Status Indicator Pattern</h3>
<p><strong>Format:</strong> System status panel</p>
<p><strong>Service status indicators:</strong></p>
<pre><code>API Server:     🟢 Online
Database:       🟢 Online
Cache:          🟡 Warning
File Storage:   🟢 Online  
Email Service:  🔴 Offline
Auth Service:   🟢 Online
Task Queue:     🟣 Unknown</code></pre>
<p><strong>Which indicator doesn't follow the standard pattern?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Cache status',
          'Email service',
          '<strong>Task Queue</strong>',
          'All follow pattern',
        ],
        correctAnswerIndex: 2,
        sectionTag: 'Visual Pattern & Layout',
      },
      {
        promptText: `<h3>The Report Layout Check</h3>
<p><strong>Format:</strong> Document structure analyzer</p>
<p><strong>Table of Contents shows:</strong></p>
<pre><code>1. Executive Summary ........... 2
2. Introduction ................ 4
3. Analysis ................... 8
   3.1 Market Research ....... 10
   3.2 Competition .......... 14
4. Recommendations ............ 18
5. Appendix .................. 22</code></pre>
<p><strong>Actual page content:</strong></p>
<ul>
<li>Page 8: Analysis section starts</li>
<li>Page 10: Market Research begins</li>
<li>Page 15: Competition section starts</li>
<li>Page 18: Recommendations begin</li>
</ul>
<p><strong>Which TOC entry is wrong?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 20,
        answerOptions: [
          'Introduction page',
          '<strong>Competition page</strong>',
          'Recommendations page',
          'All entries correct',
        ],
        correctAnswerIndex: 1,
        sectionTag: 'Visual Pattern & Layout',
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
            `   ✅ Question ${createdCount}: ${questionData.sectionTag}`
          );
        })
      );
    }

    console.log(
      `\n🎉 Successfully created updated Conversational Aptitude Test!`
    );
    console.log(`📊 Summary:`);
    console.log(`   📋 Test ID: ${test.id}`);
    console.log(`   📝 Total Questions: ${createdCount}`);
    console.log(`   🗣️ Verbal Reasoning: 10 questions`);
    console.log(`   🧠 Logical Reasoning: 10 questions`);
    console.log(`   🔢 Numerical Reasoning: 10 questions`);
    console.log(`   👁️ Attention to Detail: 10 questions`);
    console.log(`   ⏱️ Total Time Limit: 60 minutes`);
    console.log(`\n💡 Features:`);
    console.log(`   🎨 HTML formatted questions with rich formatting`);
    console.log(`   📱 Interactive format descriptions`);
    console.log(`   🔧 Modern engineering-focused scenarios`);
    console.log(`   📊 Comprehensive skill assessment coverage`);
    console.log(
      `\n🔗 You can now use this test by creating invitations or public links!`
    );
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
