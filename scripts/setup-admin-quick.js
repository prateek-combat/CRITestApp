const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
  // Use the same DATABASE_URL that Next.js uses from environment
  const prisma = new PrismaClient();

  try {
    console.log('🔧 Setting up admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('🌐 Go to http://localhost:3000/admin/login to sign in');
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
