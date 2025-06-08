# 🚨 Production Preparation Checklist

## ⚠️ CRITICAL: Remove Before Production Deployment

### 🔍 **Quick Search Commands**

Use these commands to find local development features that need removal:

```bash
# Find local admin login references
grep -r "local-admin" src/
grep -r "Local Admin Login" src/
grep -r "NODE_ENV.*development" src/

# Find development-only code
grep -r "process.env.NODE_ENV.*development" src/
```

---

## 📝 **Manual Removal Checklist**

### ❌ **1. Remove Local Admin Login Button**
**File**: `src/app/login/page.tsx`

**Search for and REMOVE**:
```jsx
{process.env.NODE_ENV === 'development' && (
  <button
    onClick={handleLocalAdminLogin}
    // ... entire button component
  </button>
)}
```

### ❌ **2. Remove Local Admin Authentication Logic**
**File**: `src/lib/auth.ts`

**Search for and REMOVE**:
```javascript
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

### ❌ **3. Remove Local Admin Login Function**
**File**: `src/app/login/page.tsx`

**Search for and REMOVE**:
```javascript
const handleLocalAdminLogin = async () => {
  // ... entire function body
};
```

### ❌ **4. Update Space-y-3 to Space-y-0 (Optional)**
**File**: `src/app/login/page.tsx`

**Change**:
```jsx
<div className="mt-6 space-y-3">
```
**To**:
```jsx
<div className="mt-6">
```

---

## ✅ **Production Environment Setup**

### **Environment Variables to Update**:

```bash
# Production Database
DATABASE_URL="your_production_database_url"

# Production Domain
NEXTAUTH_URL="https://your-production-domain.com"

# Production Mode
NODE_ENV="production"

# Production Google OAuth (if different)
GOOGLE_CLIENT_ID="your_production_google_client_id"
GOOGLE_CLIENT_SECRET="your_production_google_client_secret"
```

---

## 🔍 **Verification Commands**

After making changes, verify all local development features are removed:

```bash
# Should return NO results:
grep -r "local-admin" src/
grep -r "Local Admin Login" src/
grep -r "handleLocalAdminLogin" src/

# Should only return production-safe NODE_ENV checks:
grep -r "NODE_ENV" src/
```

---

## 🚀 **Production Deployment Commands**

```bash
# 1. Switch to main branch
git checkout main

# 2. Merge from dev (after removing local features)
git merge dev

# 3. Verify build works
npm run build

# 4. Commit production changes
git add .
git commit -m "prod: Remove local development features for production deployment"

# 5. Push to production
git push origin main
```

---

## ⚡ **Quick Production Ready Script**

Create a script to automate the search process:

```bash
#!/bin/bash
echo "🔍 Searching for local development features..."
echo ""

echo "❌ Local Admin References:"
grep -rn "local-admin" src/ || echo "✅ None found"
echo ""

echo "❌ Local Admin Login Button:"
grep -rn "Local Admin Login" src/ || echo "✅ None found"
echo ""

echo "❌ Development Environment Checks:"
grep -rn "NODE_ENV.*development" src/ || echo "✅ None found"
echo ""

echo "❌ Local Admin Function:"
grep -rn "handleLocalAdminLogin" src/ || echo "✅ None found"
echo ""

echo "🚨 If any results above, remove them before production deployment!"
```

Save as `scripts/check-production.sh` and run with:
```bash
chmod +x scripts/check-production.sh
./scripts/check-production.sh
```

---

## 🎯 **Final Verification**

Before deploying to production:

1. ✅ **No local admin login visible** in browser
2. ✅ **Only Google OAuth works** for authentication  
3. ✅ **Build completes** without errors (`npm run build`)
4. ✅ **No development references** in search results
5. ✅ **Environment variables** set to production values
6. ✅ **NODE_ENV=production** in deployment environment

---

**🔥 IMPORTANT**: Test locally with `NODE_ENV=production` before deploying to ensure local admin features are properly hidden! 