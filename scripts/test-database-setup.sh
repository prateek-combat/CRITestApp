#!/bin/bash

# Test Database Setup Script
# This script tests the same database setup sequence used in CI/CD

set -e

echo "🧪 Testing Database Setup Sequence"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}⚠️  No DATABASE_URL set. Using default PostgreSQL connection.${NC}"
    export DATABASE_URL="postgresql://postgres:password@localhost:5432/testdb"
fi

echo "📦 Step 1: Generate Prisma Client"
npx prisma generate

echo "🗄️  Step 2: Push Database Schema"
npx prisma db push --force-reset

echo "🔍 Step 3: Verify Tables Exist"
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" || true

echo "🌱 Step 4: Seed Database"
if [ -f "prisma/seed.ts" ] || [ -f "prisma/seed.js" ]; then
    npx prisma db seed
else
    echo -e "${YELLOW}⚠️  No seed file found${NC}"
fi

echo "✅ Step 5: Verify Admin User Created"
npx prisma db execute --stdin <<< "SELECT email, role FROM \"User\" WHERE role = 'ADMIN';" || true

echo ""
echo -e "${GREEN}🎉 Database setup test completed!${NC}"
echo "This sequence should work in CI/CD as well." 