-- Add citations JSONB column to messages table
-- This stores citation data for assistant messages to persist across page refreshes

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS citations JSONB DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN messages.citations IS 'Stores citation data for assistant messages as JSONB array. Each citation contains id, snippet, content, and metadata.';
