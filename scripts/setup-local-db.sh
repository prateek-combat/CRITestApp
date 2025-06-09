#!/bin/bash

# Local Database Setup Script
echo "🗄️  Setting up local database for testing..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Using Docker for PostgreSQL..."
    
    # Stop any existing container
    docker stop critestapp-postgres 2>/dev/null || true
    docker rm critestapp-postgres 2>/dev/null || true
    
    # Start PostgreSQL container
    docker run -d \
        --name critestapp-postgres \
        -e POSTGRES_USER=postgres \
        -e POSTGRES_PASSWORD=test123 \
        -e POSTGRES_DB=critestapp_dev \
        -p 5432:5432 \
        postgres:15
    
    echo "⏳ Waiting for database to be ready..."
    sleep 5
    
    # Set environment variable
    export DATABASE_URL="postgresql://postgres:test123@localhost:5432/critestapp_dev"
    echo "DATABASE_URL=$DATABASE_URL" > .env.local
    
    echo "✅ Database container started!"
    echo "📝 Connection details saved to .env.local"
    
elif command -v psql &> /dev/null; then
    echo "🐘 Using local PostgreSQL installation..."
    
    # Create database if it doesn't exist
    createdb critestapp_dev 2>/dev/null || echo "Database may already exist"
    
    # Set environment variable (assumes default postgres setup)
    export DATABASE_URL="postgresql://postgres@localhost:5432/critestapp_dev"
    echo "DATABASE_URL=$DATABASE_URL" > .env.local
    
    echo "✅ Local PostgreSQL database ready!"
    echo "📝 Connection details saved to .env.local"
    
else
    echo "❌ Neither Docker nor PostgreSQL found!"
    echo ""
    echo "Please install one of the following:"
    echo "  • Docker: https://docs.docker.com/get-docker/"
    echo "  • PostgreSQL: https://www.postgresql.org/download/"
    echo ""
    echo "🔄 Alternative: Use the CI/CD pipeline for testing"
    exit 1
fi

echo ""
echo "🚀 Next steps:"
echo "1. Source the environment: source .env.local"
echo "2. Set up schema: npx prisma db push"
echo "3. Seed database: npx prisma db seed"
echo "4. Run tests: npm test"
echo ""
echo "Or run the full setup: ./scripts/setup-and-test-local.sh" 