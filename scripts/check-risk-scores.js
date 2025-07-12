require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRiskScores() {
  try {
    console.log('Checking risk scores in the database...\n');

    // Check regular test attempts
    const regularAttempts = await prisma.testAttempt.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        proctoringEnabled: true,
        riskScore: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 20,
    });

    console.log('Recent Regular Test Attempts:');
    console.log('=============================');
    regularAttempts.forEach((attempt) => {
      console.log(`ID: ${attempt.id}`);
      console.log(
        `Candidate: ${attempt.candidateName} (${attempt.candidateEmail})`
      );
      console.log(`Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`Risk Score: ${attempt.riskScore}`);
      console.log(`Completed: ${attempt.completedAt}`);
      console.log('---');
    });

    // Check public test attempts
    const publicAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        status: 'COMPLETED',
      },
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        proctoringEnabled: true,
        riskScore: true,
        completedAt: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 20,
    });

    console.log('\nRecent Public Test Attempts:');
    console.log('============================');
    publicAttempts.forEach((attempt) => {
      console.log(`ID: ${attempt.id}`);
      console.log(
        `Candidate: ${attempt.candidateName} (${attempt.candidateEmail})`
      );
      console.log(`Proctoring Enabled: ${attempt.proctoringEnabled}`);
      console.log(`Risk Score: ${attempt.riskScore}`);
      console.log(`Completed: ${attempt.completedAt}`);
      console.log('---');
    });

    // Count attempts with proctoring and risk scores
    const [regularWithProctoring, publicWithProctoring] = await Promise.all([
      prisma.testAttempt.count({
        where: {
          status: 'COMPLETED',
          proctoringEnabled: true,
          riskScore: { not: null },
        },
      }),
      prisma.publicTestAttempt.count({
        where: {
          status: 'COMPLETED',
          proctoringEnabled: true,
          riskScore: { not: null },
        },
      }),
    ]);

    console.log('\nSummary:');
    console.log('=========');
    console.log(
      `Regular attempts with proctoring and risk scores: ${regularWithProctoring}`
    );
    console.log(
      `Public attempts with proctoring and risk scores: ${publicWithProctoring}`
    );
  } catch (error) {
    console.error('Error checking risk scores:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRiskScores();
