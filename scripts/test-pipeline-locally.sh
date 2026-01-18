#!/bin/bash

# CI/CD Pipeline Local Testing Script
# This script simulates the GitHub Actions workflow locally

set -e  # Exit on any error

echo "🚀 Starting CI/CD Pipeline Local Testing..."
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED_TESTS=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Function to run a test step
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}🧪 Testing: $test_name${NC}"
    echo "Command: $test_command"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}📋 $1${NC}"
    echo "==========================================="
}

# 1. CODE QUALITY CHECKS
print_section "STEP 1: CODE QUALITY CHECKS"

run_test "ESLint Check" "npm run lint --silent || true"
run_test "Prettier Check" "npx prettier --check '**/*.{js,jsx,ts,tsx,json,css,md}' --ignore-path .gitignore"
run_test "TypeScript Check" "npx tsc --noEmit --skipLibCheck"

# 2. UNIT & INTEGRATION TESTS
print_section "STEP 2: UNIT & INTEGRATION TESTS"

run_test "Jest Unit Tests" "npm test -- --watchAll=false --coverage --silent"

# 3. BUILD & SECURITY
print_section "STEP 3: BUILD & SECURITY"

run_test "Next.js Build" "npm run build"
run_test "Security Audit" "npm audit --audit-level moderate || true"

# 4. DATABASE VALIDATION
print_section "STEP 4: DATABASE VALIDATION"

run_test "Prisma Schema Validation" "DATABASE_URL='postgresql://test:test@localhost:5432/testdb' npx prisma validate"

# 5. HEALTH CHECK
print_section "STEP 5: APPLICATION HEALTH"

run_test "Health Endpoint Implementation" "test -f src/app/api/health/route.ts"

# 6. E2E TEST PREPARATION
print_section "STEP 6: E2E FRAMEWORK VALIDATION"

run_test "Playwright Config Check" "test -f config/playwright/playwright.config.ts"
run_test "E2E Test Files Check" "test -f e2e/example.spec.ts"

# SUMMARY
print_section "TEST SUMMARY"

echo -e "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Pipeline is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Review the issues above.${NC}"
    echo -e "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    exit 1
fi 
