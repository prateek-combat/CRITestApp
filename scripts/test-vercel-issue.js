#!/usr/bin/env node

// Quick test script to isolate the Vercel vs Local difference
console.log('🔍 Testing Original Route vs Local Behavior...\n');

console.log('📋 Alternative Testing Method:');
console.log('==============================\n');

console.log('Since the debug route deployment is delayed, let\'s test the original route');
console.log('with better error handling to capture the exact Vercel error:\n');

console.log('🌐 BROWSER CONSOLE CODE (Copy this):');
console.log('=====================================\n');

console.log(`fetch('https://cri-test-app.vercel.app/api/admin/job-profiles/86040ae8-7251-40b7-b946-580dab98f40f', {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    "Cookie": document.cookie
  },
  body: JSON.stringify({
    name: "Debug Test Job Profile",
    description: "Testing original route",
    positionIds: ["139ef7a2-74c3-426a-aab5-4784cfffd004"],
    testIds: ["2a630186-8a11-4d20-986f-0d5096d7fcc7"],
    testWeights: [1.0, 1.0]
  })
})
.then(async response => {
  console.log("Status:", response.status, response.statusText);
  console.log("Headers:", [...response.headers.entries()]);
  
  const text = await response.text();
  console.log("Raw Response:", text);
  
  try {
    const json = JSON.parse(text);
    console.log("Parsed JSON:", json);
  } catch (e) {
    console.log("JSON Parse Error:", e.message);
  }
  
  return response;
})
.catch(err => {
  console.error("Network Error:", err);
  console.error("Error Details:", {
    name: err.name,
    message: err.message,
    stack: err.stack?.split('\\n').slice(0, 3)
  });
});`);

console.log('\n📊 What This Will Show:');
console.log('=======================');
console.log('• Exact HTTP status code and message');
console.log('• Response headers from Vercel');
console.log('• Raw response text (even if not JSON)');
console.log('• Detailed error information');
console.log('• Whether it\'s a network, parsing, or server error\n');

console.log('🔍 Expected Results:');
console.log('===================');
console.log('✅ Success: Status 200 + JSON response');
console.log('❌ Server Error: Status 500 + error details');
console.log('❌ Auth Error: Status 401 + auth message');
console.log('❌ Validation Error: Status 400 + validation message\n');

console.log('📝 Action Items:');
console.log('================');
console.log('1. Run the code above in your browser console');
console.log('2. Copy the COMPLETE output (all console messages)');
console.log('3. This will show us the exact Vercel failure details');
console.log('4. Meanwhile, check Vercel dashboard for deployment status\n');

console.log('🕐 Vercel Deployment Check:');
console.log('===========================');
console.log('• Go to: https://vercel.com/dashboard');
console.log('• Look for CRI Test App project');
console.log('• Check if latest deployment shows "Ready"');
console.log('• If still "Building", wait 2-3 more minutes\n');
