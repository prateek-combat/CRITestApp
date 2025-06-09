#!/bin/bash

# Robust Neon Database Reset Script
# Handles enum conflicts and ensures complete clean state

echo "🗄️ Neon Database Reset Procedure"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ".env.local" ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Using Neon DATABASE_URL from .env.local${NC}"
else
    echo -e "${RED}❌ .env.local not found. Please ensure Neon DATABASE_URL is configured.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete ALL data in your Neon database!${NC}"
echo -e "${YELLOW}⚠️  Make sure you have backups if needed.${NC}"
echo ""
read -p "Are you sure you want to proceed? (y/N): " confirm

if [[ $confirm != [yY] && $confirm != [yY][eE][sS] ]]; then
    echo "Reset cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🔧 Step 1: Clean up Prisma processes and cache${NC}"
echo "----------------------------------------------"

# Kill any background Prisma processes
pkill -f prisma 2>/dev/null && echo "Stopped Prisma processes" || echo "No Prisma processes to stop"

# Clear Prisma client cache
rm -rf node_modules/.prisma 2>/dev/null && echo "Cleared Prisma cache" || echo "No cache to clear"

echo ""
echo -e "${BLUE}🔧 Step 2: Force complete database reset${NC}"
echo "----------------------------------------"

echo "Resetting database with force flags..."
if npx prisma db push --force-reset --accept-data-loss --skip-generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database reset successful${NC}"
else
    echo -e "${RED}❌ Database reset failed${NC}"
    echo "Trying alternative reset method..."
    
    # Alternative reset - try multiple times if needed
    for i in {1..3}; do
        echo "Attempt $i/3..."
        if npx prisma db push --force-reset --accept-data-loss > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Database reset successful on attempt $i${NC}"
            break
        else
            if [ $i -eq 3 ]; then
                echo -e "${RED}❌ Database reset failed after 3 attempts${NC}"
                exit 1
            fi
            sleep 2
        fi
    done
fi

echo ""
echo -e "${BLUE}🔧 Step 3: Generate fresh Prisma client${NC}"
echo "----------------------------------------"

if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Prisma client generated successfully${NC}"
else
    echo -e "${RED}❌ Prisma client generation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 4: Validate database schema${NC}"
echo "-----------------------------------"

if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema validation successful${NC}"
else
    echo -e "${RED}❌ Schema validation failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 5: Seed database${NC}"
echo "-------------------------"

if npx prisma db seed > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database seeding successful${NC}"
else
    echo -e "${RED}❌ Database seeding failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔧 Step 6: Final verification${NC}"
echo "-------------------------------"

# Test basic operations
echo "Testing database connection..."
if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection working${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi

echo "Testing application build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Application build successful${NC}"
else
    echo -e "${YELLOW}⚠️  Application build had issues (check manually)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Database Reset Complete!${NC}"
echo ""
echo "Your Neon database has been:"
echo "  ✅ Completely reset and cleaned"
echo "  ✅ Schema synchronized"
echo "  ✅ Seeded with initial data"
echo "  ✅ Verified and ready for use"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  • Run: npm test (to verify unit tests)"
echo "  • Run: npm run dev (to start development)"
echo "  • Run: npx prisma studio (to view database)"
echo ""
echo -e "${YELLOW}Remember: Use 'npx prisma db push' for schema changes, not migrate commands!${NC}" 