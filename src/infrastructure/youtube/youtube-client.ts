import { google } from 'googleapis';
import { config } from '../../shared/config.js';

export const youtube = google.youtube({
  version: 'v3',
  auth: config.YOUTUBE_API_KEY // Esto debería funcionar, pero vamos a asegurarnos de que la config la tenga
});
