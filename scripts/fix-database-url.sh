#!/bin/bash

echo "🔧 Fixing database URL to use the working database..."

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Update .env file to use the working database URL
sed -i 's|^DATABASE_URL="postgresql://neondb_owner:npg_dK2E6bjGJChZ@ep-divine-frost-a1rbd64l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|#DATABASE_URL="postgresql://neondb_owner:npg_dK2E6bjGJChZ@ep-divine-frost-a1rbd64l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|' .env

sed -i 's|^#DATABASE_URL="postgresql://neondb_owner:npg_ZqIyVPEBj0f3@ep-floral-sound-a1q15wrs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|DATABASE_URL="postgresql://neondb_owner:npg_ZqIyVPEBj0f3@ep-floral-sound-a1q15wrs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|' .env

# Also update .env.local
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

sed -i 's|^DATABASE_URL="postgresql://neondb_owner:npg_dK2E6bjGJChZ@ep-divine-frost-a1rbd64l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|#DATABASE_URL="postgresql://neondb_owner:npg_dK2E6bjGJChZ@ep-divine-frost-a1rbd64l-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|' .env.local

sed -i 's|^#DATABASE_URL="postgresql://neondb_owner:npg_ZqIyVPEBj0f3@ep-floral-sound-a1q15wrs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|DATABASE_URL="postgresql://neondb_owner:npg_ZqIyVPEBj0f3@ep-floral-sound-a1q15wrs-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"|' .env.local

echo "✅ Database URL updated to use the working database with your test data!"
echo "🔄 Please restart your development server: npm run dev" 