const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTestUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('test', 12);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
    });

    if (existingUser) {
      console.log('User test@test.com already exists');
      return;
    }

    // Create the test user
    const user = await prisma.user.create({
      data: {
        email: 'test@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
        passwordHash: hashedPassword,
      },
    });

    console.log('✅ Test user created successfully:');
    console.log('Email: test@test.com');
    console.log('Password: test');
    console.log('Role: ADMIN');
    console.log('User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestUser();
