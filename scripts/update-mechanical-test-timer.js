const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateMechanicalTestTimer() {
  try {
    console.log('🔍 Finding Mechanical tests...');
    
    // Look for tests with "mech" in the title
    const tests = await prisma.test.findMany({
      where: {
        OR: [
          {
            title: {
              contains: 'Mech',
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: 'mechanical',
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        questions: {
          select: {
            id: true,
            timerSeconds: true
          }
        }
      }
    });
    
    if (tests.length === 0) {
      console.log('❌ No mechanical tests found');
      return;
    }
    
    console.log(`✅ Found ${tests.length} mechanical test(s):`);
    tests.forEach(test => {
      console.log(`   • ${test.title} (${test.questions.length} questions)`);
    });
    
    // Update each test
    for (const test of tests) {
      console.log(`\n🔄 Updating test: ${test.title}`);
      
      // Check current timer settings
      const currentTimers = test.questions.map(q => q.timerSeconds);
      const uniqueTimers = [...new Set(currentTimers)];
      console.log(`⏱️  Current timer settings: ${uniqueTimers.join(', ')} seconds`);
      
      // Update all questions to 30 seconds
      const result = await prisma.question.updateMany({
        where: {
          testId: test.id
        },
        data: {
          timerSeconds: 30
        }
      });
      
      console.log(`✅ Updated ${result.count} questions to 30 seconds timer`);
      
      // Verify the update
      const updatedQuestions = await prisma.question.findMany({
        where: { testId: test.id },
        select: {
          timerSeconds: true
        }
      });
      
      const newTimers = updatedQuestions.map(q => q.timerSeconds);
      const uniqueNewTimers = [...new Set(newTimers)];
      console.log(`🎯 New timer settings: ${uniqueNewTimers.join(', ')} seconds`);
    }
    
    console.log('\n🎉 Timer update completed successfully for all mechanical tests!');
    
  } catch (error) {
    console.error('❌ Error updating mechanical test timer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateMechanicalTestTimer();
