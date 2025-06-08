const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection established');

    // Check if User table exists
    await prisma.user.findFirst().catch(() => {
      throw new Error(
        'User table does not exist. Please run migrations first.'
      );
    });
    console.log('✅ User table exists');

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
