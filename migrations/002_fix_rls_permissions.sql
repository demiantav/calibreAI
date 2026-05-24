-- Fix RLS permissions for backend service role access
-- Run this in Supabase SQL Editor after the main migration

-- Disable RLS on users table (backend uses service role key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on oauth_sessions table
ALTER TABLE oauth_sessions DISABLE ROW LEVEL SECURITY;

-- Also ensure RLS doesn't block on existing tables that now have user_id
-- If RLS was enabled on these, we need to disable or add policies
ALTER TABLE agent_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE processed_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE channel_metrics_cache DISABLE ROW LEVEL SECURITY;
