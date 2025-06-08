#!/bin/bash

# 🧪 Local CI/CD Test Runner
# Run all GitHub Actions tests locally before pushing
# This mirrors the exact same tests that run in CI/CD

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}${BOLD}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo -e "${BOLD}🚀 Running all CI/CD tests locally...${NC}\n"

# ==================================================
# Phase 1: Static JS/TS Checks
# ==================================================
print_step "Phase 1: Static JS/TS Checks"

echo "Running ESLint..."
if npm run lint; then
    print_success "ESLint passed"
else
    print_error "ESLint failed"
    exit 1
fi

echo -e "\nRunning TypeScript build..."
if npm run build; then
    print_success "TypeScript build passed"
else
    print_error "TypeScript build failed"
    exit 1
fi

# ==================================================
# Phase 2: JS/TS Unit Tests
# ==================================================
print_step "Phase 2: JS/TS Unit Tests"

echo "Running Jest tests with coverage..."
if npm run test:ci; then
    print_success "Jest tests passed"
else
    print_error "Jest tests failed"
    exit 1
fi

# ==================================================
# Phase 3: Python Worker Tests
# ==================================================
print_step "Phase 3: Python Worker Tests"

echo "Installing Python dependencies and running pytest..."
cd workers/proctor

if python3 -m pip install -r requirements-dev.txt -q; then
    print_success "Python dependencies installed"
else
    print_error "Failed to install Python dependencies"
    exit 1
fi

if python3 -m pytest -q; then
    print_success "Python tests passed"
else
    print_error "Python tests failed"
    exit 1
fi

cd ../..

# ==================================================
# Phase 5: Integration Tests
# ==================================================
print_step "Phase 5: Integration Tests"

echo "Running integration tests..."
if npm run test:ci -- src/__tests__/integration/; then
    print_success "Integration tests passed"
else
    print_error "Integration tests failed"
    exit 1
fi

# ==================================================
# Phase 4: Docker Builds
# ==================================================
print_step "Phase 4: Docker Builds"

echo "Building main app Docker image..."
if docker build -t main-app:test . -q > /dev/null; then
    print_success "Main app Docker build passed"
else
    print_error "Main app Docker build failed"
    exit 1
fi

echo "Building worker Docker image..."
if docker build -t worker:test workers/proctor/ -q > /dev/null; then
    print_success "Worker Docker build passed"
else
    print_error "Worker Docker build failed"
    exit 1
fi

# ==================================================
# All Tests Complete
# ==================================================
echo ""
echo -e "${GREEN}${BOLD}🎉 All tests passed! Ready to push to GitHub 🚀${NC}"
echo ""
echo "✅ Phase 1: Static JS/TS checks"
echo "✅ Phase 2: JS/TS unit tests"  
echo "✅ Phase 3: Python worker tests"
echo "✅ Phase 4: Docker builds"
echo "✅ Phase 5: Integration tests"
echo ""
echo -e "${BLUE}You can now safely run: ${BOLD}git push${NC}" 