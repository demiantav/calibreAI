-- Migration: Add thread_id column to processed_emails for conversation threading
ALTER TABLE processed_emails ADD COLUMN IF NOT EXISTS thread_id TEXT;

-- Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_processed_emails_thread_id ON processed_emails(thread_id);

-- Populate existing rows with empty string to avoid nulls
UPDATE processed_emails SET thread_id = '' WHERE thread_id IS NULL;
