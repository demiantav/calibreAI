import { RealYouTubeMetrics } from '../../../infrastructure/youtube/metrics-service.js';

export const getMockYouTubeMetrics = async (channelId?: string): Promise<RealYouTubeMetrics> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subscriberCount: 738000,
        totalViews: 67614138,
        lastVideoTitle: 'Nuevo video de prueba - review de herramienta',
        lastVideoViews: 45000,
        channelName: channelId?.includes('UC') ? 'midudev' : 'Tech Latino',
      });
    }, 500);
  });
};
