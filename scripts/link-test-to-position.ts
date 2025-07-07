import { prisma } from '../src/lib/prisma';

async function linkTestToPosition() {
  console.log(
    'Starting to link General Aptitude Test to Combat Internal position...'
  );

  try {
    // Find the General Aptitude Test
    const test = await prisma.test.findFirst({
      where: {
        title: {
          contains: 'General Aptitude',
          mode: 'insensitive',
        },
      },
    });

    if (!test) {
      console.error('General Aptitude Test not found!');

      // List all tests to help identify the correct one
      const allTests = await prisma.test.findMany({
        select: {
          id: true,
          title: true,
          positionId: true,
        },
      });

      console.log('\nAvailable tests:');
      allTests.forEach((t) => {
        console.log(
          `- ${t.title} (ID: ${t.id}, Position: ${t.positionId || 'None'})`
        );
      });

      return;
    }

    console.log(`Found test: ${test.title} (ID: ${test.id})`);

    // Find the Combat Internal position
    const position = await prisma.position.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: 'Combat Internal',
              mode: 'insensitive',
            },
          },
          {
            name: {
              contains: 'Combat',
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    if (!position) {
      console.error('Combat Internal position not found!');

      // List all positions to help identify the correct one
      const allPositions = await prisma.position.findMany({
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

      console.log('\nAvailable positions:');
      allPositions.forEach((p) => {
        console.log(`- ${p.name} (Code: ${p.code}, ID: ${p.id})`);
      });

      return;
    }

    console.log(`Found position: ${position.name} (ID: ${position.id})`);

    // Check if test is already linked to a position
    if (test.positionId && test.positionId !== position.id) {
      console.log(
        `\nWarning: Test is currently linked to position ID: ${test.positionId}`
      );

      const currentPosition = await prisma.position.findUnique({
        where: { id: test.positionId },
      });

      if (currentPosition) {
        console.log(`Current position: ${currentPosition.name}`);
      }

      console.log('Updating to new position...');
    }

    // Update the test to link it to the Combat Internal position
    const updatedTest = await prisma.test.update({
      where: { id: test.id },
      data: { positionId: position.id },
    });

    console.log('\n✅ Successfully linked test to position!');
    console.log(
      `Test "${updatedTest.title}" is now linked to position "${position.name}"`
    );

    // Verify the link
    const verifyTest = await prisma.test.findUnique({
      where: { id: test.id },
      include: {
        position: true,
      },
    });

    if (verifyTest?.position) {
      console.log(
        `\nVerification: Test is correctly linked to ${verifyTest.position.name}`
      );
    }
  } catch (error) {
    console.error('Error linking test to position:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
linkTestToPosition();
