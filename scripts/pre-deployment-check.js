const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: '.env' });

console.log('🔍 Pre-Deployment Checklist for Test Platform\n');

const checks = [];
let passed = 0;
let failed = 0;

function checkItem(name, check, required = true) {
  try {
    const result = check();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`${required ? '❌' : '⚠️ '} ${name}`);
      if (required) failed++;
    }
  } catch (error) {
    console.log(`${required ? '❌' : '⚠️ '} ${name}: ${error.message}`);
    if (required) failed++;
  }
}

console.log('📋 Environment & Configuration');
console.log('─'.repeat(50));

checkItem('Environment file exists', () => {
  return fs.existsSync('.env') || fs.existsSync('.env.local');
});

checkItem('Package.json is valid', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return pkg.name && pkg.version && pkg.scripts && pkg.scripts.build;
});

checkItem('Next.js config exists', () => {
  return fs.existsSync('next.config.js') || fs.existsSync('next.config.mjs');
});

checkItem('Prisma schema exists', () => {
  return fs.existsSync('prisma/schema.prisma');
});

console.log('\n🔧 Build & Dependencies');
console.log('─'.repeat(50));

checkItem('Dependencies installed', () => {
  return fs.existsSync('node_modules') && fs.existsSync('package-lock.json');
});

checkItem('TypeScript compilation', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
});

checkItem('Next.js build succeeds', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
});

console.log('\n🗄️  Database & Authentication');
console.log('─'.repeat(50));

checkItem('DATABASE_URL configured', () => {
  return (
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres')
  );
});

checkItem('NEXTAUTH_SECRET configured', () => {
  return (
    process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32
  );
});

checkItem('Google OAuth credentials', () => {
  return process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;
});

console.log('\n📁 Application Structure');
console.log('─'.repeat(50));

checkItem('Admin pages exist', () => {
  return (
    fs.existsSync('src/app/admin/dashboard/page.tsx') &&
    fs.existsSync('src/app/admin/users/page.tsx') &&
    fs.existsSync('src/app/admin/tests/page.tsx')
  );
});

checkItem('API routes exist', () => {
  return (
    fs.existsSync('src/app/api/auth/[...nextauth]/route.ts') &&
    fs.existsSync('src/app/api/admin/users/route.ts')
  );
});

checkItem('Authentication components', () => {
  return fs.existsSync('src/lib/auth.ts') && fs.existsSync('src/lib/prisma.ts');
});

checkItem('Login page exists', () => {
  return fs.existsSync('src/app/login/page.tsx');
});

console.log('\n🛡️  Security & Admin Scripts');
console.log('─'.repeat(50));

checkItem('Admin management script', () => {
  return fs.existsSync('scripts/add-admin.js');
});

checkItem('Middleware configured', () => {
  return fs.existsSync('src/middleware.ts');
});

console.log('\n📊 Results');
console.log('═'.repeat(50));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log(
    '\n🎉 All checks passed! Your application is ready for deployment.'
  );
  console.log('\n📋 Next Steps:');
  console.log('1. Push your code to GitHub');
  console.log('2. Set up production environment variables');
  console.log('3. Configure Google OAuth for production URLs');
  console.log('4. Deploy to Vercel');
  console.log('5. Add production admin users');
  console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions.');
} else {
  console.log('\n⚠️  Please fix the failed checks before deploying.');
  console.log('   Review the errors above and update your configuration.');
}

console.log('');
