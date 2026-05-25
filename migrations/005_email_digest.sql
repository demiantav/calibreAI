-- Sprint 12 Migration: Email Digest Daily
-- Run this in Supabase SQL Editor

-- Add email_digest_enabled to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_digest_enabled BOOLEAN DEFAULT false;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_users_email_digest ON users(email_digest_enabled) WHERE email_digest_enabled = true;
