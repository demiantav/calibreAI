-- Comprehensive permission fix for Supabase
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is disabled on all tables (service role bypasses RLS anyway, but just in case)
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS oauth_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS processed_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS channel_metrics_cache DISABLE ROW LEVEL SECURITY;

-- 2. Grant all privileges on existing tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 3. Grant schema usage
GRANT USAGE ON SCHEMA public TO service_role;

-- 4. Set default privileges for future tables created by postgres user
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;

-- 5. Also grant to postgres (owner) just in case
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
