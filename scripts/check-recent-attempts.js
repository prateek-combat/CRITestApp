#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentAttempts() {
  console.log('🔍 Checking recent test attempts for proctoring data...\n');

  try {
    // Check regular test attempts
    console.log('📋 Recent Test Attempts:');
    const recentAttempts = await prisma.testAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        startedAt: true,
        completedAt: true,
        status: true,
        proctoringEnabled: true,
        permissionsGranted: true,
        proctoringStartedAt: true,
        proctoringEndedAt: true,
        proctorAssets: {
          where: { kind: 'FRAME_CAPTURE' },
          select: { id: true, ts: true, fileSize: true },
        },
        proctorEvents: {
          select: { id: true, type: true, ts: true },
        },
      },
    });

    recentAttempts.forEach((attempt, index) => {
      console.log(
        `\n${index + 1}. ${attempt.candidateName || 'Anonymous'} (${attempt.candidateEmail || 'No email'})`
      );
      console.log(`   ID: ${attempt.id}`);
      console.log(`   Started: ${attempt.startedAt.toISOString()}`);
      console.log(`   Status: ${attempt.status}`);
      console.log(`   Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`   Permissions Granted: ${attempt.permissionsGranted}`);
      console.log(
        `   Proctoring Period: ${attempt.proctoringStartedAt?.toISOString() || 'Not started'} - ${attempt.proctoringEndedAt?.toISOString() || 'Not ended'}`
      );
      console.log(`   📸 Frame Captures: ${attempt.proctorAssets.length}`);
      console.log(`   📝 Proctor Events: ${attempt.proctorEvents.length}`);

      if (attempt.proctorAssets.length > 0) {
        const totalSize = attempt.proctorAssets.reduce(
          (sum, asset) => sum + asset.fileSize,
          0
        );
        console.log(
          `   📦 Total Image Size: ${(totalSize / 1024).toFixed(2)} KB`
        );
        console.log(
          `   ⏰ First Image: ${attempt.proctorAssets[0]?.ts.toISOString()}`
        );
        console.log(
          `   ⏰ Last Image: ${attempt.proctorAssets[attempt.proctorAssets.length - 1]?.ts.toISOString()}`
        );
      }
    });

    // Check public test attempts
    console.log('\n\n📋 Recent Public Test Attempts:');
    const recentPublicAttempts = await prisma.publicTestAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        startedAt: true,
        completedAt: true,
        status: true,
        proctoringEnabled: true,
        permissionsGranted: true,
        proctoringStartedAt: true,
        proctoringEndedAt: true,
        publicProctorAssets: {
          where: { kind: 'FRAME_CAPTURE' },
          select: { id: true, ts: true, fileSize: true },
        },
        publicProctorEvents: {
          select: { id: true, type: true, ts: true },
        },
      },
    });

    recentPublicAttempts.forEach((attempt, index) => {
      console.log(
        `\n${index + 1}. ${attempt.candidateName || 'Anonymous'} (${attempt.candidateEmail || 'No email'})`
      );
      console.log(`   ID: ${attempt.id}`);
      console.log(`   Started: ${attempt.startedAt.toISOString()}`);
      console.log(`   Status: ${attempt.status}`);
      console.log(`   Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`   Permissions Granted: ${attempt.permissionsGranted}`);
      console.log(
        `   Proctoring Period: ${attempt.proctoringStartedAt?.toISOString() || 'Not started'} - ${attempt.proctoringEndedAt?.toISOString() || 'Not ended'}`
      );
      console.log(
        `   📸 Frame Captures: ${attempt.publicProctorAssets.length}`
      );
      console.log(
        `   📝 Proctor Events: ${attempt.publicProctorEvents.length}`
      );

      if (attempt.publicProctorAssets.length > 0) {
        const totalSize = attempt.publicProctorAssets.reduce(
          (sum, asset) => sum + asset.fileSize,
          0
        );
        console.log(
          `   📦 Total Image Size: ${(totalSize / 1024).toFixed(2)} KB`
        );
        console.log(
          `   ⏰ First Image: ${attempt.publicProctorAssets[0]?.ts.toISOString()}`
        );
        console.log(
          `   ⏰ Last Image: ${attempt.publicProctorAssets[attempt.publicProctorAssets.length - 1]?.ts.toISOString()}`
        );
      }
    });

    // Summary statistics
    const totalRegularAttempts = await prisma.testAttempt.count();
    const totalPublicAttempts = await prisma.publicTestAttempt.count();
    const totalProctorAssets = await prisma.proctorAsset.count();
    const totalPublicProctorAssets = await prisma.publicProctorAsset.count();

    console.log('\n📊 Summary Statistics:');
    console.log(`   Total Regular Test Attempts: ${totalRegularAttempts}`);
    console.log(`   Total Public Test Attempts: ${totalPublicAttempts}`);
    console.log(`   Total Proctor Assets (Regular): ${totalProctorAssets}`);
    console.log(`   Total Public Proctor Assets: ${totalPublicProctorAssets}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentAttempts();
