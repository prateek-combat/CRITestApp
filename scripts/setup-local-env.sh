#!/bin/bash

echo "🚀 Setting up local development environment..."
echo "============================================="

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
    echo ""
    echo "Current configuration:"
    echo "- DATABASE_URL: $(grep 'DATABASE_URL=' .env.local | cut -d'=' -f1)"
    echo "- NEXTAUTH_URL: $(grep 'NEXTAUTH_URL=' .env.local | cut -d'=' -f2)"
    echo "- GOOGLE_CLIENT_ID: $(grep 'GOOGLE_CLIENT_ID=' .env.local | cut -d'=' -f1)"
    echo "- NODE_ENV: $(grep 'NODE_ENV=' .env.local | cut -d'=' -f2)"
    echo ""
    echo "To update credentials, edit .env.local manually or delete it and run this script again."
else
    echo "⚠️  .env.local not found. Creating template..."
    
    cat > .env.local << 'EOF'
# Database (Development) - UPDATE WITH ACTUAL CREDENTIALS
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Google OAuth - UPDATE WITH ACTUAL CREDENTIALS
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Development Mode
NODE_ENV="development"

# AI Service
CUSTOM_AI_SERVICE_URL=https://ai-service-561500498824.us-central1.run.app

# Email Configuration - UPDATE WITH ACTUAL CREDENTIALS
GMAIL_USER=your_email@yourdomain.com
GMAIL_APP_PASSWORD=your_gmail_app_password
TEST_EMAIL=your_test_email@yourdomain.com
EOF
    
    echo "✅ Created .env.local template"
    echo ""
    echo "🚨 IMPORTANT: Update the following values in .env.local:"
    echo "   - DATABASE_URL (with actual database credentials)"
    echo "   - GOOGLE_CLIENT_ID (from Google Cloud Console)"
    echo "   - GOOGLE_CLIENT_SECRET (from Google Cloud Console)"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo "   - Email configuration (if using email features)"
fi

echo ""
echo "📋 Next steps:"
echo "1. Update .env.local with actual credentials"
echo "2. npm install"
echo "3. npm run db:migrate"
echo "4. npm run dev"
echo ""
echo "🔐 Local Admin Login:"
echo "   - Use the blue 'Local Admin Login (Dev Only)' button"
echo "   - No credentials needed - just click and go!"
echo ""
echo "📖 For detailed setup instructions, see LOCAL_DEVELOPMENT.md" 