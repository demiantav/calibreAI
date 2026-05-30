import { supabase } from '../../infrastructure/supabase/supabase-client.js';
import { mcpManager } from '../../infrastructure/mcp/mcp-manager.js';
import { runPulseCheck } from '../agent-core/heartbeat/pulse.js';

interface UserDigest {
  id: string;
  email: string;
  youtube_channel_id: string;
  youtube_channel_name: string | null;
}

interface LogEntry {
  type: string;
  content: any;
  insights: string;
  created_at: string;
}

function buildDigestHtml(userName: string, logs: LogEntry[]): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Extract data from logs
  const latestMetrics = logs.find((l) => l.type === 'media_kit_update');
  const latestSummary = logs.find((l) => l.type === 'agent_summary');
  const pendingPitches = logs.filter((l) => l.type === 'pitch_draft');
  const forecast = logs.find((l) => l.type === 'sponsorship_forecast');

  const metrics = latestMetrics?.content as {
    subscribers?: number;
    totalViews?: number;
    engagementRate?: number;
  } | undefined;

  const forecastData = forecast?.content as {
    mention?: { min: number; max: number };
    dedicated?: { min: number; max: number };
    series?: { min: number; max: number };
  } | undefined;

  const engRate = metrics?.engagementRate ?? 0;
  const engDisplay = engRate <= 0 ? '0' : engRate < 0.01 ? '<0.01' : engRate.toFixed(2);

  const subsFormatted = metrics?.subscribers ? metrics.subscribers.toLocaleString() : '—';
  const viewsFormatted = metrics?.totalViews ? metrics.totalViews.toLocaleString() : '—';

  const summaryText = (latestSummary?.content as { text?: string })?.text || latestSummary?.insights || 'No hay resumen disponible.';

  // Build pitches HTML
  let pitchesHtml = '';
  if (pendingPitches.length > 0) {
    const pitchItems = pendingPitches
      .map((p) => {
        const draft = p.content as { brandName?: string; status?: string } | undefined;
        const brand = draft?.brandName || 'Marca';
        return `<li style="margin-bottom: 8px; padding: 10px; background: rgba(234,81,3,0.08); border-radius: 8px; border-left: 3px solid #EA5103;">${brand}</li>`;
      })
      .join('');
    pitchesHtml = `
      <div style="margin: 24px 0;">
        <h3 style="color: #FF6B2C; font-size: 16px; margin-bottom: 12px; font-weight: 600;">📬 Pitches pendientes</h3>
        <p style="color: #A0A0B0; margin-bottom: 12px; font-size: 14px;">${pendingPitches.length} borrador(es) esperando tu aprobación</p>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${pitchItems}
        </ul>
      </div>
    `;
  }

  // Build rates HTML
  let ratesHtml = '';
  if (forecastData) {
    ratesHtml = `
      <div style="margin: 24px 0;">
        <h3 style="color: #FF6B2C; font-size: 16px; margin-bottom: 12px; font-weight: 600;">💰 Tarifas estimadas</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: rgba(255,255,255,0.03);">
            <td style="padding: 10px 12px; border-radius: 8px 0 0 8px; color: #A0A0B0; font-size: 14px;">Mención</td>
            <td style="padding: 10px 12px; border-radius: 0 8px 8px 0; color: #F0F0F5; font-size: 14px; font-weight: 600; text-align: right;">$${forecastData.mention?.min ?? 0} — $${forecastData.mention?.max ?? 0}</td>
          </tr>
          <tr><td colspan="2" style="height: 4px;"></td></tr>
          <tr style="background: rgba(255,255,255,0.03);">
            <td style="padding: 10px 12px; border-radius: 8px 0 0 8px; color: #A0A0B0; font-size: 14px;">Dedicado</td>
            <td style="padding: 10px 12px; border-radius: 0 8px 8px 0; color: #F0F0F5; font-size: 14px; font-weight: 600; text-align: right;">$${forecastData.dedicated?.min ?? 0} — $${forecastData.dedicated?.max ?? 0}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // Replace newlines in summary with <p> tags
  const summaryParagraphs = summaryText
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => `<p style="margin: 0 0 10px 0; color: #F0F0F5; line-height: 1.6; font-size: 14px;">${line}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #030305; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #030305;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" style="max-width: 560px; width: 100%; border-collapse: collapse; background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 24px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: linear-gradient(135deg, #EA5103, #FF8F5C); display: inline-flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 16px;">✦</span>
                </div>
                <span style="color: #F0F0F5; font-size: 18px; font-weight: 700; letter-spacing: -0.02em;">Calibre</span>
              </div>
              <p style="color: #5A5A70; font-size: 12px; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 0.15em;">${dateStr}</p>
            </td>
          </tr>

          <!-- Metrics Snapshot -->
          <tr>
            <td style="padding: 24px;">
              <h2 style="color: #FF6B2C; font-size: 13px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">Tus métricas</h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center; width: 33%;">
                    <p style="color: #5A5A70; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.1em;">Suscriptores</p>
                    <p style="color: #F0F0F5; font-size: 20px; font-weight: 700; margin: 0; font-variant-numeric: tabular-nums;">${subsFormatted}</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center; width: 33%;">
                    <p style="color: #5A5A70; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.1em;">Vistas</p>
                    <p style="color: #F0F0F5; font-size: 20px; font-weight: 700; margin: 0; font-variant-numeric: tabular-nums;">${viewsFormatted}</p>
                  </td>
                  <td style="width: 8px;"></td>
                  <td style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 12px; text-align: center; width: 33%;">
                    <p style="color: #5A5A70; font-size: 11px; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.1em;">Engagement</p>
                    <p style="color: #FF6B2C; font-size: 20px; font-weight: 700; margin: 0; font-variant-numeric: tabular-nums;">${engDisplay}%</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Daily Brief -->
          <tr>
            <td style="padding: 0 24px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <h2 style="color: #FF6B2C; font-size: 13px; margin: 0 0 16px; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600;">Daily Brief</h2>
              <div style="background: rgba(34,211,238,0.05); border-left: 3px solid #22D3EE; padding: 16px; border-radius: 0 12px 12px 0;">
                ${summaryParagraphs}
              </div>
            </td>
          </tr>

          <!-- Pitches -->
          ${pitchesHtml ? `<tr><td style="padding: 0 24px;">${pitchesHtml}</td></tr>` : ''}

          <!-- Rates -->
          ${ratesHtml ? `<tr><td style="padding: 0 24px;">${ratesHtml}</td></tr>` : ''}

          <!-- CTA -->
          <tr>
            <td style="padding: 24px; text-align: center;">
              <a href="#" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #EA5103, #FF8F5C); color: white; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">Abrir Dashboard</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; text-align: center; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="color: #5A5A70; font-size: 12px; margin: 0;">Enviado por Calibre AI · Tu agente de sponsors</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function generateAndSendDigest(user: UserDigest): Promise<void> {
  console.log(`[DigestService] Iniciando digest para usuario ${user.id} (${user.email})...`);

  try {
    // 1. Run pulse to get fresh data
    console.log(`[DigestService] Corriendo pulse para usuario ${user.id}...`);
    await runPulseCheck(user.id, user.youtube_channel_id, { autoPitchEnabled: false });

    // 2. Wait a moment for data to propagate
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. Fetch latest logs (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: logs, error: logsError } = await supabase
      .from('agent_logs')
      .select('type, content, insights, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error(`[DigestService] Error fetching logs for user ${user.id}:`, logsError);
      throw new Error('Error fetching user logs');
    }

    if (!logs || logs.length === 0) {
      console.log(`[DigestService] No hay logs recientes para usuario ${user.id}, saltando digest.`);
      return;
    }

    // 4. Generate HTML
    const html = buildDigestHtml(user.youtube_channel_name || 'Creator', logs as LogEntry[]);

    // 5. Send email via MCP
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const subject = `📊 Calibre · Daily Brief de ${user.youtube_channel_name || 'Creator'} · ${dateStr}`;

    const isHealthy = await mcpManager.healthCheck();
    if (!isHealthy) {
      console.warn(`[DigestService] MCP no está healthy para usuario ${user.id}, reintentando en 10s...`);
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const retryHealthy = await mcpManager.healthCheck();
      if (!retryHealthy) {
        throw new Error('MCP Server sigue unhealthy tras retry');
      }
    }

    await mcpManager.callTool('send_email', {
      to: user.email,
      subject,
      body: 'Resumen diario de tu canal. Abrí el email para ver el contenido completo.',
      html,
    });

    console.log(`[DigestService] ✅ Digest enviado a ${user.email}`);
  } catch (error: any) {
    console.error(`[DigestService] ❌ Error enviando digest a ${user.email}:`, error.message || error);
    throw error;
  }
}

export async function runDailyDigest(): Promise<void> {
  console.log('[DigestService] Iniciando ciclo diario de digests...');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, youtube_channel_id, youtube_channel_name')
      .eq('email_digest_enabled', true)
      .not('youtube_channel_id', 'is', null);

    if (error) {
      console.error('[DigestService] Error fetching users:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('[DigestService] No hay usuarios con digest activado.');
      return;
    }

    console.log(`[DigestService] ${users.length} usuario(s) con digest activado.`);

    for (const user of users) {
      try {
        await generateAndSendDigest(user as UserDigest);
      } catch (err) {
        console.error(`[DigestService] Error para usuario ${user.id}, continuando con el siguiente...`);
      }
      // Stagger to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('[DigestService] Ciclo diario completado.');
  } catch (error) {
    console.error('[DigestService] Error en ciclo diario:', error);
  }
}

/**
 * Hourly tick: checks each user's local time and sends digest if it's 8am
 * in their timezone and they haven't received one today.
 */
export async function tickDigestScheduler(): Promise<void> {
  console.log('[DigestService] Tick: checking users for digest time...');

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, youtube_channel_id, youtube_channel_name, timezone, last_digest_sent_at')
      .eq('email_digest_enabled', true)
      .not('youtube_channel_id', 'is', null);

    if (error) {
      console.error('[DigestService] Error fetching users for tick:', error);
      return;
    }

    if (!users || users.length === 0) return;

    const now = new Date();
    let sentCount = 0;

    for (const user of users) {
      const tz = user.timezone || 'UTC';

      // Get current hour in user's timezone (0-23)
      const localHourStr = now.toLocaleString('en-US', {
        timeZone: tz,
        hour: 'numeric',
        hour12: false,
      });
      const localHour = parseInt(localHourStr, 10);

      // Only send at 8am local time
      if (localHour !== 8) continue;

      // Check if already sent today (avoid double-send within the same hour)
      if (user.last_digest_sent_at) {
        const lastSent = new Date(user.last_digest_sent_at);
        const lastSentDateStr = lastSent.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
        const todayDateStr = now.toLocaleDateString('en-CA', { timeZone: tz }); // YYYY-MM-DD
        if (lastSentDateStr === todayDateStr) continue;
      }

      console.log(`[DigestService] Tick: it's 8am in ${tz} for user ${user.id} (${user.email}), sending digest...`);

      try {
        await generateAndSendDigest(user as UserDigest);
        sentCount++;

        // Update last_digest_sent_at
        await supabase
          .from('users')
          .update({ last_digest_sent_at: now.toISOString() })
          .eq('id', user.id);
      } catch (err) {
        console.error(`[DigestService] Tick: error sending digest to ${user.id}:`, err);
      }

      // Stagger between users
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (sentCount > 0) {
      console.log(`[DigestService] Tick: sent ${sentCount} digest(s).`);
    }
  } catch (error) {
    console.error('[DigestService] Error in tick:', error);
  }
}
