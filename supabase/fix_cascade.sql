-- Run this to fix the cascade delete constraint if chunks aren't being deleted

-- First, drop the existing foreign key constraint
ALTER TABLE document_chunks 
DROP CONSTRAINT IF EXISTS document_chunks_document_id_fkey;

-- Re-add it with ON DELETE CASCADE
ALTER TABLE document_chunks 
ADD CONSTRAINT document_chunks_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;

-- Verify the constraint
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.table_name = 'document_chunks'
    AND tc.constraint_type = 'FOREIGN KEY';
