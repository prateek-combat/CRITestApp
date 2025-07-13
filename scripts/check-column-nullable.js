#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkColumnNullability() {
  console.log('Checking PublicTestAttempt.publicLinkId column properties...\n');

  try {
    // Check column properties
    const columnInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        is_nullable,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'PublicTestAttempt' 
        AND column_name = 'publicLinkId';
    `;

    if (columnInfo.length > 0) {
      const col = columnInfo[0];
      console.log('Column properties:');
      console.log(`- Column: ${col.column_name}`);
      console.log(`- Nullable: ${col.is_nullable}`);
      console.log(`- Data type: ${col.data_type}`);

      if (col.is_nullable === 'NO') {
        console.log(
          '\n⚠️  The column is NOT NULL. We need to make it nullable.'
        );
      } else {
        console.log('\n✅ The column is already nullable.');
      }
    }

    // Check constraint
    const constraint = await prisma.$queryRaw`
      SELECT 
        tc.constraint_name,
        rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_name = rc.constraint_name
      WHERE tc.table_name = 'PublicTestAttempt' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'publicLinkId';
    `;

    if (constraint.length > 0) {
      console.log(`\nForeign key delete rule: ${constraint[0].delete_rule}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkColumnNullability();
