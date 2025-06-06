#!/usr/bin/env node

/**
 * Environment Setup Script
 * Copies env.example to .env and provides setup guidance
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...\n');

const envExamplePath = path.join(process.cwd(), 'env.example');
const envPath = path.join(process.cwd(), '.env');

// Check if env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ env.example file not found!');
  console.log('   Make sure you are running this from the project root.');
  process.exit(1);
}

// Check if .env already exists and has real values
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  // Check if it contains real values (not placeholder values)
  const hasRealDatabase =
    envContent.includes('DATABASE_URL=') &&
    !envContent.includes('username:password@localhost') &&
    !envContent.includes('database_name');
  const hasRealSecret =
    envContent.includes('NEXTAUTH_SECRET=') &&
    !envContent.includes('your-secret-key');

  if (hasRealDatabase || hasRealSecret) {
    console.log('✅ .env file already exists with real configuration!');
    console.log('   Skipping setup to avoid overwriting your credentials.');
    console.log('');
    console.log('💡 If you want to reset to template:');
    console.log('   1. Backup: cp .env .env.backup');
    console.log('   2. Reset: cp env.example .env');
    console.log('   3. Edit .env with your values');
    process.exit(0);
  }

  console.log('⚠️  .env file exists but contains template values.');
  console.log('   Backing up to .env.backup...');
  fs.copyFileSync(envPath, `${envPath}.backup`);
}

// Copy env.example to .env
try {
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ Created .env from env.example');
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
}

console.log('\n📝 Next steps:');
console.log('1. Edit .env with your actual values:');
console.log('   - DATABASE_URL (Neon PostgreSQL connection string)');
console.log('   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)');
console.log(
  '   - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET (from Google Cloud Console)'
);
console.log('');
console.log('2. Run database setup:');
console.log('   npx prisma db push');
console.log('   npx prisma generate');
console.log('');
console.log('3. Create your first admin user:');
console.log(
  '   node scripts/add-admin.js your@email.com "Your" "Name" "SUPER_ADMIN"'
);
console.log('');
console.log('4. Start the development server:');
console.log('   npm run dev');
console.log('');
console.log('📖 For detailed setup instructions, see PROCTORING_SETUP.md');
console.log('');
