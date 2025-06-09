#!/bin/bash

# Full E2E Testing Script
# Starts dev server and runs Playwright tests

set -e

echo "🎭 Starting Full E2E Testing..."
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if port 3000 is already in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠️  Port 3000 is already in use. Using existing server.${NC}"
    SERVER_RUNNING=true
else
    echo -e "${BLUE}🚀 Starting development server...${NC}"
    SERVER_RUNNING=false
    
    # Start dev server in background
    npm run dev &
    DEV_PID=$!
    
    # Wait for server to start
    echo "Waiting for server to start..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is running!${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
            if [ "$SERVER_RUNNING" = false ]; then
                kill $DEV_PID 2>/dev/null || true
            fi
            exit 1
        fi
        sleep 1
    done
fi

# Test health endpoint
echo -e "\n${BLUE}🏥 Testing Health Endpoint...${NC}"
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/health)
echo "Health Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
else
    echo -e "${RED}❌ Health endpoint failed${NC}"
fi

# Run Playwright tests
echo -e "\n${BLUE}🎭 Running Playwright E2E Tests...${NC}"

# Install browsers if needed
npx playwright install chromium --with-deps

# Run tests
if npx playwright test --reporter=list; then
    echo -e "\n${GREEN}✅ E2E Tests Completed Successfully!${NC}"
    E2E_SUCCESS=true
else
    echo -e "\n${RED}❌ Some E2E Tests Failed${NC}"
    E2E_SUCCESS=false
fi

# Generate test report
echo -e "\n${BLUE}📊 Generating Test Report...${NC}"
npx playwright show-report --host 0.0.0.0 --port 9323 &
REPORT_PID=$!

echo -e "${YELLOW}📋 Test report available at: http://localhost:9323${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the report server${NC}"

# Cleanup function
cleanup() {
    echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
    
    # Kill report server
    kill $REPORT_PID 2>/dev/null || true
    
    # Kill dev server if we started it
    if [ "$SERVER_RUNNING" = false ]; then
        kill $DEV_PID 2>/dev/null || true
        echo -e "${BLUE}📴 Development server stopped${NC}"
    fi
    
    if [ "$E2E_SUCCESS" = true ]; then
        echo -e "${GREEN}🎉 All E2E tests completed successfully!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some E2E tests failed. Check the report above.${NC}"
        exit 1
    fi
}

# Set up cleanup on script exit
trap cleanup EXIT

# Wait for user input to keep report server running
read -p "Press Enter to stop and cleanup..." 