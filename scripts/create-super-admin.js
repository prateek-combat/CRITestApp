const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating SUPER_ADMIN user...');

  try {
    // Hash the password
    const passwordHash = await bcrypt.hash('superadmin', 10);

    // Create or update super admin user
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: {
        role: 'SUPER_ADMIN',
        passwordHash,
      },
      create: {
        email: 'superadmin@example.com',
        passwordHash,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
      },
    });

    console.log('✅ Super Admin user created/updated:', {
      id: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
    });

    console.log('\n📌 Login credentials:');
    console.log('   Email: superadmin@example.com');
    console.log('   Password: superadmin');
    console.log('\n🎉 You can now delete tests with this account!');
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
