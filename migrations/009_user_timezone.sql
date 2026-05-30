-- 009_user_timezone.sql
-- Agrega timezone por usuario y tracking de último digest enviado

BEGIN;

-- Timezone del usuario (IANA format: "America/Argentina/Buenos_Aires", "Europe/Rome", etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Tracking de último digest enviado (evita doble envío en el scheduler por hora)
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_digest_sent_at TIMESTAMPTZ;

COMMIT;
