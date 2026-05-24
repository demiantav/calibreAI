import { z } from 'zod';
import dotenv from 'dotenv';

const envSchema = z.object({
  GEMINI_API_KEY: z.string().min(1).transform(v => v.trim()),
  YOUTUBE_API_KEY: z.string().min(1).transform(v => v.trim()),
  GMAIL_CLIENT_ID: z.string().min(1).transform(v => v.trim()),
  GMAIL_CLIENT_SECRET: z.string().min(1).transform(v => v.trim()),
  SUPABASE_URL: z.string().url().transform(v => v.trim()),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).transform(v => v.trim()),
  PORT: z.string().default("8080"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AUTH_API_KEY: z.string().default(""),
  JWT_SECRET: z.string().min(1).default("calibre-jwt-secret-change-in-production"),
  CREATOR_NAME: z.string().default("midudev"),
  YOUTUBE_CHANNEL_ID: z.string().default("UC8LeXCWOalN8SxlrPcG-PaQ"),
  AUTHENTICATED_USER_EMAIL: z.string().email().default("tavolarodemian06@gmail.com"),
  GMAIL_REDIRECT_URI: z.string().url().default("http://localhost:8080/auth/callback"),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
});

type EnvConfig = z.infer<typeof envSchema>;

let _config: EnvConfig | null = null;

function getConfig(): EnvConfig {
  if (!_config) {
    dotenv.config();
    const _env = envSchema.safeParse(process.env);
    if (!_env.success) {
      console.error("Error en las variables de entorno:", _env.error.format());
      process.exit(1);
    }
    _config = _env.data;
  }
  return _config;
}

export const config = new Proxy<EnvConfig>({} as EnvConfig, {
  get(_, prop) {
    return getConfig()[prop as keyof EnvConfig];
  },
});
