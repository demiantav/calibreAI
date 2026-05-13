import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).transform(v => v.trim()),
  YOUTUBE_API_KEY: z.string().min(1).transform(v => v.trim()),
  GMAIL_CLIENT_ID: z.string().min(1).transform(v => v.trim()),
  GMAIL_CLIENT_SECRET: z.string().min(1).transform(v => v.trim()),
  SUPABASE_URL: z.string().url().transform(v => v.trim()),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).transform(v => v.trim()),
  PORT: z.string().default("8080"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Error en las variables de entorno:", _env.error.format());
  process.exit(1);
}

export const config = _env.data;
