# 🚀 Local Development & Testing Guide

## 📋 Overview

This guide covers local setup, database initialization, and authentication for the CRI Test Platform.

## 🔧 Local Development Setup

### 1) Environment Configuration

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

# AI Service (optional)
CUSTOM_AI_SERVICE_URL=https://ai-service-561500498824.us-central1.run.app

# Email Configuration
GMAIL_USER=your_email@yourdomain.com
GMAIL_APP_PASSWORD=your_gmail_app_password
TEST_EMAIL=your_test_email@yourdomain.com
```

### 2) Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Apply schema to the database
npm run db:push

# Seed database (optional)
npx prisma db seed

# Prisma Studio (optional)
npx prisma studio
```

### 3) Start Development Server

```bash
npm install
npm run dev
```

## 🔐 Authentication

- **Google OAuth only**: Admins must be pre-registered in the database.
- Add admins via:

```bash
node scripts/add-admin.js user@example.com "First" "Last" ADMIN
node scripts/add-admin.js user@example.com "First" "Last" SUPER_ADMIN
```

## 🛠 Development Commands

```bash
# Database
npm run db:push
npm run db:generate
npx prisma db seed
npx prisma studio

# Development
npm run dev
npm run build
npm run start
npm run lint

# Testing
npm run test
npm run test:watch
npm run test:integration
npm run test:e2e
```

## 🚨 Production Notes

- Ensure `NEXTAUTH_URL` and OAuth credentials match production domains.
- Only pre-registered admins can sign in.
- Use the deployment environment for secrets (do not commit `.env` files).
