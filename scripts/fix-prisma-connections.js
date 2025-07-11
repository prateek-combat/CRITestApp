#!/usr/bin/env node

/**
 * Script to fix Prisma connection pool exhaustion by replacing individual
 * PrismaClient instances with the singleton pattern across all API routes
 */

const fs = require('fs');
const path = require('path');

// List of all files that need fixing (from our search results)
const filesToFix = [
  'src/app/api/invitations/send-reminders/route.ts',
  'src/app/api/tests/route.ts',
  'src/app/api/test-results/[attemptId]/route.ts',
  'src/app/api/invitations/route.ts',
  'src/app/api/tests/[id]/route.ts',
  'src/app/api/proctor/upload-frames/route.ts',
  'src/app/api/proctor/event/route.ts',
  'src/app/api/public-test-attempts/[id]/progress/route.ts',
  'src/app/api/job-profile-invitations/[id]/route.ts',
  'src/app/api/users/route.ts',
  'src/app/api/public-test-links/[linkToken]/check-email/route.ts',
  'src/app/api/invitations/[id]/attempt/route.ts',
  'src/app/api/analytics/route.ts',
  'src/app/api/test-attempts/[id]/progress/route.ts',
  'src/app/api/admin/public-links/route.ts',
  'src/app/api/admin/analytics/overview/route.ts',
  'src/app/api/admin/analytics/position/[id]/route.ts',
  'src/app/api/admin/invitations/bulk/route.ts',
  'src/app/api/admin/job-profiles/invitations/[id]/route.ts',
  'src/app/api/admin/job-profiles/invitations/route.ts',
  'src/app/api/admin/job-profiles/[id]/time-slot-link/route.ts',
  'src/app/api/admin/job-profiles/[id]/public-link/route.ts',
  'src/app/api/admin/job-profiles/[id]/invitations/route.ts',
  'src/app/api/admin/time-slots/route.ts',
  'src/app/api/admin/tests/route.ts',
  'src/app/api/admin/job-profiles/[id]/invitations/bulk/route.ts',
  'src/app/api/admin/activity-feed/route.ts',
  'src/app/api/admin/position-leaderboard/route.ts',
  'src/app/api/admin/time-slot-links/route.ts',
  'src/app/api/admin/dashboard-stats/route.ts'
];

console.log('🔧 Fixing Prisma connection pool exhaustion across all API routes...\n');

let totalFixed = 0;
let totalErrors = 0;

filesToFix.forEach((filePath, index) => {
  try {
    console.log(`${index + 1}/${filesToFix.length} Processing: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found, skipping: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if file has the problematic pattern
    if (!content.includes('const prisma = new PrismaClient()')) {
      console.log(`   ✅ Already fixed or no issue found`);
      return;
    }

    // Replace the problematic import and instantiation
    const oldPattern = /import.*PrismaClient.*from ['"]@prisma\/client['"];?\s*const prisma = new PrismaClient\(\);?/g;
    const newPattern = "import { prisma } from '@/lib/prisma';";
    
    // More specific pattern if the above doesn't work
    if (!oldPattern.test(content)) {
      // Try to replace just the instantiation line
      content = content.replace(/const prisma = new PrismaClient\(\);?/g, '');
      
      // Add the import if it doesn't exist
      if (!content.includes("import { prisma } from '@/lib/prisma'")) {
        // Find where to insert the import
        const importLines = content.split('\n').slice(0, 10); // Check first 10 lines
        let insertIndex = 0;
        
        for (let i = 0; i < importLines.length; i++) {
          if (importLines[i].startsWith('import ')) {
            insertIndex = i + 1;
          }
        }
        
        const lines = content.split('\n');
        lines.splice(insertIndex, 0, "import { prisma } from '@/lib/prisma';");
        content = lines.join('\n');
      }
    } else {
      content = content.replace(oldPattern, newPattern);
    }

    // Remove any remaining PrismaClient imports that aren't used
    content = content.replace(/import.*PrismaClient.*from ['"]@prisma\/client['"];?\s*/g, '');

    // Write the fixed content back
    fs.writeFileSync(filePath, content);
    totalFixed++;
    console.log(`   ✅ Fixed successfully`);

  } catch (error) {
    totalErrors++;
    console.log(`   ❌ Error fixing ${filePath}: ${error.message}`);
  }
});

console.log(`\n📊 Summary:`);
console.log(`   ✅ Successfully fixed: ${totalFixed} files`);
console.log(`   ❌ Errors: ${totalErrors} files`);

if (totalFixed > 0) {
  console.log(`\n🎉 Connection pool exhaustion should now be resolved!`);
  console.log(`   All API routes now use the singleton Prisma client from @/lib/prisma`);
  console.log(`   This should fix 500 errors on Vercel caused by connection limits.`);
}

console.log(`\n🚀 Next steps:`);
console.log(`   1. Commit and deploy these changes to Vercel`);
console.log(`   2. Test job profile creation/editing on production`);
console.log(`   3. Monitor for any remaining 500 errors`);
