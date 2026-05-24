-- Grant all privileges to service_role (used by backend with SUPABASE_SERVICE_ROLE_KEY)
-- This fixes "permission denied for table users" even after disabling RLS

GRANT ALL PRIVILEGES ON TABLE users TO service_role;
GRANT ALL PRIVILEGES ON TABLE oauth_sessions TO service_role;
GRANT ALL PRIVILEGES ON TABLE agent_logs TO service_role;
GRANT ALL PRIVILEGES ON TABLE processed_emails TO service_role;
GRANT ALL PRIVILEGES ON TABLE channel_metrics_cache TO service_role;

-- Also grant usage on sequences (for UUID generation, etc.)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant on schema itself
GRANT USAGE ON SCHEMA public TO service_role;
