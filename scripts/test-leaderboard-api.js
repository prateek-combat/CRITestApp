require('dotenv').config();
const fetch = require('node-fetch');

async function testLeaderboardAPI() {
  try {
    // You'll need to replace this with a valid session token
    const response = await fetch(
      'http://localhost:3000/api/admin/leaderboard?jobProfileId=mechanical-engineer-intern',
      {
        headers: {
          Cookie: 'authjs.session-token=YOUR_SESSION_TOKEN', // Replace with actual session token
        },
      }
    );

    if (!response.ok) {
      console.error(
        'API request failed:',
        response.status,
        response.statusText
      );
      return;
    }

    const data = await response.json();

    console.log('Leaderboard API Response:');
    console.log('========================');
    console.log(`Total candidates: ${data.rows.length}`);
    console.log('\nFirst 5 candidates with risk scores:');

    data.rows.slice(0, 5).forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.candidateName}`);
      console.log(`   Email: ${row.candidateEmail}`);
      console.log(`   Risk Score: ${row.riskScore}`);
      console.log(`   Proctoring Enabled: ${row.proctoringEnabled}`);
      console.log(`   Type: ${row.type || 'regular'}`);
    });

    // Check how many have risk scores
    const withRiskScores = data.rows.filter(
      (r) => r.riskScore !== null && r.riskScore !== undefined
    );
    const withProctoring = data.rows.filter(
      (r) => r.proctoringEnabled === true
    );

    console.log('\nSummary:');
    console.log(`Total candidates: ${data.rows.length}`);
    console.log(`With risk scores: ${withRiskScores.length}`);
    console.log(`With proctoring enabled: ${withProctoring.length}`);
    console.log(
      `Without risk scores but with proctoring: ${withProctoring.length - withRiskScores.length}`
    );
  } catch (error) {
    console.error('Error testing leaderboard API:', error);
  }
}

// Note: This script requires you to be logged in to the admin panel
console.log('Note: This script requires a valid session token.');
console.log('To get one:');
console.log('1. Log in to the admin panel in your browser');
console.log('2. Open Developer Tools (F12)');
console.log('3. Go to Application/Storage > Cookies');
console.log('4. Find "authjs.session-token" and copy its value');
console.log(
  '5. Replace YOUR_SESSION_TOKEN in this script with the actual value\n'
);

testLeaderboardAPI();
