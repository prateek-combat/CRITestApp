#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('🚀 Google Workspace Email Setup for Test Platform\n');

async function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupEmail() {
  try {
    console.log(
      'This script will help you configure Google Workspace email integration.\n'
    );

    // Get email configuration
    const gmailUser = await promptUser(
      '📧 Enter your dedicated Gmail address (e.g., testplatform@yourdomain.com): '
    );

    if (!gmailUser || !gmailUser.includes('@')) {
      console.log('❌ Invalid email address. Please run the script again.');
      process.exit(1);
    }

    const gmailPassword = await promptUser(
      '🔐 Enter your Gmail App Password (16 characters, no spaces): '
    );

    if (!gmailPassword || gmailPassword.replace(/\s/g, '').length !== 16) {
      console.log('❌ Invalid app password. It should be 16 characters long.');
      console.log(
        '💡 Generate one at: https://myaccount.google.com/apppasswords'
      );
      process.exit(1);
    }

    const testEmail = await promptUser(
      '📨 Enter test email address (optional, press Enter to use Gmail address): '
    );
    const nextAuthUrl = await promptUser(
      '🌐 Enter your domain URL (e.g., https://yourdomain.com): '
    );

    // Read existing .env.local or create new
    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      console.log(
        '\n📄 Found existing .env.local file. Updating email configuration...'
      );
    } else {
      console.log('\n📄 Creating new .env.local file...');
    }

    // Remove existing email configuration
    envContent = envContent
      .split('\n')
      .filter(
        (line) =>
          !line.startsWith('GMAIL_USER=') &&
          !line.startsWith('GMAIL_APP_PASSWORD=') &&
          !line.startsWith('TEST_EMAIL=') &&
          !line.startsWith('NEXTAUTH_URL=')
      )
      .join('\n');

    // Add email configuration
    const emailConfig = `
# Google Workspace Email Configuration
GMAIL_USER=${gmailUser}
GMAIL_APP_PASSWORD=${gmailPassword.replace(/\s/g, '')}
${testEmail ? `TEST_EMAIL=${testEmail}` : `TEST_EMAIL=${gmailUser}`}
${nextAuthUrl ? `NEXTAUTH_URL=${nextAuthUrl}` : ''}
`;

    envContent = envContent.trim() + '\n' + emailConfig;

    // Write to .env.local
    fs.writeFileSync(envPath, envContent);

    console.log('\n✅ Email configuration saved to .env.local');
    console.log('\n📋 Configuration Summary:');
    console.log(`   📧 Gmail User: ${gmailUser}`);
    console.log(`   🔐 App Password: ${'*'.repeat(16)}`);
    console.log(`   📨 Test Email: ${testEmail || gmailUser}`);
    console.log(`   🌐 Domain: ${nextAuthUrl || 'Not set'}`);

    console.log('\n🧪 Next Steps:');
    console.log('1. Restart your development server (npm run dev)');
    console.log('2. Test the email configuration:');
    console.log('   curl -X POST http://localhost:3000/api/test-email');
    console.log('3. Check your Gmail sent folder for the test email');
    console.log('4. Start sending invitations! 🚀');

    console.log('\n💡 Troubleshooting:');
    console.log('- If authentication fails, regenerate your app password');
    console.log(
      '- Ensure 2-Step Verification is enabled on your Google account'
    );
    console.log('- Check the EMAIL_SETUP.md file for detailed instructions');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n👋 Setup cancelled. Run the script again when ready.');
  process.exit(0);
});

setupEmail();
