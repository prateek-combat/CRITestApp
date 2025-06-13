const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserIds() {
  try {
    console.log('🔍 Checking user ID mismatch issue...\n');

    // Check Prateek's user in database
    const prateekUser = await prisma.user.findUnique({
      where: { email: 'prateek@combatrobotics.in' },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log('📋 Database User for prateek@combatrobotics.in:');
    if (prateekUser) {
      console.log(`   ID: ${prateekUser.id}`);
      console.log(`   Email: ${prateekUser.email}`);
      console.log(`   Role: ${prateekUser.role}`);
      console.log(`   Name: ${prateekUser.firstName} ${prateekUser.lastName}`);
    } else {
      console.log('   ❌ User not found in database');
    }

    console.log('\n🔧 Session vs Database ID Issue:');
    console.log('   Session ID: prateek-admin-id');
    console.log(`   Database ID: ${prateekUser?.id || 'NOT_FOUND'}`);

    if (prateekUser && prateekUser.id !== 'prateek-admin-id') {
      console.log(
        '   ⚠️  MISMATCH DETECTED! This is causing the foreign key error.'
      );
      console.log(
        '\n🛠️  Solution: Update auth configuration to use correct user ID'
      );
    } else {
      console.log('   ✅ IDs match');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkUserIds();
}
