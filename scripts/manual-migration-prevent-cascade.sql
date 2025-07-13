-- Manual migration to prevent cascade deletion of test attempts when deleting public links
-- This will set publicLinkId to NULL when a link is deleted, preserving the attempt data

-- Drop the existing foreign key constraint
ALTER TABLE "PublicTestAttempt" 
DROP CONSTRAINT IF EXISTS "PublicTestAttempt_publicLinkId_fkey";

-- Add the new foreign key constraint with SET NULL instead of CASCADE
ALTER TABLE "PublicTestAttempt" 
ADD CONSTRAINT "PublicTestAttempt_publicLinkId_fkey" 
FOREIGN KEY ("publicLinkId") 
REFERENCES "PublicTestLink"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verify the change
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
