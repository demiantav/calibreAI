-- Calibre — Sprint 4: Permisos para agent_logs
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- Permitir UPDATE y DELETE desde el backend
GRANT UPDATE, DELETE ON public.agent_logs TO service_role;
GRANT DELETE ON public.agent_logs TO service_role;

-- Si usas anon key, descomenta:
-- GRANT UPDATE, DELETE ON public.agent_logs TO anon;

-- Para limpiar todos los registros existentes (datos de prueba)
DELETE FROM public.agent_logs;

-- Tabla para evitar regenerar pitches del mismo email
CREATE TABLE IF NOT EXISTS public.processed_emails (
  gmail_id TEXT PRIMARY KEY,
  brand_email TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT INSERT, SELECT ON public.processed_emails TO service_role;
