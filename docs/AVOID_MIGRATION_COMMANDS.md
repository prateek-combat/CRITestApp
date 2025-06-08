# ⚠️ IMPORTANT: Avoid Migration Commands with Neon

## 🚨 **Critical Warning**

**DO NOT use migration commands with this Neon setup!** They will cause database inconsistencies and errors.

## ❌ **Commands That Will Break Your Database**

```bash
# ❌ NEVER use these commands:
npx prisma migrate deploy
npx prisma migrate dev
npx prisma migrate reset
npx prisma migrate resolve
npx prisma migrate diff
```

## 🔍 **Why Migration Commands Fail**

### **Root Cause**

This project uses **Push Workflow** with Neon, not **Migration Workflow**:

- ❌ **No migration files exist** in `prisma/migrations/`
- ❌ **Database baseline conflicts** with existing schema
- ❌ **Enum type conflicts** when partially applied
- ❌ **Inconsistent state** if migration fails halfway

### **Error Examples**

**Error 1: No Migration Files**

```
No migration found in prisma/migrations
Error: P3005
The database schema is not empty.
```

**Error 2: Type Already Exists**

```
ERROR: type "TestAttemptStatus" already exists
```

**Error 3: Baseline Required**

```
Read more about how to baseline an existing production database
```

## ✅ **Correct Commands for Neon**

### **Daily Development**

```bash
# ✅ Sync schema changes
npx prisma db push

# ✅ Generate client
npx prisma generate

# ✅ Seed database
npx prisma db seed

# ✅ View database
npx prisma studio
```

### **Database Issues/Reset**

```bash
# ✅ Clean reset (⚠️ Deletes all data!)
npx prisma db push --force-reset --accept-data-loss

# ✅ Reset and seed
npx prisma db push --force-reset --accept-data-loss && npx prisma db seed
```

### **Troubleshooting**

```bash
# ✅ Validate schema
npx prisma validate

# ✅ Check connection
npx prisma db execute --stdin <<< "SELECT 1;"

# ✅ Test complete setup
./scripts/test-with-neon.sh
```

## 🛠️ **If You Already Ran Migration Commands**

If you accidentally used migration commands and got errors:

### **Quick Fix (Simple Cases)**

```bash
# Step 1: Clean reset
npx prisma db push --force-reset --accept-data-loss

# Step 2: Reseed
npx prisma db seed

# Step 3: Verify
npm run build && npm test
```

### **Robust Fix (Persistent Issues)**

If you're getting enum conflicts like "type 'UserRole' already exists":

```bash
# Use the comprehensive reset script
./scripts/neon-database-reset.sh
```

This script handles:

- ✅ Prisma process cleanup
- ✅ Cache clearing
- ✅ Multiple reset attempts
- ✅ Complete verification
- ✅ Proper error handling

## 📋 **Quick Reference**

| ❌ Migration Workflow   | ✅ Push Workflow (Neon)        |
| ----------------------- | ------------------------------ |
| `prisma migrate deploy` | `prisma db push`               |
| `prisma migrate dev`    | `prisma db push`               |
| `prisma migrate reset`  | `prisma db push --force-reset` |
| Creates migration files | No migration files             |
| Version controlled      | Direct schema sync             |
| Complex setup           | Simple and fast                |

## 🎯 **Why Push Workflow for Neon?**

### **Benefits**

- ✅ **Faster development**: Instant schema sync
- ✅ **No file management**: No migration files to track
- ✅ **Cloud native**: Perfect for serverless databases
- ✅ **Less complexity**: Fewer commands to remember
- ✅ **Rapid prototyping**: Quick schema iteration

### **Trade-offs**

- ⚠️ **No version history**: Changes aren't versioned
- ⚠️ **Production caution**: Best for dev/staging environments
- ⚠️ **Data loss risk**: Reset commands delete all data

## 📚 **Related Documentation**

- **Command Reference**: `docs/NEON_COMMAND_REFERENCE.md`
- **Setup Guide**: `docs/NEON_SETUP_GUIDE.md`
- **Seeding Fix**: `docs/DATABASE_SEEDING_FIX.md`
- **Quick Reference**: `docs/QUICK_TEST_REFERENCE.md`

## 🎯 **Remember**

> **When in doubt, use `npx prisma db push` not migration commands!**

Your Neon database setup is designed for simplicity and speed. Stick to the push workflow and avoid migration commands to prevent issues.

---

**🚀 Keep it simple: Push, don't migrate with Neon!**
