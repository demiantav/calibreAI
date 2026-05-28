import { supabase } from '../supabase/supabase-client.js';
import type { RealYouTubeMetrics } from './metrics-service.js';

const CACHE_TTL_MS = 60 * 60 * 1000;

export const getCachedMetrics = async (channelId: string): Promise<RealYouTubeMetrics | null> => {
  try {
    const { data, error } = await supabase
      .from('channel_metrics_cache')
      .select('data, cached_at')
      .eq('channel_id', channelId)
      .maybeSingle();

    if (error || !data) {
      console.log(`[Metrics Cache] No hay caché para ${channelId} (error=${!!error}, data=${!!data})`);
      return null;
    }

    const age = Date.now() - new Date(data.cached_at).getTime();
    if (age > CACHE_TTL_MS) {
      console.log(`[Metrics Cache] Caché expirado para ${channelId} (${Math.round(age / 1000)}s > ${CACHE_TTL_MS / 1000}s)`);
      return null;
    }

    const metrics = data.data as unknown as RealYouTubeMetrics;
    // Invalidate cache if it lacks lastVideoId (schema was updated)
    if (!metrics.lastVideoId) {
      console.log(`[Metrics Cache] Caché inválido para ${channelId}: falta lastVideoId`);
      return null;
    }
    // Invalidate cache if algorithm version changed
    if (metrics.algorithmVersion !== 'v3') {
      console.log(`[Metrics Cache] Caché inválido para ${channelId}: versión ${metrics.algorithmVersion || 'v1'} != v3`);
      return null;
    }

    console.log(`[Metrics Cache] Caché VÁLIDO para ${channelId}: ${metrics.lastVideoTitle} (v=${metrics.algorithmVersion})`);
    return metrics;
  } catch (e) {
    console.warn('[Metrics Cache] Error leyendo caché:', e);
    return null;
  }
};

export const setCachedMetrics = async (channelId: string, metrics: RealYouTubeMetrics): Promise<void> => {
  try {
    const { error } = await supabase
      .from('channel_metrics_cache')
      .upsert({
        channel_id: channelId,
        data: metrics as any,
        cached_at: new Date().toISOString(),
      }, { onConflict: 'channel_id' });

    if (error) {
      console.warn('[Metrics Cache] Error guardando caché (el sistema funciona igual):', error.message);
    }
  } catch (e) {
    console.warn('[Metrics Cache] Error guardando caché:', e);
  }
};
