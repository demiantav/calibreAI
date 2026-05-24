-- Sprint 10 Migration: Multi-tenant Auth
-- Run this in Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  youtube_channel_id TEXT,
  youtube_channel_url TEXT,
  youtube_channel_name TEXT,
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  gmail_expires_at TIMESTAMPTZ,
  auto_pitch_enabled BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_youtube_channel_id ON users(youtube_channel_id);

-- 2. Create oauth_sessions table (temporary, 10min TTL)
CREATE TABLE IF NOT EXISTS oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oauth_sessions_state ON oauth_sessions(state);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_created_at ON oauth_sessions(created_at);

-- 3. Add user_id to existing tables
-- Note: media_kit_update is stored in agent_logs with type='media_kit_update', not a separate table

ALTER TABLE agent_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_logs(user_id);

ALTER TABLE processed_emails ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_processed_emails_user_id ON processed_emails(user_id);

ALTER TABLE channel_metrics_cache ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_channel_metrics_user_id ON channel_metrics_cache(user_id);

-- 4. Migrate legacy user from user_auth
-- Note: After running this, set a real password via the register flow or update directly
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM user_auth LIMIT 1) THEN
    INSERT INTO users (email, password_hash, youtube_channel_id, youtube_channel_url, youtube_channel_name, gmail_access_token, gmail_refresh_token, gmail_expires_at, onboarding_completed, onboarding_step)
    SELECT 
      user_email, 
      'LEGACY_MUST_SET_PASSWORD',
      'UC8LeXCWOalN8SxlrPcG-PaQ',
      'https://www.youtube.com/@midudev',
      'midudev',
      access_token, 
      refresh_token, 
      expires_at, 
      true,
      4
    FROM user_auth
    LIMIT 1
    ON CONFLICT (email) DO NOTHING;
    
    UPDATE agent_logs SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
    UPDATE processed_emails SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
    UPDATE channel_metrics_cache SET user_id = (SELECT id FROM users LIMIT 1) WHERE user_id IS NULL;
  END IF;
END $$;

-- 5. Cleanup function for expired oauth_sessions (run periodically or via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_sessions WHERE created_at < NOW() - INTERVAL '10 minutes';
END;
$$ LANGUAGE plpgsql;
