// Test script to debug invitation sending
async function testInvitation() {
  const requestData = {
    candidateEmail: 'test@example.com',
    candidateName: 'Test User',
    customMessage: 'This is a test invitation',
    expiresInDays: 7,
    jobProfileId: 'YOUR_JOB_PROFILE_ID', // You'll need to replace this with an actual ID
  };

  console.log('Sending test invitation with data:', requestData);

  try {
    const response = await fetch(
      'http://localhost:3000/api/admin/invitations/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your session cookie here if needed
        },
        body: JSON.stringify(requestData),
      }
    );

    console.log('Response status:', response.status);
    const responseData = await response.json();
    console.log('Response data:', responseData);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Note: To run this, you'll need to:
// 1. Get a valid jobProfileId from your database
// 2. Be logged in as an admin user
// 3. Copy your session cookie from the browser

console.log("Test invitation script created. You'll need to:");
console.log('1. Replace YOUR_JOB_PROFILE_ID with an actual job profile ID');
console.log('2. Add your session cookie to authenticate as admin');
console.log('3. Run this in the browser console while logged in as admin');
