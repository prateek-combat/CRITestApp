# CI/CD Pipeline Documentation

## Overview

This project uses a comprehensive CI/CD pipeline built with GitHub Actions to ensure code quality, run tests, and automate deployments. The pipeline is triggered on pushes to `main` and `dev` branches, as well as pull requests to `main`.

## Pipeline Architecture

The CI/CD pipeline consists of 9 jobs that run in parallel and sequence:

### 1. Code Quality Checks (`lint-and-format`)

- **Purpose**: Validates code quality and formatting
- **Runs on**: All triggers
- **Tasks**:
  - ESLint code linting
  - Prettier formatting checks
  - TypeScript type checking

### 2. Unit & Integration Tests (`test`)

- **Purpose**: Runs application tests with database
- **Depends on**: `lint-and-format`
- **Features**:
  - PostgreSQL test database
  - Prisma schema validation
  - Unit test execution
  - Test coverage reporting

### 3. Build & Security (`build-and-security`)

- **Purpose**: Builds application and runs security audits
- **Depends on**: `lint-and-format`
- **Tasks**:
  - NPM security audit
  - Application build verification
  - Artifact generation

### 4. Database Migration Tests (`database-migration`)

- **Purpose**: Validates database schema and migrations
- **Depends on**: `lint-and-format`
- **Features**:
  - Migration deployment testing
  - Schema validation
  - Database reset verification

### 5. End-to-End Tests (`e2e-tests`)

- **Purpose**: Full application testing
- **Depends on**: `build-and-security`, `test`
- **Runs on**: PRs and main branch only
- **Features**:
  - Playwright browser testing
  - API endpoint validation
  - User journey testing

### 6. Deploy to Staging (`deploy-staging`)

- **Purpose**: Deploys to staging environment
- **Depends on**: `build-and-security`, `test`, `database-migration`
- **Triggers**: Push to `dev` branch only

### 7. Deploy to Production (`deploy-production`)

- **Purpose**: Deploys to production environment
- **Depends on**: All previous jobs
- **Triggers**: Push to `main` branch only

### 8. Security Analysis (`security-analysis`)

- **Purpose**: Advanced security scanning
- **Depends on**: `lint-and-format`
- **Features**:
  - Vulnerability scanning
  - Bundle size analysis

### 9. Cleanup (`cleanup`)

- **Purpose**: Removes old artifacts
- **Runs**: Always after deployment jobs

## Setup Instructions

### 1. Install Dependencies

First, install the required testing dependencies:

```bash
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom
```

### 2. Environment Variables

Set up the following secrets in your GitHub repository settings:

```bash
# Required for database testing
DATABASE_URL=postgresql://testuser:testpass@localhost:5432/testdb

# Required for authentication
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Optional: Deployment secrets
VERCEL_TOKEN=your-vercel-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

### 3. Local Testing Setup

Test the pipeline locally:

```bash
# Run linting
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build application
npm run build

# Run E2E tests (requires Playwright)
npx playwright install
npx playwright test
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

- Uses Next.js Jest configuration
- Includes test coverage thresholds
- Mocks for Next.js, NextAuth, and Prisma

### Test Structure

```
src/
├── __tests__/          # Unit tests
│   └── *.test.tsx
├── components/
│   └── __tests__/      # Component tests
└── lib/
    └── __tests__/      # Utility tests

e2e/                    # End-to-end tests
└── *.spec.ts
```

## Database Testing

The pipeline uses separate PostgreSQL instances for different test types:

- **Unit Tests**: `localhost:5432/testdb`
- **Migration Tests**: `localhost:5433/migrationdb`
- **E2E Tests**: `localhost:5434/e2edb`

Each database is isolated and cleaned up after tests.

## Deployment Workflows

### Staging Deployment (Dev Branch)

1. Code pushed to `dev` branch
2. All quality checks pass
3. Automatic deployment to staging environment
4. Environment: `staging`

### Production Deployment (Main Branch)

1. Code pushed to `main` branch
2. All tests and E2E tests pass
3. Manual approval required (environment protection)
4. Deployment to production
5. Success notifications

## Customization

### Adding New Tests

**Unit Tests:**

```typescript
// src/__tests__/example.test.tsx
import { render, screen } from '@testing-library/react'
import Component from '../Component'

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

**E2E Tests:**

```typescript
// e2e/example.spec.ts
import { test, expect } from '@playwright/test';

test('should navigate correctly', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Login');
  await expect(page).toHaveURL(/login/);
});
```

### Deployment Customization

Update the deployment steps in `.github/workflows/ci-cd.yml`:

```yaml
- name: Deploy to Production
  run: |
    # Add your deployment commands
    npx vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## Monitoring and Debugging

### Viewing Pipeline Results

1. Go to GitHub repository
2. Click "Actions" tab
3. Select workflow run
4. View job details and logs

### Debugging Failed Tests

- Check the "Artifacts" section for test results
- Download coverage reports
- Review screenshot/video artifacts from E2E tests

### Common Issues

**Database Connection Failures:**

- Ensure PostgreSQL service is healthy
- Check environment variables
- Verify network connectivity

**Build Failures:**

- Check TypeScript errors
- Verify all dependencies are installed
- Review ESLint configuration

**Test Failures:**

- Check test isolation
- Verify mock configurations
- Review test data setup

## Performance Optimization

### Pipeline Speed

- Jobs run in parallel where possible
- Cached Node.js dependencies
- Optimized Docker images
- Minimal artifact retention

### Cost Optimization

- Conditional job execution
- Artifact cleanup
- Resource-appropriate runners

## Security Features

- Dependency vulnerability scanning
- Code quality enforcement
- Environment isolation
- Secret management
- Branch protection rules

## Maintenance

### Regular Tasks

- Update dependencies monthly
- Review security audit results
- Update test coverage thresholds
- Clean up old artifacts

### Monitoring

- Track pipeline success rates
- Monitor deployment frequency
- Review test execution times
- Analyze security scan results

## Support

For issues with the CI/CD pipeline:

1. Check the GitHub Actions logs
2. Review this documentation
3. Verify environment configuration
4. Test locally first
5. Open an issue with detailed logs

## 📋 Overview

This document explains how to set up and configure the complete CI/CD pipeline for the Test Platform application.

## 🔧 Prerequisites

- Node.js 18+ or 20+
- PostgreSQL database
- GitHub repository
- npm or yarn package manager

## ⚠️ React 19 Compatibility Notice

This project uses React 19, which requires special handling for some testing dependencies:

### Dependency Configuration

- **@testing-library/react**: Updated to v16.0.0 for React 19 compatibility
- **npm ci**: Uses `--legacy-peer-deps` flag in CI/CD pipeline
- **.npmrc**: Configured with `legacy-peer-deps=true` for local development

### Why This Is Needed

Some testing libraries haven't updated their peer dependencies to support React 19 yet. The `--legacy-peer-deps` flag tells npm to use the older (more permissive) dependency resolution algorithm.

## 🚀 Quick Setup

### 1. Environment Variables

Create a `.env.local` file with:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma db push
```

### 4. Test the Setup

```bash
npm test
npm run build
```

## 📦 Pipeline Components

### 1. **Code Quality & Linting**

- ESLint with Next.js rules
- Prettier code formatting
- TypeScript compilation checks

### 2. **Testing**

- Jest unit tests with React Testing Library
- Test coverage reporting
- Integration tests (optional)

### 3. **Build & Security**

- Next.js production build
- Security vulnerability scanning
- Bundle analysis

### 4. **Database**

- Prisma schema validation
- Migration testing
- Database reset tests

### 5. **End-to-End Testing**

- Playwright browser tests
- Full application flow testing

### 6. **Deployment**

- Staging deployment (dev branch)
- Production deployment (main branch)
- Artifact management

## 🔧 GitHub Actions Configuration

The pipeline is defined in `.github/workflows/ci-cd.yml` with these jobs:

1. **lint-and-format**: Code quality checks
2. **test**: Unit and integration tests
3. **build-and-security**: Application building and security
4. **database-migration**: Schema and migration testing
5. **e2e-tests**: End-to-end testing
6. **deploy-staging**: Staging environment deployment
7. **deploy-production**: Production deployment
8. **security-analysis**: Advanced security scanning
9. **cleanup**: Artifact cleanup

## ⚙️ Local Testing

### Individual Components

```bash
# Code quality
npm run lint
npx prettier --check "**/*.{js,jsx,ts,tsx,json,css,md}"

# Unit tests
npm test

# Build
npm run build

# Security
npm audit --audit-level moderate
```

### Full Pipeline Simulation

```bash
./scripts/test-pipeline-locally.sh
```

### E2E Testing

```bash
./scripts/test-e2e-full.sh
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Dependency Conflicts (React 19)

**Problem**: `npm ci` fails with peer dependency conflicts
**Solution**:

- Use `--legacy-peer-deps` flag
- Check `.npmrc` file exists with `legacy-peer-deps=true`
- Ensure React Testing Library is v16.0.0+

#### 2. TypeScript Errors

**Problem**: Missing module errors in CI
**Solution**:

- Add `--skipLibCheck` to TypeScript compilation
- Install missing type definitions
- Use module path mapping in `tsconfig.json`

#### 3. Test Failures

**Problem**: Tests pass locally but fail in CI
**Solution**:

- Check environment variables
- Verify database connection
- Review test timeouts and async handling

#### 4. Build Failures

**Problem**: Next.js build fails in production
**Solution**:

- Check environment variable configuration
- Verify all imports are correct
- Review build logs for specific errors

## 🔒 Security Configuration

### GitHub Secrets Required

```
NEXTAUTH_SECRET=your-production-secret
DATABASE_URL=your-production-database-url
VERCEL_TOKEN=your-deployment-token (if using Vercel)
```

### Security Scanning

- npm audit for dependency vulnerabilities
- Snyk scanning (optional)
- Bundle size analysis

## 📊 Performance Monitoring

The pipeline includes performance checks:

- Bundle size analysis
- Build time monitoring
- Test execution time
- Database query performance

## 🚀 Deployment Strategies

### Staging (dev branch)

- Automatic deployment on push
- Runs full test suite
- Safe environment for testing

### Production (main branch)

- Requires all tests to pass
- Manual deployment approval
- Comprehensive security checks

## 📚 Additional Resources

- [Jest Testing Documentation](https://jestjs.io/docs/getting-started)
- [Playwright E2E Testing](https://playwright.dev/docs/intro)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Database Management](https://www.prisma.io/docs)

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Run `./scripts/test-pipeline-locally.sh` for local debugging
4. Check dependency versions in `package.json`

---

**Note**: This pipeline is production-ready and follows industry best practices for React 19 applications. The dependency management is configured to handle the React 19 ecosystem while maintaining stability.
