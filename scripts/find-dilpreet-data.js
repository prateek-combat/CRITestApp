#!/usr/bin/env node

/**
 * Script to find Dilpreet Singh's test attempt data
 * Looking for dilpreetsingh9630@gmail.com with 33.0% score
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findDilpreetData() {
  console.log('🔍 Searching for Dilpreet Singh test attempt data...\n');

  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Search in regular test attempts
    console.log('📝 SEARCHING REGULAR TEST ATTEMPTS:');
    const regularAttempts = await prisma.testAttempt.findMany({
      where: {
        OR: [
          {
            candidateEmail: {
              contains: 'dilpreetsingh9630@gmail.com',
              mode: 'insensitive',
            },
          },
          { candidateEmail: { contains: 'dilpreet', mode: 'insensitive' } },
          {
            candidateName: { contains: 'Dilpreet Singh', mode: 'insensitive' },
          },
          { candidateName: { contains: 'dilpreet', mode: 'insensitive' } },
        ],
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            description: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
        submittedAnswers: {
          select: {
            isCorrect: true,
            question: {
              select: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (regularAttempts.length > 0) {
      console.log(
        `   ✅ Found ${regularAttempts.length} regular test attempts:`
      );
      for (const attempt of regularAttempts) {
        console.log(`\n   📊 ATTEMPT ID: ${attempt.id}`);
        console.log(`   👤 Candidate: ${attempt.candidateName || 'N/A'}`);
        console.log(`   📧 Email: ${attempt.candidateEmail || 'N/A'}`);
        console.log(`   🎯 Test: ${attempt.test.title}`);
        console.log(`   📝 Test ID: ${attempt.testId}`);
        console.log(`   ❓ Total Questions: ${attempt.test._count.questions}`);
        console.log(`   ✅ Raw Score: ${attempt.rawScore || 'N/A'}`);
        console.log(`   📊 Percentile: ${attempt.percentile || 'N/A'}`);
        console.log(`   ⏰ Started: ${attempt.startedAt.toLocaleString()}`);
        console.log(
          `   ✅ Completed: ${attempt.completedAt ? attempt.completedAt.toLocaleString() : 'N/A'}`
        );
        console.log(`   📈 Status: ${attempt.status}`);

        // Calculate percentage from raw score
        if (attempt.rawScore && attempt.test._count.questions > 0) {
          const percentage = (
            (attempt.rawScore / attempt.test._count.questions) *
            100
          ).toFixed(1);
          console.log(`   🔢 Calculated Percentage: ${percentage}%`);
        }

        // Count submitted answers
        const correctAnswers = attempt.submittedAnswers.filter(
          (a) => a.isCorrect
        ).length;
        const totalSubmitted = attempt.submittedAnswers.length;
        console.log(`   📝 Submitted Answers: ${totalSubmitted}`);
        console.log(`   ✅ Correct Answers: ${correctAnswers}`);

        if (totalSubmitted > 0) {
          const submittedPercentage = (
            (correctAnswers / totalSubmitted) *
            100
          ).toFixed(1);
          console.log(`   📊 Submitted Percentage: ${submittedPercentage}%`);
        }
      }
    } else {
      console.log('   ❌ No regular test attempts found');
    }

    // Search in public test attempts
    console.log('\n🌐 SEARCHING PUBLIC TEST ATTEMPTS:');
    const publicAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        OR: [
          {
            candidateEmail: {
              contains: 'dilpreetsingh9630@gmail.com',
              mode: 'insensitive',
            },
          },
          { candidateEmail: { contains: 'dilpreet', mode: 'insensitive' } },
          {
            candidateName: { contains: 'Dilpreet Singh', mode: 'insensitive' },
          },
          { candidateName: { contains: 'dilpreet', mode: 'insensitive' } },
        ],
      },
      include: {
        publicLink: {
          select: {
            id: true,
            title: true,
            test: {
              select: {
                id: true,
                title: true,
                description: true,
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
        submittedAnswers: {
          select: {
            isCorrect: true,
            question: {
              select: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (publicAttempts.length > 0) {
      console.log(`   ✅ Found ${publicAttempts.length} public test attempts:`);
      for (const attempt of publicAttempts) {
        console.log(`\n   📊 ATTEMPT ID: ${attempt.id}`);
        console.log(`   👤 Candidate: ${attempt.candidateName || 'N/A'}`);
        console.log(`   📧 Email: ${attempt.candidateEmail || 'N/A'}`);
        console.log(`   🎯 Test: ${attempt.publicLink?.test?.title || 'N/A'}`);
        console.log(`   📝 Test ID: ${attempt.publicLink?.test?.id || 'N/A'}`);
        console.log(
          `   ❓ Total Questions: ${attempt.publicLink?.test?._count?.questions || 'N/A'}`
        );
        console.log(`   ✅ Raw Score: ${attempt.rawScore || 'N/A'}`);
        console.log(`   📊 Percentile: ${attempt.percentile || 'N/A'}`);
        console.log(`   ⏰ Started: ${attempt.startedAt.toLocaleString()}`);
        console.log(
          `   ✅ Completed: ${attempt.completedAt ? attempt.completedAt.toLocaleString() : 'N/A'}`
        );
        console.log(`   📈 Status: ${attempt.status}`);

        // Calculate percentage from raw score
        if (
          attempt.rawScore &&
          attempt.publicLink?.test?._count?.questions > 0
        ) {
          const percentage = (
            (attempt.rawScore / attempt.publicLink.test._count.questions) *
            100
          ).toFixed(1);
          console.log(`   🔢 Calculated Percentage: ${percentage}%`);
        }

        // Count submitted answers
        const correctAnswers = attempt.submittedAnswers.filter(
          (a) => a.isCorrect
        ).length;
        const totalSubmitted = attempt.submittedAnswers.length;
        console.log(`   📝 Submitted Answers: ${totalSubmitted}`);
        console.log(`   ✅ Correct Answers: ${correctAnswers}`);

        if (totalSubmitted > 0) {
          const submittedPercentage = (
            (correctAnswers / totalSubmitted) *
            100
          ).toFixed(1);
          console.log(`   📊 Submitted Percentage: ${submittedPercentage}%`);
        }
      }
    } else {
      console.log('   ❌ No public test attempts found');
    }

    // Search for attempts with approximately 33% score
    console.log('\n🔍 SEARCHING FOR ATTEMPTS WITH ~33% SCORE:');

    // Search regular attempts with raw score that could give 33%
    const regularScoreAttempts = await prisma.testAttempt.findMany({
      where: {
        rawScore: {
          gte: 1,
        },
      },
      include: {
        test: {
          select: {
            id: true,
            title: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
      },
    });

    const regular33Attempts = regularScoreAttempts.filter((attempt) => {
      if (attempt.rawScore && attempt.test._count.questions > 0) {
        const percentage =
          (attempt.rawScore / attempt.test._count.questions) * 100;
        return percentage >= 32.5 && percentage <= 33.5;
      }
      return false;
    });

    if (regular33Attempts.length > 0) {
      console.log(
        `   📊 Found ${regular33Attempts.length} regular attempts with ~33% score:`
      );
      for (const attempt of regular33Attempts) {
        const percentage = (
          (attempt.rawScore / attempt.test._count.questions) *
          100
        ).toFixed(1);
        console.log(
          `   🔸 ${attempt.candidateEmail || 'No email'} - ${percentage}% (${attempt.rawScore}/${attempt.test._count.questions}) - ID: ${attempt.id}`
        );
      }
    }

    // Search public attempts with raw score that could give 33%
    const publicScoreAttempts = await prisma.publicTestAttempt.findMany({
      where: {
        rawScore: {
          gte: 1,
        },
      },
      include: {
        publicLink: {
          select: {
            test: {
              select: {
                id: true,
                title: true,
                _count: {
                  select: {
                    questions: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const public33Attempts = publicScoreAttempts.filter((attempt) => {
      if (attempt.rawScore && attempt.publicLink?.test?._count?.questions > 0) {
        const percentage =
          (attempt.rawScore / attempt.publicLink.test._count.questions) * 100;
        return percentage >= 32.5 && percentage <= 33.5;
      }
      return false;
    });

    if (public33Attempts.length > 0) {
      console.log(
        `   📊 Found ${public33Attempts.length} public attempts with ~33% score:`
      );
      for (const attempt of public33Attempts) {
        const percentage = (
          (attempt.rawScore / attempt.publicLink.test._count.questions) *
          100
        ).toFixed(1);
        console.log(
          `   🔸 ${attempt.candidateEmail || 'No email'} - ${percentage}% (${attempt.rawScore}/${attempt.publicLink.test._count.questions}) - ID: ${attempt.id}`
        );
      }
    }

    console.log('\n🎉 Search completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

findDilpreetData().catch(console.error);
