#!/usr/bin/env node

/**
 * Test API endpoints to verify everything is working
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  console.log('🧪 Testing API endpoints and database access...\n');

  try {
    // Test direct database access
    console.log('1. 📊 Direct Database Test:');
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
    console.log(`   ✅ Found ${tests.length} tests directly from database`);
    tests.forEach((test) => {
      console.log(`   - ${test.title} (${test._count.questions} questions)`);
    });

    // Test API endpoint
    console.log('\n2. 🌐 API Endpoint Test:');
    const fetch = (await import('node-fetch')).default;

    try {
      const response = await fetch('http://localhost:3000/api/tests');
      const data = await response.text();

      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${data}`);

      if (response.status === 200) {
        const jsonData = JSON.parse(data);
        console.log(`   ✅ API returned ${jsonData.length} tests`);
      } else {
        console.log(`   ❌ API error: ${data}`);
      }
    } catch (apiError) {
      console.log(`   ❌ API request failed: ${apiError.message}`);
    }

    // Test health endpoint
    console.log('\n3. ❤️ Health Check:');
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      const healthData = await healthResponse.text();
      console.log(`   Status: ${healthResponse.status}`);
      console.log(`   Response: ${healthData}`);
    } catch (healthError) {
      console.log(`   ❌ Health check failed: ${healthError.message}`);
    }

    console.log('\n🎉 API test completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI().catch(console.error);
