import { createClient } from '@supabase/supabase-js';
import { config } from '../../shared/config.js';

if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Faltan credenciales de Supabase");
}

console.log(`[Supabase Init] Intentando conectar a: ${config.SUPABASE_URL.substring(0, 15)}...`);

export const supabase = createClient(
  config.SUPABASE_URL,
  config.SUPABASE_SERVICE_ROLE_KEY
);
