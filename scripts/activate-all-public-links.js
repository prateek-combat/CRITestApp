const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateAllPublicLinks() {
  try {
    // List of tokens to check and activate
    const tokens = [
      'm04N2op0ft5I', // General Aptitude Test (already fixed)
      'CiK2ohHw6FpB', // Mechanical Internship Test
      'b6xa62NBm5TV', // Electronics Internship Test
      '0_6yILZHYrzu', // Software Internship Test
    ];

    console.log('🔍 Checking and activating all public test links...\n');

    for (const token of tokens) {
      console.log(`\n📋 Processing token: ${token}`);
      console.log('='.repeat(50));

      try {
        // Find the public link using linkToken
        const publicLink = await prisma.publicTestLink.findUnique({
          where: { linkToken: token },
          include: {
            test: {
              select: {
                id: true,
                title: true,
                isArchived: true,
              },
            },
            timeSlot: true,
          },
        });

        if (!publicLink) {
          console.log(`❌ Public link not found for token: ${token}`);
          continue;
        }

        console.log(`📝 Found link: ${publicLink.title}`);
        console.log(`📝 Test: ${publicLink.test.title}`);
        console.log(`📝 Is Active: ${publicLink.isActive}`);
        console.log(`📝 Test Archived: ${publicLink.test.isArchived}`);
        console.log(`📝 Expires At: ${publicLink.expiresAt || 'Never'}`);
        console.log(`📝 Max Uses: ${publicLink.maxUses || 'Unlimited'}`);
        console.log(`📝 Used Count: ${publicLink.usedCount}`);
        console.log(`📝 Is Time Restricted: ${publicLink.isTimeRestricted}`);

        // Check if fixes are needed
        const fixes = {};
        const testFixes = {};

        if (!publicLink.isActive) {
          fixes.isActive = true;
          console.log('🔧 Will activate public link');
        }

        if (publicLink.expiresAt) {
          fixes.expiresAt = null;
          console.log('🔧 Will remove expiration date');
        }

        if (publicLink.maxUses) {
          fixes.maxUses = null;
          console.log('🔧 Will remove usage limits');
        }

        if (publicLink.isTimeRestricted) {
          fixes.isTimeRestricted = false;
          fixes.timeSlotId = null;
          console.log('🔧 Will remove time restrictions');
        }

        if (publicLink.test.isArchived) {
          testFixes.isArchived = false;
          console.log('🔧 Will unarchive test');
        }

        // Apply fixes if needed
        if (Object.keys(fixes).length > 0) {
          await prisma.publicTestLink.update({
            where: { linkToken: token },
            data: fixes,
          });
          console.log('✅ Applied public link fixes');
        }

        if (Object.keys(testFixes).length > 0) {
          await prisma.test.update({
            where: { id: publicLink.test.id },
            data: testFixes,
          });
          console.log('✅ Applied test fixes');
        }

        if (
          Object.keys(fixes).length === 0 &&
          Object.keys(testFixes).length === 0
        ) {
          console.log('✅ No fixes needed - link is already active');
        }

        console.log(
          `🔗 Link: https://cri-test-app.vercel.app/public-test/${token}`
        );
      } catch (error) {
        console.error(`❌ Error processing token ${token}:`, error.message);
      }
    }

    console.log('\n🎉 All public links processed successfully!');
  } catch (error) {
    console.error('❌ Error in activateAllPublicLinks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateAllPublicLinks();
