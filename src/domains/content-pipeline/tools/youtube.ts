import { getRealYouTubeMetrics, RealYouTubeMetrics } from '../../../infrastructure/youtube/metrics-service.js';
import { getCachedMetrics, setCachedMetrics } from '../../../infrastructure/youtube/metrics-cache.js';
import { getMockYouTubeMetrics } from './youtube-mock.js';

export const fetchYouTubeChannelStats = async (channelId: string): Promise<RealYouTubeMetrics> => {
  // 1. Check cache
  const cached = await getCachedMetrics(channelId);
  if (cached) {
    console.log(`[YouTube Tool] Usando caché para ${channelId}`);
    return cached;
  }

  // 2. Try real API
  try {
    const metrics = await getRealYouTubeMetrics(channelId);
    await setCachedMetrics(channelId, metrics).catch(() => {});
    return metrics;
  } catch (error: any) {
    const isQuotaError = error.message?.includes('quotaExceeded')
      || error.message?.includes('quota')
      || error.toString().includes('403');
    console.warn(`[YouTube Tool] Usando mock datos simulados (${isQuotaError ? 'cuota excedida' : 'error: ' + error.message})`);
    return await getMockYouTubeMetrics(channelId);
  }
};
