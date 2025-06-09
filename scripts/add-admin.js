// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addAdmin() {
  const email = process.argv[2];
  const firstName = process.argv[3] || '';
  const lastName = process.argv[4] || '';
  const role = process.argv[5] || 'ADMIN'; // ADMIN or SUPER_ADMIN

  if (!email) {
    console.error(
      'Usage: node scripts/add-admin.js <email> [firstName] [lastName] [role]'
    );
    console.error(
      'Example: node scripts/add-admin.js john@example.com John Doe ADMIN'
    );
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update existing user to admin
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: role,
          firstName: firstName || existingUser.firstName,
          lastName: lastName || existingUser.lastName,
        },
      });
      console.log(`✅ Updated existing user ${email} to ${role} role`);
      console.log(`User details:`, {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
        role: updatedUser.role,
      });
    } else {
      // Create new admin user
      const newUser = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: '', // Google users don't need password
          role: role,
        },
      });
      console.log(`✅ Created new admin user: ${email} with ${role} role`);
      console.log(`User details:`, {
        id: newUser.id,
        email: newUser.email,
        name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        role: newUser.role,
      });
    }
  } catch (error) {
    console.error('❌ Error adding admin:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addAdmin();
