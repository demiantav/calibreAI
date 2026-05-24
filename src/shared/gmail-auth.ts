import { supabase } from '../infrastructure/supabase/supabase-client.js';
import { oAuth2Client } from '../infrastructure/gmail/gmail-client.js';
import { config } from './config.js';

export async function ensureGmailAuth(userId?: string): Promise<void> {
  // Legacy fallback: if no userId provided, use the first user (backward compat during transition)
  let targetUserId = userId;
  if (!targetUserId) {
    const { data: legacyUser } = await supabase.from('users').select('id').limit(1).single();
    if (!legacyUser) throw new Error('No autenticado. Ejecuta /auth/login');
    targetUserId = legacyUser.id;
  }

  const { data } = await supabase
    .from('users')
    .select('gmail_access_token, gmail_refresh_token, gmail_expires_at')
    .eq('id', targetUserId)
    .single();

  if (!data?.gmail_access_token) throw new Error('No autenticado. Conecta Gmail en el onboarding.');

  oAuth2Client.setCredentials({
    access_token: data.gmail_access_token,
    refresh_token: data.gmail_refresh_token,
  });

  const expiresAt = data.gmail_expires_at ? new Date(data.gmail_expires_at).getTime() : 0;
  if (Date.now() >= expiresAt - 60000) {
    console.log('[Gmail Auth] Token expirado, refrescando...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    await supabase.from('users').update({
      gmail_access_token: credentials.access_token,
      gmail_refresh_token: credentials.refresh_token || data.gmail_refresh_token,
      gmail_expires_at: new Date(Date.now() + (credentials.expiry_date || 3600 * 1000)).toISOString(),
    }).eq('id', targetUserId);
    console.log('[Gmail Auth] Token refrescado y persistido en Supabase.');
  }
}
