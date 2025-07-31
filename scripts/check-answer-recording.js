#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAnswerRecording() {
  console.log('🔍 Checking recent test attempts for answer recording...\n');

  try {
    // Check recent regular test attempts with their answers
    console.log('📋 Recent Test Attempts with Answers:');
    const recentAttempts = await prisma.testAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        startedAt: true,
        completedAt: true,
        status: true,
        submittedAnswers: {
          select: {
            id: true,
            selectedAnswerIndex: true,
            timeTakenSeconds: true,
            submittedAt: true,
            question: {
              select: {
                id: true,
                promptText: true,
              },
            },
          },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    recentAttempts.forEach((attempt, index) => {
      console.log(
        `\n${index + 1}. ${attempt.candidateName || 'Anonymous'} (${attempt.candidateEmail || 'No email'})`
      );
      console.log(`   ID: ${attempt.id}`);
      console.log(`   Started: ${attempt.startedAt.toISOString()}`);
      console.log(
        `   Completed: ${attempt.completedAt?.toISOString() || 'Not completed'}`
      );
      console.log(`   Status: ${attempt.status}`);
      console.log(
        `   📝 Submitted Answers: ${attempt.submittedAnswers.length}`
      );

      if (attempt.submittedAnswers.length > 0) {
        console.log(`   📊 Answer Details:`);
        attempt.submittedAnswers.forEach((answer, answerIndex) => {
          console.log(
            `     ${answerIndex + 1}. Q: "${(answer.question.promptText || 'Unknown question').substring(0, 50)}..."`
          );
          console.log(
            `        Selected: Option ${answer.selectedAnswerIndex !== null ? answer.selectedAnswerIndex + 1 : 'None'}`
          );
          console.log(`        Time: ${answer.timeTakenSeconds}s`);
          console.log(`        Submitted: ${answer.submittedAt.toISOString()}`);
        });
      } else {
        console.log(`   ⚠️  NO ANSWERS RECORDED`);
      }
    });

    // Check recent public test attempts with their answers
    console.log('\n\n📋 Recent Public Test Attempts with Answers:');
    const recentPublicAttempts = await prisma.publicTestAttempt.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        candidateName: true,
        candidateEmail: true,
        startedAt: true,
        completedAt: true,
        status: true,
        submittedAnswers: {
          select: {
            selectedAnswerIndex: true,
            timeTakenSeconds: true,
            submittedAt: true,
            question: {
              select: {
                id: true,
                promptText: true,
              },
            },
          },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    recentPublicAttempts.forEach((attempt, index) => {
      console.log(
        `\n${index + 1}. ${attempt.candidateName || 'Anonymous'} (${attempt.candidateEmail || 'No email'})`
      );
      console.log(`   ID: ${attempt.id}`);
      console.log(`   Started: ${attempt.startedAt.toISOString()}`);
      console.log(
        `   Completed: ${attempt.completedAt?.toISOString() || 'Not completed'}`
      );
      console.log(`   Status: ${attempt.status}`);
      console.log(
        `   📝 Submitted Answers: ${attempt.submittedAnswers.length}`
      );

      if (attempt.submittedAnswers.length > 0) {
        console.log(`   📊 Answer Details:`);
        attempt.submittedAnswers.forEach((answer, answerIndex) => {
          console.log(
            `     ${answerIndex + 1}. Q: "${(answer.question.promptText || 'Unknown question').substring(0, 50)}..."`
          );
          console.log(
            `        Selected: Option ${answer.selectedAnswerIndex !== null ? answer.selectedAnswerIndex + 1 : 'None'}`
          );
          console.log(`        Time: ${answer.timeTakenSeconds}s`);
          console.log(`        Submitted: ${answer.submittedAt.toISOString()}`);
        });
      } else {
        console.log(`   ⚠️  NO ANSWERS RECORDED`);
      }
    });

    // Summary statistics
    const totalRegularAnswers = await prisma.submittedAnswer.count();
    const totalPublicAnswers = await prisma.publicSubmittedAnswer.count();

    console.log('\n📊 Summary Statistics:');
    console.log(`   Total Regular Test Answers: ${totalRegularAnswers}`);
    console.log(`   Total Public Test Answers: ${totalPublicAnswers}`);

    // Check for recent answers submitted today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRegularAnswers = await prisma.submittedAnswer.count({
      where: {
        submittedAt: {
          gte: today,
        },
      },
    });

    const todayPublicAnswers = await prisma.publicSubmittedAnswer.count({
      where: {
        submittedAt: {
          gte: today,
        },
      },
    });

    console.log("\n📅 Today's Activity:");
    console.log(`   Regular Test Answers Today: ${todayRegularAnswers}`);
    console.log(`   Public Test Answers Today: ${todayPublicAnswers}`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAnswerRecording();
