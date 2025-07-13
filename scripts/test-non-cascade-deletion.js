#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNonCascadeDeletion() {
  console.log('Testing non-cascade deletion behavior...\n');

  try {
    // 1. Find a public link with attempts
    const linkWithAttempts = await prisma.publicTestLink.findFirst({
      where: {
        attempts: {
          some: {},
        },
      },
      include: {
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (linkWithAttempts) {
      console.log(
        `Found public link with ${linkWithAttempts._count.attempts} attempts:`
      );
      console.log(`- ID: ${linkWithAttempts.id}`);
      console.log(`- Title: ${linkWithAttempts.title}`);
      console.log(`- Token: ${linkWithAttempts.linkToken}`);

      console.log('\nAttempting to delete this link...');
      try {
        await prisma.publicTestLink.delete({
          where: { id: linkWithAttempts.id },
        });
        console.log('✅ SUCCESS: Link was deleted.');

        // Verify that attempts still exist but with NULL publicLinkId
        const preservedAttempts = await prisma.publicTestAttempt.count({
          where: {
            publicLinkId: null,
          },
        });

        console.log(
          `   ${preservedAttempts} test attempts were preserved with publicLinkId set to NULL.`
        );
      } catch (error) {
        console.log('❌ ERROR: Failed to delete link:', error.message);
        console.log(
          '   The database may still have RESTRICT or CASCADE constraint.'
        );
      }
    } else {
      console.log('No public links with attempts found to test.');
    }

    console.log('\n---\n');

    // 2. Find a time slot with public links
    const timeSlotWithLinks = await prisma.timeSlot.findFirst({
      where: {
        publicTestLinks: {
          some: {},
        },
      },
      include: {
        publicTestLinks: {
          include: {
            _count: {
              select: {
                attempts: true,
              },
            },
          },
        },
      },
    });

    if (timeSlotWithLinks) {
      const totalLinks = timeSlotWithLinks.publicTestLinks.length;
      const linksWithAttempts = timeSlotWithLinks.publicTestLinks.filter(
        (link) => link._count.attempts > 0
      ).length;
      const linksWithoutAttempts = totalLinks - linksWithAttempts;

      console.log(`Found time slot with ${totalLinks} public links:`);
      console.log(`- ID: ${timeSlotWithLinks.id}`);
      console.log(`- Name: ${timeSlotWithLinks.name}`);
      console.log(`- Links with attempts: ${linksWithAttempts}`);
      console.log(`- Links without attempts: ${linksWithoutAttempts}`);

      if (linksWithAttempts > 0) {
        console.log('\n⚠️  This time slot has links with test attempts.');
        console.log(
          '   Deletion should preserve those links and their attempts.'
        );
      }
    } else {
      console.log('No time slots with public links found to test.');
    }

    console.log('\n---\n');

    // 3. Check current schema
    console.log('Checking current database schema...');
    const publicTestAttemptModel = await prisma.$queryRaw`
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
      WHERE tc.table_name = 'PublicTestAttempt' 
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'publicLinkId';
    `;

    if (publicTestAttemptModel.length > 0) {
      const constraint = publicTestAttemptModel[0];
      console.log('Foreign key constraint for PublicTestAttempt.publicLinkId:');
      console.log(`- Delete Rule: ${constraint.delete_rule}`);

      if (constraint.delete_rule === 'CASCADE') {
        console.log(
          '\n⚠️  WARNING: The database still has CASCADE delete rule!'
        );
        console.log(
          '   Test attempts will be deleted when public links are deleted.'
        );
        console.log('   Run: node scripts/apply-manual-migration.js');
      } else if (constraint.delete_rule === 'SET NULL') {
        console.log(
          '\n✅ The database has been updated with SET NULL delete rule.'
        );
        console.log(
          '   Test attempts will be preserved when public links are deleted.'
        );
      } else if (constraint.delete_rule === 'RESTRICT') {
        console.log('\n⚠️  The database has RESTRICT delete rule.');
        console.log('   This will prevent deletion of links with attempts.');
        console.log(
          '   Run: node scripts/apply-manual-migration.js to change to SET NULL'
        );
      }
    }
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNonCascadeDeletion();
