#!/bin/bash

# 🏃‍♂️ Quick Local Test Runner
# Run essential tests quickly (skips Docker builds)
# Use this for rapid feedback during development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}${BOLD}=== $1 ===${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BOLD}🏃‍♂️ Running quick tests (skipping Docker builds)...${NC}\n"

# Phase 1: Static checks
print_step "Phase 1: Static JS/TS Checks"
npm run lint && npm run build
print_success "Phase 1 passed"

# Phase 2: Unit tests  
print_step "Phase 2: JS/TS Unit Tests"
npm run test:ci
print_success "Phase 2 passed"

# Phase 3: Python tests
print_step "Phase 3: Python Worker Tests"
cd workers/proctor
python3 -m pip install -r requirements-dev.txt -q
python3 -m pytest -q
cd ../..
print_success "Phase 3 passed"

# Phase 5: Integration tests
print_step "Phase 5: Integration Tests"
npm run test:ci -- src/__tests__/integration/
print_success "Phase 5 passed"

echo ""
echo -e "${GREEN}${BOLD}🎉 Quick tests passed!${NC}"
echo -e "${BLUE}Run ${BOLD}./scripts/test-all-local.sh${NC}${BLUE} for full Docker builds${NC}" 