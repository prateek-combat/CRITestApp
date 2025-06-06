#!/usr/bin/env node

// Production Admin Setup Script
// Run this locally after deployment to add admin users

const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const PRODUCTION_URL = 'https://your-vercel-app-url.vercel.app'; // Update this!

async function addProductionAdmin(email, firstName, lastName, role = 'ADMIN') {
  try {
    console.log(`\n🔄 Adding admin user: ${firstName} ${lastName} (${email})`);

    const response = await fetch(`${PRODUCTION_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You might need to add authentication headers here
      },
      body: JSON.stringify({
        email,
        firstName,
        lastName,
        role,
      }),
    });

    if (response.ok) {
      const user = await response.json();
      console.log(`✅ Successfully added: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user.id}`);
    } else {
      const error = await response.text();
      console.log(`❌ Failed to add user: ${error}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Production Admin Setup');
  console.log('═'.repeat(50));

  // Update PRODUCTION_URL above with your actual Vercel URL!
  if (PRODUCTION_URL.includes('your-vercel-app-url')) {
    console.log('❌ Please update PRODUCTION_URL in this script first!');
    return;
  }

  // Add your admin users here
  await addProductionAdmin('admin1@yourcompany.com', 'Admin', 'One', 'ADMIN');
  await addProductionAdmin(
    'admin2@yourcompany.com',
    'Admin',
    'Two',
    'SUPER_ADMIN'
  );

  console.log('\n✅ Admin setup complete!');
  console.log('📋 Next steps:');
  console.log('1. These users can now sign in with Google OAuth');
  console.log(
    '2. Make sure their Google accounts use the same email addresses'
  );
  console.log('3. Test login at your production URL');
}

main().catch(console.error);
