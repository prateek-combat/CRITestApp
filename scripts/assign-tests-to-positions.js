#!/usr/bin/env node

/**
 * Script to assign existing tests to appropriate positions
 * This demonstrates the position-based leaderboard system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTestsToPositions() {
  try {
    console.log('🎯 Assigning existing tests to appropriate positions...\n');

    // Get all positions
    const positions = await prisma.position.findMany();
    const positionMap = Object.fromEntries(
      positions.map((p) => [p.code, p.id])
    );

    // Get all tests
    const tests = await prisma.test.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        positionId: true,
      },
    });

    console.log('📋 Current Tests:');
    tests.forEach((test) => {
      console.log(`   - ${test.title}`);
    });
    console.log('');

    // Define test-to-position mappings based on content
    const testAssignments = [
      {
        titlePattern: /mechanical/i,
        positionCode: 'MECH_ENG',
        reason: 'Mechanical engineering content',
      },
      {
        titlePattern: /c\+\+/i,
        positionCode: 'SWE',
        reason: 'C++ programming content',
      },
      {
        titlePattern: /python/i,
        positionCode: 'SWE',
        reason: 'Python programming content',
      },
      {
        titlePattern: /ros/i,
        positionCode: 'ROBOT_ENG',
        reason: 'ROS robotics content',
      },
      {
        titlePattern: /systems thinking/i,
        positionCode: 'SWE',
        reason: 'Systems architecture content',
      },
      {
        titlePattern: /general aptitude/i,
        positionCode: 'UNASSIGNED',
        reason: 'General aptitude - applicable to multiple positions',
      },
    ];

    console.log('🔄 Assigning tests to positions...\n');

    let assignedCount = 0;
    let skippedCount = 0;

    for (const test of tests) {
      // Skip if already assigned
      if (test.positionId) {
        console.log(`⏭️  Skipped: ${test.title} (already assigned)`);
        skippedCount++;
        continue;
      }

      // Find matching assignment rule
      const assignment = testAssignments.find((rule) =>
        rule.titlePattern.test(test.title)
      );

      if (assignment && positionMap[assignment.positionCode]) {
        const positionId = positionMap[assignment.positionCode];
        const position = positions.find((p) => p.id === positionId);

        await prisma.test.update({
          where: { id: test.id },
          data: { positionId },
        });

        console.log(`✅ Assigned: ${test.title}`);
        console.log(`   → Position: ${position.name} (${position.code})`);
        console.log(`   → Reason: ${assignment.reason}`);
        console.log('');

        assignedCount++;
      } else {
        console.log(`❓ No assignment rule found for: ${test.title}`);
        skippedCount++;
      }
    }

    console.log('📊 Assignment Summary:');
    console.log(`   ✅ Assigned: ${assignedCount} tests`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tests`);
    console.log('');

    // Show final position assignments
    const updatedTests = await prisma.test.findMany({
      include: {
        position: {
          select: { name: true, code: true },
        },
      },
    });

    console.log('🎯 Final Test-Position Assignments:');
    updatedTests.forEach((test) => {
      const positionName = test.position?.name || 'Unassigned';
      const positionCode = test.position?.code || 'NONE';
      console.log(`   - ${test.title} → ${positionName} (${positionCode})`);
    });

    // Show position test counts
    console.log('');
    console.log('📈 Tests per Position:');
    const positionCounts = await prisma.position.findMany({
      include: {
        _count: {
          select: { tests: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    positionCounts.forEach((pos) => {
      if (pos._count.tests > 0) {
        console.log(
          `   - ${pos.name} (${pos.code}): ${pos._count.tests} tests`
        );
      }
    });

    console.log('');
    console.log('✅ Test assignment completed successfully!');
    console.log(
      '🚀 Position-based leaderboard system is now ready for testing!'
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await assignTestsToPositions();
}

main();
