const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateGeneralAptitudeTestTimer() {
  try {
    console.log('🔍 Finding General Aptitude tests...');
    
    // Look for tests with "general" or "aptitude" in the title
    const tests = await prisma.test.findMany({
      where: {
        OR: [
          {
            title: {
              contains: 'General',
              mode: 'insensitive'
            }
          },
          {
            title: {
              contains: 'Aptitude',
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
          },
          orderBy: {
            id: 'asc'  // Ensure consistent ordering
          }
        }
      }
    });
    
    if (tests.length === 0) {
      console.log('❌ No general aptitude tests found');
      return;
    }
    
    console.log(`✅ Found ${tests.length} general aptitude test(s):`);
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
      
      if (test.questions.length >= 50) {
        console.log('📝 Updating timers: First 40 questions → 45 seconds, Last 10 questions → 20 seconds');
        
        // Update first 40 questions to 45 seconds
        const first40Questions = test.questions.slice(0, 40);
        if (first40Questions.length > 0) {
          const result1 = await prisma.question.updateMany({
            where: {
              id: {
                in: first40Questions.map(q => q.id)
              }
            },
            data: {
              timerSeconds: 45
            }
          });
          console.log(`✅ Updated first ${result1.count} questions to 45 seconds`);
        }
        
        // Update last 10 questions to 20 seconds
        const last10Questions = test.questions.slice(40, 50);
        if (last10Questions.length > 0) {
          const result2 = await prisma.question.updateMany({
            where: {
              id: {
                in: last10Questions.map(q => q.id)
              }
            },
            data: {
              timerSeconds: 20
            }
          });
          console.log(`✅ Updated last ${result2.count} questions to 20 seconds`);
        }
        
      } else {
        console.log(`⚠️  Test has ${test.questions.length} questions, expected 50+. Skipping update.`);
        continue;
      }
      
      // Verify the update
      const updatedQuestions = await prisma.question.findMany({
        where: { testId: test.id },
        select: {
          timerSeconds: true
        },
        orderBy: {
          id: 'asc'
        }
      });
      
      const newTimers = updatedQuestions.map(q => q.timerSeconds);
      console.log(`🎯 New timer pattern:`);
      console.log(`   First 40 questions: ${newTimers.slice(0, 40).every(t => t === 45) ? '45 seconds ✅' : 'Mixed timers ❌'}`);
      console.log(`   Last 10 questions: ${newTimers.slice(40, 50).every(t => t === 20) ? '20 seconds ✅' : 'Mixed timers ❌'}`);
    }
    
    console.log('\n🎉 Timer update completed successfully for all general aptitude tests!');
    
  } catch (error) {
    console.error('❌ Error updating general aptitude test timer:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGeneralAptitudeTestTimer();
