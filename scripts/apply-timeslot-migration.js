#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyTimeSlotMigration() {
  console.log(
    'Applying migration to prevent cascade deletion when deleting time slots...\n'
  );

  try {
    // Check current constraint
    console.log('1. Checking current constraint for timeSlotId...');
    const currentConstraint = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'PublicTestLink' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'timeSlotId';
    `;

    if (currentConstraint.length > 0) {
      console.log(`Current delete rule: ${currentConstraint[0].delete_rule}`);
    }

    // Check if column is nullable
    console.log('\\n2. Checking if column is nullable...');
    const columnInfo = await prisma.$queryRaw`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'PublicTestLink' 
        AND column_name = 'timeSlotId';
    `;

    const isNullable = columnInfo[0]?.is_nullable === 'YES';
    const hasCorrectConstraint =
      currentConstraint[0]?.delete_rule === 'SET NULL';

    console.log(`Column nullable: ${isNullable ? 'YES' : 'NO'}`);
    console.log(`Constraint correct: ${hasCorrectConstraint ? 'YES' : 'NO'}`);

    if (isNullable && hasCorrectConstraint) {
      console.log(
        '\\n✅ Everything is already configured correctly. No migration needed.'
      );
      return;
    }

    // Apply migration
    if (!isNullable) {
      console.log('\\n3. Making timeSlotId nullable...');
      await prisma.$executeRaw`
        ALTER TABLE "PublicTestLink" 
        ALTER COLUMN "timeSlotId" DROP NOT NULL;
      `;
    }

    if (!hasCorrectConstraint) {
      console.log('\\n4. Dropping existing constraint...');
      await prisma.$executeRaw`
        ALTER TABLE "PublicTestLink" 
        DROP CONSTRAINT IF EXISTS "PublicTestLink_timeSlotId_fkey";
      `;

      console.log('5. Creating new constraint with SET NULL...');
      await prisma.$executeRaw`
        ALTER TABLE "PublicTestLink" 
        ADD CONSTRAINT "PublicTestLink_timeSlotId_fkey" 
        FOREIGN KEY ("timeSlotId") 
        REFERENCES "TimeSlot"("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
      `;
    }

    // Verify the change
    console.log('\\n6. Verifying the changes...');
    const newConstraint = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'PublicTestLink' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'timeSlotId';
    `;

    if (
      newConstraint.length > 0 &&
      newConstraint[0].delete_rule === 'SET NULL'
    ) {
      console.log('\\n✅ SUCCESS: Migration applied successfully!');
      console.log(
        '   Public test links will now be preserved when deleting time slots.'
      );
      console.log('   The timeSlotId will be set to NULL in existing links.');
    } else {
      console.log('\\n❌ ERROR: Migration may not have applied correctly.');
    }
  } catch (error) {
    console.error('\n❌ Error applying migration:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyTimeSlotMigration();
