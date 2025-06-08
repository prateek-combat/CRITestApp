const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Check if User table exists by attempting a simple query
    try {
      await prisma.user.findFirst();
      console.log('✅ User table exists');
    } catch (error) {
      console.error('❌ User table does not exist or is not accessible');
      console.error('🔧 This usually means:');
      console.error('   1. Database migrations have not been run');
      console.error('   2. Database was reset but schema not recreated');
      console.error('   3. Database connection issues');
      throw new Error(
        'User table does not exist. Please run migrations or db push first.'
      );
    }

    // Create admin user
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash: 'admin', // In a real app, this should be properly hashed
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin user created/updated:', {
      id: admin.id,
      email: admin.email,
    });
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
