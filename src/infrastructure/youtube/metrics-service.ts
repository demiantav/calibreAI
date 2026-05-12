import { config } from '../../shared/config.js';

export interface RealYouTubeMetrics {
  subscriberCount: number;
  totalViews: number;
  lastVideoTitle: string;
  lastVideoViews: number;
  channelName: string;
}

export const getRealYouTubeMetrics = async (channelId: string): Promise<RealYouTubeMetrics> => {
  try {
    const key = config.YOUTUBE_API_KEY;
    
    // 1. Datos del canal
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${key}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json() as any;

    if (channelData.error) {
      throw new Error(`YouTube API Error (Channels): ${channelData.error.message}`);
    }

    const channel = channelData.items?.[0];
    if (!channel) throw new Error('Canal no encontrado');

    // 2. Último video
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=1&type=video&key=${key}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json() as any;

    const lastVideo = searchData.items?.[0];
    let videoViews = 0;

    if (lastVideo?.id?.videoId) {
      const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${lastVideo.id.videoId}&key=${key}`;
      const videoRes = await fetch(videoUrl);
      const videoData = await videoRes.json() as any;
      videoViews = parseInt(videoData.items?.[0]?.statistics?.viewCount || '0');
    }

    return {
      subscriberCount: parseInt(channel.statistics?.subscriberCount || '0'),
      totalViews: parseInt(channel.statistics?.viewCount || '0'),
      lastVideoTitle: lastVideo?.snippet?.title || 'Sin videos',
      lastVideoViews: videoViews,
      channelName: channel.snippet?.title || 'Desconocido'
    };
  } catch (error) {
    console.error('[YouTube Infrastructure] Error:', error);
    throw error;
  }
};
