-- Sprint 14 Migration: Pipeline Visual — Add snippet to processed_emails for lead cards
-- Run this in Supabase SQL Editor

-- 1. Add snippet column to processed_emails
ALTER TABLE processed_emails ADD COLUMN IF NOT EXISTS snippet TEXT;

-- 2. Backfill existing records with placeholder (optional, they will get filled on next agent run)
UPDATE processed_emails SET snippet = '' WHERE snippet IS NULL;

-- 3. Grant permissions
GRANT ALL PRIVILEGES ON TABLE processed_emails TO service_role;

-- 4. Disable RLS if needed (service_role bypass)
ALTER TABLE IF EXISTS processed_emails DISABLE ROW LEVEL SECURITY;
