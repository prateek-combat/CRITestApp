# Archive and Delete System Documentation

## Overview

The application now implements a comprehensive archive and delete system with role-based access control to protect valuable test data while allowing safe cleanup operations.

## 🛡️ Role-Based Access Control

### Regular ADMIN Users
- **CAN**: View active tests, edit tests, add questions
- **CANNOT**: Archive or delete tests
- **UI**: Delete buttons are hidden, shows "Super Admin only" message

### SUPER_ADMIN Users
- **CAN**: All ADMIN permissions plus:
  - Archive tests (soft delete with recovery)
  - Permanently delete tests (hard delete)
  - View and manage archived tests
  - Restore archived tests
- **UI**: Full access to all archive and delete functions

## 📦 Archive System

### What is Archiving?
- **Soft deletion** that hides tests from main lists
- Data remains intact and recoverable
- 30-day retention period before permanent deletion
- Tracks who archived the test and when

### Archive Process
1. SUPER_ADMIN clicks "Archive" button
2. Test is marked as `isArchived: true`
3. `archivedAt` timestamp is set
4. `archivedById` records who performed the action
5. Test disappears from main test listings
6. Test appears in "Archived Tests" page

### Database Changes
```sql
-- New fields added to Test table
isArchived      Boolean   @default(false)
archivedAt      DateTime?
archivedById    String?
archivedBy      User?     @relation("ArchivedTests", fields: [archivedById], references: [id])
```

## 🗑️ Permanent Deletion

### When to Use
- **Only when data is truly no longer needed**
- **After archiving period expires**
- **For compliance or storage cleanup**

### Safety Measures
- **Double confirmation dialogs**
- **Detailed warning messages**
- **Shows what will be deleted** (questions, invitations, attempts)
- **SUPER_ADMIN only access**

### What Gets Deleted
When a test is permanently deleted:
- ✅ Test record
- ✅ All questions
- ✅ All invitations
- ✅ All test attempts and results
- ✅ All proctoring data
- ✅ All public test links

## 🕐 30-Day Retention Policy

### Automatic Cleanup
- Archived tests are automatically deleted after 30 days
- Cleanup script: `scripts/cleanup-archived-tests.js`
- Should be run daily via cron job

### Manual Cleanup
```bash
# Dry run to see what would be deleted
node scripts/cleanup-archived-tests.js --dry-run

# Delete archived tests older than 30 days
node scripts/cleanup-archived-tests.js

# Custom retention period (60 days)
node scripts/cleanup-archived-tests.js --days=60

# Test with shorter period (7 days)
node scripts/cleanup-archived-tests.js --dry-run --days=7
```

## 📱 User Interface

### Main Tests Page (`/admin/tests`)
**For ADMIN users:**
- No delete buttons visible
- "Super Admin only" message where delete buttons would be

**For SUPER_ADMIN users:**
- "Archive" button (yellow) - Safe option
- "Delete Forever" button (red) - Permanent action
- "View Archived Tests" link in header
- Role indicator in page header

### Individual Test Page (`/admin/tests/[id]`)
**For ADMIN users:**
- Archive/Delete buttons hidden
- "Archive/Delete: Super Admin only" message

**For SUPER_ADMIN users:**
- "Archive Test" button
- "Delete Forever" button
- Enhanced warning dialogs

### Archived Tests Page (`/admin/tests/archived`)
**Access:** SUPER_ADMIN only

**Features:**
- List of all archived tests
- Days remaining until permanent deletion
- Visual warnings for tests expiring soon (≤7 days)
- "Restore" button to unarchive
- "Delete Forever" for immediate permanent deletion
- Shows archive metadata (when, by whom)

## 🔄 API Endpoints

### Archive Operations
```typescript
POST /api/tests/{id}/archive     // Archive a test (SUPER_ADMIN only)
POST /api/tests/{id}/restore     // Restore archived test (SUPER_ADMIN only)
GET  /api/tests/archived         // List archived tests (SUPER_ADMIN only)
```

### Enhanced Delete
```typescript
DELETE /api/tests/{id}           // Permanent delete (SUPER_ADMIN only)
```

### Modified Existing
```typescript
GET /api/tests                   // Now excludes archived tests
```

## 🚨 Warning System

### UI Warnings
- **Archive Action**: "This will hide the test but it can be restored"
- **Permanent Delete**: Multi-step confirmation with detailed warnings
- **Near Expiration**: Red highlighting for tests expiring in ≤7 days

### Confirmation Flows
1. **Archive**: Single confirmation
2. **Permanent Delete**: 
   - First warning with full impact description
   - Second "FINAL CONFIRMATION" dialog
   - Shows counts of data that will be deleted

## 📊 Monitoring and Logging

### Archive Tracking
- Who archived each test
- When it was archived
- Automatic expiration calculations
- Visual countdown in admin interface

### Cleanup Logging
```bash
🗑️  Archive Cleanup Script Started
📅 Retention period: 30 days
🔍 Mode: LIVE MODE
📆 Cutoff date: 2024-11-09T10:30:00.000Z
🔍 Found 2 archived test(s) ready for cleanup:
✅ Cleanup completed successfully!
```

## 🔧 Setup and Configuration

### Database Migration
```bash
# Apply the archive schema changes
npx prisma db push

# Generate updated Prisma client
npx prisma generate
```

### Cron Job Setup
```bash
# Edit crontab
crontab -e

# Add daily cleanup at 2 AM
0 2 * * * cd /path/to/app && node scripts/cleanup-archived-tests.js >> /var/log/test-cleanup.log 2>&1
```

## 🛠️ Development Notes

### Testing the System
```bash
# Test archive functionality
curl -X POST /api/tests/{test-id}/archive

# Test restore functionality  
curl -X POST /api/tests/{test-id}/restore

# View archived tests
curl /api/tests/archived

# Test cleanup script
node scripts/cleanup-archived-tests.js --dry-run --days=1
```

### Environment Requirements
- Database with updated schema
- SUPER_ADMIN user role
- Proper authentication setup

## 🚀 Best Practices

### For SUPER_ADMIN Users
1. **Use Archive First**: Always try archiving before permanent deletion
2. **Monitor Archived Tests**: Regularly check expiring tests
3. **Educate Team**: Ensure team understands the 30-day policy
4. **Document Decisions**: Keep track of why tests were archived/deleted

### For Regular ADMIN Users
1. **Request Archive**: Ask SUPER_ADMIN to archive unneeded tests
2. **Don't Panic**: Archived tests can be restored
3. **Plan Ahead**: Know about the 30-day retention policy

### System Administration
1. **Monitor Cleanup**: Check cleanup script logs regularly
2. **Backup Strategy**: Consider database backups before cleanup runs
3. **Storage Planning**: Factor in 30-day retention in storage estimates
4. **Access Control**: Regularly audit SUPER_ADMIN access

## 🔍 Troubleshooting

### Common Issues
1. **Archive buttons not showing**: Check user role is SUPER_ADMIN
2. **TypeScript errors**: Regenerate Prisma client after schema changes
3. **Cleanup script fails**: Verify DATABASE_URL environment variable
4. **Tests still showing**: Clear browser cache, check isArchived filter

### Error Messages
- `"Insufficient permissions - SUPER_ADMIN required"`: User needs role upgrade
- `"Test is already archived"`: Cannot archive an already archived test
- `"Test is not archived"`: Cannot restore a non-archived test

## 📈 Future Enhancements

### Potential Improvements
- Email notifications before permanent deletion
- Bulk archive/restore operations
- Archive categories or tags
- Extended retention periods for important tests
- Archive export functionality
- Audit trail for all archive/delete operations

### Integration Opportunities
- Backup system integration
- Compliance reporting
- Data retention policy automation
- External storage for archived data 