-- Migration: Add subject column to processed_emails
ALTER TABLE processed_emails ADD COLUMN IF NOT EXISTS subject TEXT;

-- Populate existing rows with empty string to avoid nulls
UPDATE processed_emails SET subject = '' WHERE subject IS NULL;
