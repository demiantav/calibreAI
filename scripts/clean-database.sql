-- ============================================================
-- Clean Database Script
-- Purpose: Remove ALL user data while keeping schema intact
-- WARNING: This deletes EVERYTHING. Use with caution.
-- Run in Supabase SQL Editor before manual testing.
-- ============================================================

-- Disable triggers temporarily (optional, speeds up bulk delete)
-- SET session_replication_role = 'replica';

-- Delete all logs (includes media_kit_update, agent_summary, pitch_draft, etc.)
TRUNCATE TABLE agent_logs RESTART IDENTITY CASCADE;

-- Delete processed email deduplication records
TRUNCATE TABLE processed_emails RESTART IDENTITY CASCADE;

-- Delete cached YouTube metrics
TRUNCATE TABLE channel_metrics_cache RESTART IDENTITY CASCADE;

-- Delete OAuth sessions (Gmail auth states)
TRUNCATE TABLE oauth_sessions RESTART IDENTITY CASCADE;

-- Delete all users (ON DELETE CASCADE handles references in tables above)
-- NOTE: If you have other tables with user_id FK not listed above,
-- either add them here or run: DELETE FROM users CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Re-enable triggers if disabled above
-- SET session_replication_role = 'origin';

-- ============================================================
-- Verification (optional - run these to confirm cleanup)
-- ============================================================
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM agent_logs;
-- SELECT COUNT(*) FROM processed_emails;
-- SELECT COUNT(*) FROM channel_metrics_cache;
-- SELECT COUNT(*) FROM oauth_sessions;

-- All counts should return 0.
