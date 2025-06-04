# 🚀 Deployment Guide - IQ Test Platform

## Overview
This guide will help you deploy your Next.js IQ Test Platform to production using Vercel with your existing Supabase database.

## 📋 Prerequisites Checklist

- ✅ **Supabase Database**: Already configured and working
- ✅ **Google OAuth**: Credentials configured for localhost
- ✅ **NextAuth.js**: Authentication system working
- ✅ **Admin System**: User management functional
- ✅ **Application**: Fully tested locally

## 🌐 Deployment Options

### Option 1: Vercel (Recommended) ⭐
- **Best for**: Next.js applications (native support)
- **Pros**: Zero-config deployment, automatic SSL, global CDN
- **Cost**: Free tier available, $20/month for Pro

### Option 2: Railway
- **Best for**: Full-stack applications with databases
- **Pros**: Simple deployment, built-in databases
- **Cost**: $5/month starter plan

### Option 3: DigitalOcean App Platform
- **Best for**: Scalable applications
- **Pros**: Predictable pricing, good performance
- **Cost**: $12/month basic plan

## 🎯 Deployment Plan (Vercel + Supabase)

### Phase 1: Pre-Deployment Setup

#### 1.1 Environment Variables Audit
Create a production `.env.production` file with:

```bash
# Database
DATABASE_URL="your_supabase_connection_string"

# NextAuth.js
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="generate_a_strong_random_secret"

# Google OAuth (Production)
GOOGLE_CLIENT_ID="your_production_google_client_id"
GOOGLE_CLIENT_SECRET="your_production_google_client_secret"

# Optional: Analytics
GOOGLE_ANALYTICS_ID="GA-XXXXX"
```

#### 1.2 Update Google OAuth Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Credentials > OAuth 2.0 Client IDs**
3. Add production URLs to **Authorized redirect URIs**:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google
   ```

#### 1.3 Verify Supabase Configuration
1. **Connection Pooling**: Ensure enabled for production
2. **Row Level Security**: Review and enable if needed
3. **Database Backup**: Configure automatic backups

### Phase 2: Vercel Deployment

#### 2.1 Prepare Repository
```bash
# Make sure everything is committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### 2.2 Deploy to Vercel
1. **Connect Repository**:
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Build Settings**:
   ```
   Framework Preset: Next.js
   Root Directory: iq-test-app
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

3. **Environment Variables**:
   Add all production environment variables in Vercel dashboard

#### 2.3 Custom Domain Setup (Optional)
1. **Purchase Domain**: Use Vercel Domains, Namecheap, or GoDaddy
2. **Configure DNS**: Add domain in Vercel project settings
3. **SSL Certificate**: Automatically provided by Vercel

### Phase 3: Post-Deployment Configuration

#### 3.1 Test Production Environment
- [ ] **Authentication Flow**: Test Google login
- [ ] **Admin Access**: Verify admin panel works
- [ ] **Database Operations**: Test CRUD operations
- [ ] **File Uploads**: Test Excel/CSV imports
- [ ] **Email Functions**: Test invitation system

#### 3.2 Create Production Admin Users
```bash
# Using the production database
node scripts/add-admin.js admin@yourcompany.com "Admin" "User" "SUPER_ADMIN"
```

#### 3.3 Security Hardening
1. **Environment Variables**: Remove any test/debug flags
2. **CORS Configuration**: Restrict to production domains only
3. **Rate Limiting**: Configure if handling high traffic
4. **Monitoring**: Set up error tracking (Sentry, LogRocket)

## 📝 Step-by-Step Deployment Checklist

### Pre-Deployment (Local)
- [ ] Run final tests: `npm run test` (if tests exist)
- [ ] Build locally: `npm run build`
- [ ] Check for any build errors
- [ ] Verify all environment variables are documented
- [ ] Push latest changes to GitHub

### Vercel Setup
- [ ] Create Vercel account and connect GitHub
- [ ] Import repository and configure build settings
- [ ] Add all environment variables
- [ ] Deploy and get preview URL
- [ ] Test preview deployment thoroughly

### DNS & Domain
- [ ] Purchase/configure custom domain (optional)
- [ ] Update Google OAuth with production URLs
- [ ] Update NEXTAUTH_URL environment variable
- [ ] Test with custom domain

### Production Testing
- [ ] Test Google authentication flow
- [ ] Verify admin user management works
- [ ] Test Excel/CSV import functionality
- [ ] Create test invitation and verify email delivery
- [ ] Check all admin panel features
- [ ] Test on mobile devices

### Go-Live
- [ ] Update any documentation with production URLs
- [ ] Inform users about the new platform
- [ ] Monitor logs for any issues
- [ ] Set up monitoring and alerting

## 🔧 Environment Variables Reference

### Required for Production
```bash
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="super-secret-jwt-secret-min-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Optional
```bash
# Email (if using SMTP for invitations)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Analytics
GOOGLE_ANALYTICS_ID="GA-XXXXX"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
```

## 🚨 Common Issues & Solutions

### Issue 1: OAuth Redirect Error
**Problem**: Google OAuth fails in production
**Solution**: 
- Verify redirect URIs in Google Console
- Check NEXTAUTH_URL environment variable
- Ensure HTTPS is enabled

### Issue 2: Database Connection Issues
**Problem**: Can't connect to Supabase in production
**Solution**:
- Verify DATABASE_URL is correct
- Check Supabase connection pooling settings
- Ensure IP allowlist includes Vercel IPs (or allow all)

### Issue 3: Build Errors
**Problem**: Deployment fails during build
**Solution**:
- Check TypeScript errors: `npx tsc --noEmit`
- Verify all imports are correct
- Check for missing dependencies

### Issue 4: Environment Variables Not Working
**Problem**: Features broken due to missing env vars
**Solution**:
- Verify all variables are added in Vercel dashboard
- Check variable names match exactly
- Redeploy after adding new variables

## 📊 Post-Deployment Monitoring

### Key Metrics to Track
1. **User Authentication**: Success rate of Google logins
2. **Database Performance**: Query response times
3. **File Uploads**: Excel/CSV import success rates
4. **Error Rates**: 4xx/5xx HTTP responses
5. **User Activity**: Admin panel usage

### Recommended Tools
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **Uptime**: UptimeRobot
- **Database**: Supabase built-in monitoring

## 🎉 Success Criteria

Your deployment is successful when:
- ✅ Application loads at production URL
- ✅ Google authentication works for admin users
- ✅ Admin panel is accessible and functional
- ✅ Excel/CSV imports work correctly
- ✅ All environment variables are properly configured
- ✅ Database operations are working
- ✅ No critical errors in logs

## 🔄 Future Updates

### Updating Production
```bash
# 1. Test changes locally
npm run dev

# 2. Commit and push
git add .
git commit -m "Feature: Description"
git push origin main

# 3. Vercel auto-deploys from main branch
# 4. Monitor deployment in Vercel dashboard
```

### Database Migrations
- Use Prisma migrations: `npx prisma migrate deploy`
- Always backup before major schema changes
- Test migrations on staging environment first

---

## 🆘 Need Help?

If you encounter issues during deployment:
1. Check Vercel deployment logs
2. Review Supabase database logs
3. Verify all environment variables
4. Test locally with production environment variables
5. Check Google Cloud Console for OAuth issues

**Ready to deploy? Let's start with Phase 1! 🚀** 