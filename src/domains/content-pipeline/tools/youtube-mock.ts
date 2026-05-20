import { RealYouTubeMetrics } from '../../../infrastructure/youtube/metrics-service.js';
import { config } from '../../../shared/config.js';

export const getMockYouTubeMetrics = async (channelId?: string): Promise<RealYouTubeMetrics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subscriberCount: 1600000,
        totalViews: 480000000,
        lastVideoTitle: 'Nuevo video de prueba - review de herramienta',
        lastVideoViews: 250000,
        lastVideoLikes: 42000,
        lastVideoComments: 3800,
        channelName: channelId?.includes('UC') ? 'midudev' : 'Tech Latino',
        engagementRate: 2.86,
      });
    }, 500);
  });
};
