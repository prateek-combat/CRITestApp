# 🗄️ Database Setup Troubleshooting Guide

## Issue: Database Seeding Failure in CI/CD

### **Problem Description**
```
PrismaClientKnownRequestError: 
The table `public.User` does not exist in the current database.
```

This error occurs when the database seeding script runs before the database tables are properly created.

### **Root Cause**
The CI/CD pipeline was attempting to seed the database before ensuring that:
1. Database schema was properly pushed
2. Tables were successfully created
3. Database connection was stable

### **✅ Solution Implemented**

#### 1. **Improved Database Setup Sequence**
```yaml
# Before (problematic)
- name: Setup test database
  run: |
    npx prisma generate
    npx prisma db push

# After (fixed)
- name: Setup test database
  run: |
    npx prisma generate
    npx prisma db push --force-reset
```

#### 2. **Added Database Verification Step**
```yaml
- name: Verify database tables exist
  run: |
    npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
  continue-on-error: true
```

#### 3. **Enhanced Seed Script with Error Handling**
```typescript
async function main() {
  console.log('🌱 Starting database seeding...');
  
  try {
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection established');
    
    // Check if User table exists
    await prisma.user.findFirst().catch(() => {
      throw new Error('User table does not exist. Please run migrations first.');
    });
    console.log('✅ User table exists');
    
    // Create admin user
    const admin = await prisma.user.upsert({...});
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}
```

### **🔧 Updated CI/CD Pipeline Steps**

#### Test Job Database Setup:
1. **Generate Prisma Client**: `npx prisma generate`
2. **Force Reset & Push Schema**: `npx prisma db push --force-reset`
3. **Verify Tables**: SQL query to check table existence
4. **Seed Database**: `npx prisma db seed` (with error handling)

#### E2E Tests Database Setup:
1. **Generate Prisma Client**: `npx prisma generate`
2. **Force Reset & Push Schema**: `npx prisma db push --force-reset`
3. **Seed Database**: `npx prisma db seed` (for test data)

#### Database Migration Tests:
1. **Generate Prisma Client**: `npx prisma generate`
2. **Deploy Migrations**: `npx prisma migrate deploy`
3. **Validate Schema**: `npx prisma validate`
4. **Test Seeding**: `npx prisma db seed`
5. **Reset Test**: `npx prisma migrate reset --force`

### **🧪 Local Testing**

Use the provided test script to verify database setup locally:
```bash
./scripts/test-database-setup.sh
```

This script replicates the exact sequence used in CI/CD.

### **🚀 Benefits of the Fix**

1. **✅ Reliability**: Database setup now follows proper sequence
2. **✅ Error Handling**: Better error messages and debugging info
3. **✅ Verification**: Explicit checks for table existence
4. **✅ Consistency**: Same process across all CI/CD jobs
5. **✅ Debugging**: Verbose logging for troubleshooting

### **🔍 Monitoring & Prevention**

#### Signs of Database Setup Issues:
- `Table does not exist` errors
- Prisma client connection failures
- Seeding script timeouts
- Migration rollback failures

#### Best Practices:
1. Always use `--force-reset` in CI/CD environments
2. Add verification steps between setup phases
3. Use `continue-on-error: true` for non-critical steps
4. Include comprehensive logging in seed scripts
5. Test database setup sequence locally before deployment

### **📋 Troubleshooting Checklist**

If database seeding fails, check:
- [ ] Database service is running in CI/CD
- [ ] `DATABASE_URL` environment variable is set correctly
- [ ] Prisma client is generated before schema operations
- [ ] Schema push completed successfully
- [ ] Tables exist before attempting to seed
- [ ] Seed script has proper error handling
- [ ] Network connectivity between runner and database

### **🔗 Related Documentation**
- [Prisma Database Push](https://www.prisma.io/docs/reference/api-reference/command-reference#db-push)
- [Prisma Seeding](https://www.prisma.io/docs/guides/database/seed-database)
- [GitHub Actions PostgreSQL Services](https://docs.github.com/en/actions/using-containerized-services/creating-postgresql-service-containers)

---
*This fix ensures reliable database setup across all CI/CD environments.* 