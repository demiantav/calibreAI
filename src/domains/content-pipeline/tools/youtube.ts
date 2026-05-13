import { getRealYouTubeMetrics, RealYouTubeMetrics } from '../../../infrastructure/youtube/metrics-service.js';
import { getMockYouTubeMetrics } from './youtube-mock.js';

export const fetchYouTubeChannelStats = async (channelId: string): Promise<RealYouTubeMetrics> => {
  try {
    return await getRealYouTubeMetrics(channelId);
  } catch (error: any) {
    const isQuotaError = error.message?.includes('quotaExceeded')
      || error.message?.includes('quota')
      || error.toString().includes('403');
    console.warn(`[YouTube Tool] Usando mock datos simulados (${isQuotaError ? 'cuota excedida' : 'error: ' + error.message})`);
    return await getMockYouTubeMetrics(channelId);
  }
};
