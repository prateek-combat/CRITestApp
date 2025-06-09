# 🗄️ Neon Database Command Reference

## 🚫 **DON'T Use Migration Commands**

❌ **These commands will fail with Neon setup:**

```bash
npx prisma migrate deploy    # ❌ No migration files exist
npx prisma migrate dev       # ❌ Wrong workflow for Neon
npx prisma migrate reset     # ❌ Use db push --force-reset instead
```

**Error you'll see:**

```
No migration found in prisma/migrations
Error: P3005
The database schema is not empty.
```

## ✅ **DO Use Push Commands**

✅ **Correct commands for Neon:**

### **Daily Development**

```bash
# Sync schema changes to Neon
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed database with data
npx prisma db seed

# View database in browser
npx prisma studio
```

### **Database Management**

```bash
# Reset database (⚠️ Deletes all data!)
npx prisma db push --force-reset --accept-data-loss

# Reset and seed in one go
npx prisma db push --force-reset --accept-data-loss && npx prisma db seed

# Check if schema is in sync
npx prisma db push --preview-feature  # Shows what would change
```

### **Troubleshooting**

```bash
# Validate schema
npx prisma validate

# Check database connection
npx prisma db execute --stdin <<< "SELECT 1;"

# View current schema
npx prisma db pull  # Pulls schema from database
```

## 🎯 **Workflow Comparison**

| Migration Workflow      | Push Workflow (Neon)    |
| ----------------------- | ----------------------- |
| `prisma migrate dev`    | `prisma db push`        |
| Creates migration files | No migration files      |
| Version controlled      | Direct schema sync      |
| Production databases    | Development/prototyping |
| Complex changes         | Rapid iteration         |

## 🧪 **Testing Commands**

```bash
# Test complete Neon setup
./scripts/test-with-neon.sh

# Test CI/CD sequence locally
./scripts/test-ci-database-sequence.sh

# Quick validation
./scripts/validate-pipeline.sh
```

## 🚀 **Common Scenarios**

### **Starting Fresh**

```bash
# 1. Sync schema
npx prisma db push

# 2. Seed data
npx prisma db seed

# 3. Start developing
npm run dev
```

### **Schema Changes**

```bash
# 1. Edit prisma/schema.prisma
# 2. Sync changes
npx prisma db push

# 3. Regenerate client
npx prisma generate

# 4. Update seed data if needed
npx prisma db seed
```

### **Clean Slate**

```bash
# ⚠️ WARNING: Deletes all data!
npx prisma db push --force-reset --accept-data-loss
npx prisma db seed
```

## 🔒 **Environment Setup**

### **Local Development**

```bash
# Uses .env.local
DATABASE_URL="postgresql://neondb_owner:...@ep-floral-sound-...neon.tech/neondb?sslmode=require"
```

### **CI/CD Pipeline**

```yaml
# Uses GitHub secret
env:
  DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
```

## 📚 **Related Documentation**

- **Setup Guide**: `docs/NEON_SETUP_GUIDE.md`
- **Seeding Fix**: `docs/DATABASE_SEEDING_FIX.md`
- **Quick Reference**: `docs/QUICK_TEST_REFERENCE.md`

---

**Remember: Use `db push`, not `migrate` commands with Neon! 🚀**
