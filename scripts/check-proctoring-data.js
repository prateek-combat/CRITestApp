const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProctoringData() {
  try {
    // Get the 3 most recent test attempts
    const recentAttempts = await prisma.testAttempt.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        proctorAssets: {
          select: {
            id: true,
            kind: true,
            fileName: true,
            fileSize: true,
            ts: true,
          },
        },
        proctorEvents: {
          select: {
            id: true,
            type: true,
            ts: true,
            extra: true,
          },
        },
        test: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log('=== Recent Test Attempts with Proctoring Data ===\n');

    for (const attempt of recentAttempts) {
      console.log(`Test: ${attempt.test.title}`);
      console.log(`Attempt ID: ${attempt.id}`);
      console.log(`Date: ${attempt.createdAt}`);
      console.log(`Status: ${attempt.status}`);
      console.log(`Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`Permissions Granted: ${attempt.permissionsGranted}`);
      console.log(
        `Video Recording URL: ${attempt.videoRecordingUrl || 'Not set'}`
      );
      console.log(
        `Face Captures URLs Count: ${attempt.faceCapturesUrls.length}`
      );
      console.log(
        `Screen Recording URL: ${attempt.screenRecordingUrl || 'Not set'}`
      );

      console.log(`\nProctor Assets (${attempt.proctorAssets.length} total):`);
      if (attempt.proctorAssets.length > 0) {
        // Show first 5 assets
        attempt.proctorAssets.slice(0, 5).forEach((asset) => {
          console.log(
            `  - ${asset.kind}: ${asset.fileName} (${asset.fileSize} bytes) at ${asset.ts}`
          );
        });
        if (attempt.proctorAssets.length > 5) {
          console.log(
            `  ... and ${attempt.proctorAssets.length - 5} more assets`
          );
        }
      } else {
        console.log('  No proctor assets found');
      }

      console.log(`\nProctor Events (${attempt.proctorEvents.length} total):`);
      if (attempt.proctorEvents.length > 0) {
        // Show first 5 events
        attempt.proctorEvents.slice(0, 5).forEach((event) => {
          console.log(`  - ${event.type} at ${event.ts}`);
          if (event.extra) {
            console.log(`    Extra: ${JSON.stringify(event.extra)}`);
          }
        });
        if (attempt.proctorEvents.length > 5) {
          console.log(
            `  ... and ${attempt.proctorEvents.length - 5} more events`
          );
        }
      } else {
        console.log('  No proctor events found');
      }

      console.log('\n' + '-'.repeat(60) + '\n');
    }

    // Also check public test attempts
    const publicAttempts = await prisma.publicTestAttempt.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        publicProctorAssets: {
          select: {
            id: true,
            kind: true,
            fileName: true,
            fileSize: true,
            ts: true,
          },
        },
        publicProctorEvents: true,
      },
    });

    if (publicAttempts.length > 0) {
      console.log('\n=== Recent Public Test Attempts ===\n');
      for (const attempt of publicAttempts) {
        console.log(`Public Attempt ID: ${attempt.id}`);
        console.log(`Date: ${attempt.createdAt}`);
        console.log(`Proctor Assets: ${attempt.publicProctorAssets.length}`);
        console.log(`Proctor Events: ${attempt.publicProctorEvents.length}`);
        console.log('-'.repeat(40));
      }
    }
  } catch (error) {
    console.error('Error checking proctoring data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProctoringData();
