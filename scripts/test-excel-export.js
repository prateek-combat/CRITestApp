// Use native fetch (available in Node.js 18+)
require('dotenv').config();

// Override the URL if running on a different port
const BASE_URL = 'http://localhost:3001';

async function testExcelExport() {
  try {
    // Get auth token first
    const authResponse = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        Cookie: process.env.TEST_COOKIE || '',
      },
    });

    if (!authResponse.ok) {
      console.log('Auth check failed - you need to set TEST_COOKIE in .env');
      console.log('To get the cookie:');
      console.log('1. Login to the app as admin');
      console.log('2. Open DevTools > Application > Cookies');
      console.log('3. Copy the full cookie string');
      console.log('4. Add to .env as TEST_COOKIE="your-cookie-string"');
      return;
    }

    const session = await authResponse.json();
    if (!session?.user) {
      console.log('No valid session found');
      return;
    }

    console.log('Authenticated as:', session.user.email);

    // Test Excel export with PCCOE job profile
    const jobProfileId = '5c50789a-2980-4882-a212-48aa84c88bde';
    const exportUrl = `${BASE_URL}/api/admin/leaderboard/export-excel?jobProfileId=${jobProfileId}`;

    console.log('\nCalling Excel export API...');
    console.log('URL:', exportUrl);

    const response = await fetch(exportUrl, {
      method: 'GET',
      headers: {
        Cookie: process.env.TEST_COOKIE || '',
      },
    });

    console.log('\nResponse status:', response.status);
    console.log(
      'Response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      // Success - would be Excel file
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log('Success! Excel file size:', buffer.length, 'bytes');

      // Save the file for inspection
      const fs = require('fs');
      const filename = `test-excel-export-${Date.now()}.xlsx`;
      fs.writeFileSync(filename, buffer);
      console.log('Excel file saved as:', filename);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Also test the leaderboard API directly
async function testLeaderboardAPI() {
  try {
    console.log('\n--- Testing Leaderboard API directly ---');

    const jobProfileId = '5c50789a-2980-4882-a212-48aa84c88bde';
    const leaderboardUrl = `${BASE_URL}/api/admin/leaderboard?jobProfileId=${jobProfileId}&pageSize=50&page=1`;

    console.log('URL:', leaderboardUrl);

    const response = await fetch(leaderboardUrl, {
      method: 'GET',
      headers: {
        Cookie: process.env.TEST_COOKIE || '',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    } else {
      const data = await response.json();
      console.log('Success! Total candidates:', data.stats.totalCandidates);
      console.log('Rows returned:', data.rows.length);
    }
  } catch (error) {
    console.error('Leaderboard API test failed:', error);
  }
}

// Run tests
async function runTests() {
  await testLeaderboardAPI();
  await testExcelExport();
}

runTests();
