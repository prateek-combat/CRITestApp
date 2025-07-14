const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activatePublicLink() {
  try {
    const token = 'm04N2op0ft5I';

    console.log(`Looking for public link with linkToken: ${token}`);

    // Find the public link using linkToken (not token)
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
      console.log('❌ Public link not found');

      // Let's see what public links exist
      const allLinks = await prisma.publicTestLink.findMany({
        select: {
          linkToken: true,
          title: true,
          isActive: true,
          test: {
            select: {
              title: true,
              isArchived: true,
            },
          },
        },
      });

      console.log('\n📋 Available public links:');
      allLinks.forEach((link) => {
        console.log(
          `- Token: ${link.linkToken}, Title: ${link.title}, Test: ${link.test.title}, Active: ${link.isActive}`
        );
      });

      return;
    }

    console.log('📋 Current public link status:');
    console.log('- ID:', publicLink.id);
    console.log('- Link Token:', publicLink.linkToken);
    console.log('- Title:', publicLink.title);
    console.log('- Test:', publicLink.test.title);
    console.log('- Is Active:', publicLink.isActive);
    console.log('- Expires At:', publicLink.expiresAt);
    console.log('- Max Uses:', publicLink.maxUses);
    console.log('- Used Count:', publicLink.usedCount);
    console.log('- Is Time Restricted:', publicLink.isTimeRestricted);
    console.log('- Test Archived:', publicLink.test.isArchived);

    if (publicLink.timeSlot) {
      console.log('- Time Slot:', publicLink.timeSlot.name);
      console.log('- Time Slot Active:', publicLink.timeSlot.isActive);
      console.log('- Start Time:', publicLink.timeSlot.startDateTime);
      console.log('- End Time:', publicLink.timeSlot.endDateTime);
    }

    // Update to remove all restrictions
    const updatedLink = await prisma.publicTestLink.update({
      where: { linkToken: token },
      data: {
        isActive: true,
        expiresAt: null,
        maxUses: null,
        isTimeRestricted: false,
        timeSlotId: null,
      },
    });

    // Make sure the test is not archived
    await prisma.test.update({
      where: { id: publicLink.test.id },
      data: {
        isArchived: false,
      },
    });

    console.log('\n✅ Successfully activated public link:');
    console.log('- Removed expiration date');
    console.log('- Removed usage limits');
    console.log('- Removed time restrictions');
    console.log('- Set as active');
    console.log('- Ensured test is not archived');

    console.log('\n🔗 Link should now be accessible at:');
    console.log(`https://cri-test-app.vercel.app/public-test/${token}`);
  } catch (error) {
    console.error('❌ Error activating public link:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activatePublicLink();
