import { google } from 'googleapis';
import { config } from '../../shared/config.js';

export const oAuth2Client = new google.auth.OAuth2(
  config.GMAIL_CLIENT_ID,
  config.GMAIL_CLIENT_SECRET,
  'http://localhost:8080/auth/callback'
);

// Exportamos una función para generar la URL de autorización
export function getAuthUrl() {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ];
  
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });
}

// Exportamos el cliente de Gmail (esto se inicializará una vez tengamos el token)
export const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
