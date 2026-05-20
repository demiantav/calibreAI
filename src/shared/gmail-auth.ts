import { supabase } from '../infrastructure/supabase/supabase-client.js';
import { oAuth2Client } from '../infrastructure/gmail/gmail-client.js';
import { config } from './config.js';

export async function ensureGmailAuth(): Promise<void> {
  const { data } = await supabase
    .from('user_auth')
    .select('*')
    .eq('user_email', config.AUTHENTICATED_USER_EMAIL)
    .single();

  if (!data) throw new Error('No autenticado. Ejecuta /auth/login');

  oAuth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  if (Date.now() >= expiresAt - 60000) {
    console.log('[Gmail Auth] Token expirado, refrescando...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    await supabase.from('user_auth').upsert({
      user_email: config.AUTHENTICATED_USER_EMAIL,
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || data.refresh_token,
      expires_at: new Date(Date.now() + (credentials.expiry_date || 3600 * 1000)).toISOString(),
    });
    console.log('[Gmail Auth] Token refrescado y persistido en Supabase.');
  }
}
