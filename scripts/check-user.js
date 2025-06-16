const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
    });

    if (!user) {
      console.log('❌ User test@test.com does not exist');
      return;
    }

    console.log('✅ User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('First Name:', user.firstName);
    console.log('Last Name:', user.lastName);
    console.log('Role:', user.role);
    console.log('Created At:', user.createdAt);
    console.log('Password Hash Length:', user.passwordHash.length);

    // Test password verification
    const passwordMatch = await bcrypt.compare('test', user.passwordHash);
    console.log('Password "test" matches:', passwordMatch ? '✅ YES' : '❌ NO');

    // Test wrong password
    const wrongPasswordMatch = await bcrypt.compare('wrong', user.passwordHash);
    console.log(
      'Password "wrong" matches:',
      wrongPasswordMatch ? '✅ YES' : '❌ NO'
    );
  } catch (error) {
    console.error('❌ Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
