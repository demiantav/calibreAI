import { getRealYouTubeMetrics, RealYouTubeMetrics } from '../../../infrastructure/youtube/metrics-service.js';

/**
 * Tool para que el agente obtenga métricas reales de YouTube.
 * @param channelId El ID del canal (ej: UC_x5XG1OV2P6uYZ5JHScBvA)
 */
export const fetchYouTubeChannelStats = async (channelId: string): Promise<RealYouTubeMetrics> => {
  return await getRealYouTubeMetrics(channelId);
};
