# CI/CD Pipeline Testing Guide

This guide explains how to test the CI/CD pipeline locally and validate it before deployment.

## 📋 Testing Methods

### 1. **Quick Component Tests** (Individual verification)

Test each component of the pipeline individually:

```bash
# Code Quality
npm run lint
npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}" --ignore-path .gitignore
npx tsc --noEmit

# Unit Tests
npm test

# Integration Tests
npm run test:integration

# Build Process
npm run build

# Security Audit
npm audit --audit-level moderate

# Database Schema
DATABASE_URL="postgresql://test:test@localhost:5432/testdb" npx prisma validate

# Health Endpoint
curl http://localhost:3000/api/health
```

### 2. **Comprehensive Pipeline Test** (All components)

Run the complete pipeline simulation:

```bash
# Make script executable (first time only)
chmod +x scripts/test-pipeline-locally.sh

# Run comprehensive test
./scripts/test-pipeline-locally.sh
```

This script tests:

- ✅ ESLint code quality
- ✅ Prettier formatting
- ✅ TypeScript compilation
- ✅ Jest unit tests
- ✅ Next.js build process
- ✅ Security audits
- ✅ Database validation
- ✅ Health endpoint
- ✅ E2E framework setup

### 3. **E2E Tests with Running Server**

Test the application end-to-end with a live server:

```bash
# Make script executable (first time only)
chmod +x scripts/test-e2e-full.sh

# Run E2E tests
./scripts/test-e2e-full.sh
```

This script:

- 🚀 Starts development server
- 🏥 Tests health endpoint
- 🎭 Runs Playwright E2E tests
- 📊 Generates test report
- 🧹 Cleans up resources

### 4. **GitHub Actions Simulation**

Simulate the exact GitHub Actions workflow:

```bash
# Make script executable (first time only)
chmod +x scripts/simulate-github-actions.sh

# Run GitHub Actions simulation
./scripts/simulate-github-actions.sh
```

This simulates:

- 🏗️ Multiple parallel jobs
- 📦 Dependency installation
- 🔍 Code quality checks
- 🧪 Unit testing
- 🔨 Building
- 🔒 Security scanning
- 💾 Database testing

## 🎯 Testing Scenarios

### **Scenario 1: Pre-commit Testing**

```bash
# Quick validation before committing
npm run lint
npm test
npm run build
```

### **Scenario 2: Pre-push Testing**

```bash
# Comprehensive validation before pushing
./scripts/test-pipeline-locally.sh
```

### **Scenario 3: Pre-deployment Testing**

```bash
# Full validation including E2E
./scripts/test-e2e-full.sh
```

### **Scenario 4: CI/CD Troubleshooting**

```bash
# Simulate exact GitHub Actions behavior
./scripts/simulate-github-actions.sh
```

## 🔧 Test Configuration

### **Environment Variables**

Create `.env.test` for testing:

```bash
DATABASE_URL=postgresql://test:test@localhost:5432/testdb
NEXTAUTH_SECRET=test-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### **Jest Configuration**

- **Config**: `config/jest/jest.config.js`
- **Setup**: `config/jest/jest.setup.js`
- **Environment**: `config/jest/jest.env.js`
- **Coverage**: 50% threshold for all metrics

### **Playwright Configuration**

- **Config**: `config/playwright/playwright.config.ts`
- **Tests**: `e2e/` directory
- **Browsers**: Chromium, Firefox, WebKit, Mobile
- **Defaults**: Uses `127.0.0.1:3001` for E2E; override with `PW_HOST`/`PW_PORT`

### **Database Testing**

- **Schema validation**: Prisma validate
- **Mock connections**: Test URLs
- **Migration testing**: Isolated databases

## 📊 Expected Results

### **Successful Pipeline**

```
✅ ESLint: Passed (or acceptable warnings)
✅ Prettier: Formatted correctly
✅ TypeScript: No critical errors
✅ Jest: All tests passing
✅ Build: Successful compilation
✅ Security: No high-severity vulnerabilities
✅ Database: Schema valid
✅ E2E: All tests passing
```

## 🐛 Common Issues & Solutions

### **ESLint Errors**

```bash
# Auto-fix what's possible
npm run lint -- --fix

# Common issues:
# - Unescaped HTML entities: Use &quot; instead of "
# - Missing React hook dependencies
# - Use Link instead of <a> for navigation
```

### **Prettier Formatting**

```bash
# Auto-fix formatting
npx prettier --write "**/*.{js,jsx,ts,tsx,json,css,md}" --ignore-path .gitignore
```

### **TypeScript Errors**

```bash
# Check with more details
npx tsc --noEmit --pretty

# Common issues:
# - Missing module declarations
# - Next.js 15 compatibility
# - Async parameter handling
```

### **Security Vulnerabilities**

```bash
# Check vulnerabilities
npm audit

# Auto-fix (be careful with --force)
npm audit fix

# Update dependencies
npm update
```

### **E2E Test Issues**

```bash
# Install browsers
npx playwright install

# Run specific test
npx playwright test example.spec.ts

# Debug mode
npx playwright test -c config/playwright/playwright.config.ts --debug
```

## 📈 Performance Benchmarks

### **Test Execution Times**

- **Unit Tests**: ~1-2 seconds
- **Build Process**: ~30-60 seconds
- **E2E Tests**: ~2-5 minutes
- **Full Pipeline**: ~5-10 minutes

### **Resource Usage**

- **Memory**: ~512MB-1GB during testing
- **Disk**: ~2GB for dependencies and artifacts
- **Network**: Minimal (local testing)

## 🚀 CI/CD Integration

### **GitHub Actions Workflow**

The pipeline runs automatically on:

- **Push to `main`**: Full pipeline + production deployment
- **Push to `dev`**: Full pipeline + staging deployment
- **Pull Requests**: Code quality + tests only

### **Manual Triggers**

```bash
# Trigger specific workflow
gh workflow run ci-cd.yml

# Check workflow status
gh run list
```

### **Environment Secrets**

Required secrets in GitHub:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `STAGING_DATABASE_URL`
- `PRODUCTION_DATABASE_URL`

## 📝 Adding New Tests

### **Unit Tests**

1. Create test files in `src/__tests__/`
2. Follow naming: `*.test.tsx` or `*.spec.tsx`
3. Import test utilities from `config/jest/jest.setup.js`

### **E2E Tests**

1. Create test files in `e2e/`
2. Follow naming: `*.spec.ts`
3. Use Playwright test utilities

### **API Tests**

1. Test endpoints in `src/app/api/`
2. Mock database connections
3. Test authentication flows

## 🔍 Debugging Tests

### **Jest Debugging**

```bash
# Verbose output
npm test -- --verbose

# Run specific test
npm test -- --testNamePattern="test name"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### **Playwright Debugging**

```bash
# Debug mode
npx playwright test --debug

# Headed mode
npx playwright test --headed

# Trace viewer
npx playwright show-trace trace.zip
```

### **Build Debugging**

```bash
# Verbose build
npm run build -- --debug

# Analyze bundle
npm run build -- --analyze
```

## 📋 Test Checklist

Before pushing to production:

- [ ] All unit tests pass
- [ ] Build completes successfully
- [ ] No critical ESLint errors
- [ ] Code is properly formatted
- [ ] No high-severity vulnerabilities
- [ ] Database schema is valid
- [ ] Health endpoint responds
- [ ] E2E tests pass
- [ ] Performance benchmarks met
- [ ] Documentation updated

---

**Next Steps**: After local validation, push to GitHub to trigger the automated CI/CD pipeline!
