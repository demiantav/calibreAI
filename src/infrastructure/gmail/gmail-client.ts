import { google } from 'googleapis';
import { config } from '../../shared/config.js';

export const oAuth2Client = new google.auth.OAuth2(
  config.GMAIL_CLIENT_ID,
  config.GMAIL_CLIENT_SECRET,
  config.GMAIL_REDIRECT_URI
);

export function getAuthUrl(state: string) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];

  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state,
  });
}

// Exportamos el cliente de Gmail (esto se inicializará una vez tengamos el token)
export const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
