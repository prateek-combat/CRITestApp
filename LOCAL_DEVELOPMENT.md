# 🚀 Local Development & Testing Guide

## 📋 Overview

This document outlines the local development setup, testing procedures, and production deployment guidelines for the CRI Test Platform.

## 🌟 Branch Strategy

### **Dev Branch (`dev`)**
- **Purpose**: Local development and testing
- **Features**: Includes local admin login and development helpers
- **Database**: Uses development database with test data
- **Authentication**: Local admin login + Google OAuth

### **Main Branch (`main`)**
- **Purpose**: Production-ready code
- **Features**: Production authentication only
- **Database**: Production database
- **Authentication**: Google OAuth only (no local admin login)

## 🔧 Local Development Setup

### **1. Environment Configuration**

Create `.env.local` with the following:

```bash
# Database (Development)
DATABASE_URL="postgresql://username:password@host:5432/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret_key"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Development Mode
NODE_ENV="development"

# AI Service
CUSTOM_AI_SERVICE_URL=https://ai-service-561500498824.us-central1.run.app

# Email Configuration
GMAIL_USER=your_email@yourdomain.com
GMAIL_APP_PASSWORD=your_gmail_app_password
TEST_EMAIL=your_test_email@yourdomain.com
```

### **2. Database Setup**

```bash
# Apply migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed database (optional)
npm run db:seed
```

### **3. Start Development Server**

```bash
# Switch to dev branch
git checkout dev

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔐 Authentication Methods

### **Local Development Authentication**

#### **Local Admin Login (Dev Only)**
- **How it works**: One-click button that bypasses credential entry
- **Credentials**: `local-admin` / `local-admin` (automatic)
- **Role**: SUPER_ADMIN
- **Visibility**: Only in `NODE_ENV=development`
- **Location**: Login page - blue button below Google login

#### **Google OAuth (Production & Dev)**
- **Email**: `prateek@combatrobotics.in`
- **Role**: SUPER_ADMIN
- **Requirements**: Pre-registered in database

## 📁 Files Modified for Local Development

### **Authentication Files**
```
src/lib/auth.ts              # Local admin credentials
src/app/login/page.tsx       # Local admin login button
scripts/add-admin.js         # User management script
```

### **Database Files**
```
prisma/migrations/           # SUPER_ADMIN role migration
prisma/schema.prisma         # SUPER_ADMIN enum
```

### **Environment Files**
```
.env.local                   # Development environment variables
```

## 🚨 Production Deployment Checklist

### **❌ Features to REMOVE for Production:**

#### **1. Local Admin Login Button**
**File**: `src/app/login/page.tsx`
```jsx
// REMOVE THIS ENTIRE SECTION:
{process.env.NODE_ENV === 'development' && (
  <button
    onClick={handleLocalAdminLogin}
    disabled={isLoading}
    className="flex w-full items-center justify-center rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
  >
    <Lock className="mr-2 h-5 w-5" />
    Local Admin Login (Dev Only)
  </button>
)}
```

#### **2. Local Admin Authentication Logic**
**File**: `src/lib/auth.ts`
```javascript
// REMOVE THIS SECTION:
// Special case for local development - admin login with no credentials
if (process.env.NODE_ENV === 'development' && 
    credentials?.email === 'local-admin' && 
    credentials?.password === 'local-admin') {
  return {
    id: 'local-admin-id',
    email: 'admin@local.dev',
    name: 'Local Admin',
    role: 'SUPER_ADMIN',
  };
}
```

#### **3. handleLocalAdminLogin Function**
**File**: `src/app/login/page.tsx`
```javascript
// REMOVE THIS ENTIRE FUNCTION:
const handleLocalAdminLogin = async () => {
  // ... entire function body
};
```

### **✅ Production Environment Variables**

Update `.env.production` or deployment environment:

```bash
# Database (Production)
DATABASE_URL="your_production_database_url"

# NextAuth (Production)
NEXTAUTH_URL="https://your-production-domain.com"
NEXTAUTH_SECRET="your_production_secret"

# Google OAuth (Production URLs)
GOOGLE_CLIENT_ID="your_production_google_client_id"
GOOGLE_CLIENT_SECRET="your_production_google_client_secret"

# Production Mode
NODE_ENV="production"
```

### **🔄 Production Deployment Steps**

1. **Create Production Branch**
   ```bash
   git checkout main
   git pull origin main
   git merge dev  # Or create PR: dev → main
   ```

2. **Remove Local Development Features**
   - Remove local admin login button
   - Remove local admin authentication logic
   - Remove development-only functions

3. **Update Environment Variables**
   - Set production DATABASE_URL
   - Set production NEXTAUTH_URL
   - Set NODE_ENV="production"

4. **Deploy**
   ```bash
   git add .
   git commit -m "prod: Remove local development features for production"
   git push origin main
   ```

## 🔑 User Management

### **Adding New Admin Users**

```bash
# Add new admin user
node scripts/add-admin.js user@example.com "First Name" "Last Name" ADMIN

# Add new super admin user
node scripts/add-admin.js user@example.com "First Name" "Last Name" SUPER_ADMIN
```

### **Current Super Admins**
- `prateek@combatrobotics.in` - SUPER_ADMIN (Google OAuth)

## 🛠 Development Commands

```bash
# Database
npm run db:migrate        # Apply migrations
npm run db:generate       # Generate Prisma client
npm run db:studio         # Open Prisma Studio
npm run db:reset          # Reset database (dev only)

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
```

## 📝 Git Workflow

### **Development Workflow**
```bash
# 1. Switch to dev branch
git checkout dev

# 2. Make changes
# ... code changes ...

# 3. Commit changes
git add .
git commit -m "feat: description of changes"

# 4. Push to dev
git push origin dev
```

### **Production Release Workflow**
```bash
# 1. Merge dev to main (via PR or direct merge)
git checkout main
git merge dev

# 2. Remove local development features
# ... remove local admin login ...

# 3. Update environment for production
# ... update .env.production ...

# 4. Deploy to production
git add .
git commit -m "prod: Production release vX.X.X"
git push origin main
```

## 🚨 Security Notes

### **Development Security**
- **Local admin login**: Only works in development mode
- **Database**: Uses development database with test data
- **Credentials**: Hardcoded for development convenience

### **Production Security**
- **No local admin login**: Removed completely
- **Google OAuth only**: Pre-registered users only
- **Environment variables**: Secured through deployment platform
- **Database**: Production database with real data

## 📞 Support

For any issues with local development setup:

1. **Database Issues**: Check DATABASE_URL in `.env.local`
2. **Authentication Issues**: Verify Google OAuth credentials
3. **Migration Issues**: Run `npm run db:migrate`
4. **Local Admin Login**: Ensure `NODE_ENV=development`

## 🔄 Version Control

- **Dev Branch**: All development and testing features
- **Main Branch**: Production-ready code only
- **Feature Branches**: For new features (merge to dev first)
- **Hotfix Branches**: For urgent production fixes (merge to main)

---

**🎯 Remember**: Always test in development first, then remove local development features before production deployment! 