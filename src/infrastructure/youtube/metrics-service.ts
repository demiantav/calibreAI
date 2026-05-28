import { config } from '../../shared/config.js';

export interface RealYouTubeMetrics {
  subscriberCount: number;
  totalViews: number;
  lastVideoTitle: string;
  lastVideoViews: number;
  lastVideoLikes: number;
  lastVideoComments: number;
  lastVideoId: string;
  channelName: string;
  engagementRate: number;
  algorithmVersion: string;
}

export interface VideoCandidate {
  id: string;
  title: string;
  publishedAt: string;
  duration: string;
  views: number;
  likes: number;
  comments: number;
}

export function parseISODuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return Infinity;
  const hours = parseInt(match[1]?.replace('H', '') || '0');
  const minutes = parseInt(match[2]?.replace('M', '') || '0');
  const seconds = parseInt(match[3]?.replace('S', '') || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

export function isShort(duration: string): boolean {
  return parseISODuration(duration) <= 60;
}

export function isDurable(v: VideoCandidate): boolean {
  return !isShort(v.duration);
}

export function hoursSince(v: VideoCandidate): number {
  return (Date.now() - new Date(v.publishedAt).getTime()) / 3600000;
}

export function selectBestVideo(videos: VideoCandidate[]): VideoCandidate | null {
  if (videos.length === 0) {
    console.log('[selectBestVideo] No hay videos');
    return null;
  }

  const nonShorts = videos.filter(isDurable);
  console.log(`[selectBestVideo] Total: ${videos.length}, Non-shorts: ${nonShorts.length}`);

  // Si hay videos regulares (no-Shorts), tomar el más reciente
  // (playlistItems viene ordenado por fecha descendente, nonShorts[0] es el más reciente)
  if (nonShorts.length > 0) {
    console.log(`[selectBestVideo] Non-short seleccionado "${nonShorts[0].title}" (${Math.round(hoursSince(nonShorts[0]))}h)`);
    return nonShorts[0];
  }

  // Solo hay Shorts en el feed — tomar el más reciente
  console.log(`[selectBestVideo] Short seleccionado "${videos[0].title}" (${Math.round(hoursSince(videos[0]))}h)`);
  return videos[0];
}

async function fetchFromApi<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const data = await res.json() as any;
  if (data.error) throw new Error(`YouTube API Error: ${data.error.message}`);
  return data as T;
}

const PLAYLIST_MAX = 50;

export const getRealYouTubeMetrics = async (channelId: string): Promise<RealYouTubeMetrics> => {
  try {
    const key = config.YOUTUBE_API_KEY;

    const channelData = await fetchFromApi<any>(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${key}`
    );

    const channel = channelData.items?.[0];
    if (!channel) throw new Error('Canal no encontrado');

    const rawSubs = parseInt(channel.statistics?.subscriberCount || '0');
    const channelName = channel.snippet?.title || 'Desconocido';
    const totalViews = parseInt(channel.statistics?.viewCount || '0');
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      throw new Error('El canal no tiene playlist de uploads');
    }

    const playlistData = await fetchFromApi<any>(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${PLAYLIST_MAX}&key=${key}`
    );

    const items = playlistData.items || [];
    if (items.length === 0) {
      throw new Error('La playlist de uploads está vacía');
    }

    const videoIds = items
      .map((item: any) => item.snippet?.resourceId?.videoId)
      .filter(Boolean)
      .join(',');

    const statsData = await fetchFromApi<any>(
      `https://www.googleapis.com/youtube/v3/videos?part=statistics,contentDetails&id=${videoIds}&key=${key}`
    );

    const statsMap: Record<string, any> = {};
    (statsData.items || []).forEach((item: any) => { statsMap[item.id] = item; });

    const candidates: VideoCandidate[] = [];
    for (const item of items) {
      const videoId = item.snippet?.resourceId?.videoId;
      if (!videoId) continue;
      const info = statsMap[videoId];
      if (!info) continue;
      const stats = info.statistics || {};
      const duration = info.contentDetails?.duration;

      // Saltar si no tenemos duración o estadísticas básicas
      if (!duration) continue;

      const views = parseInt(stats.viewCount || '0');
      const likes = parseInt(stats.likeCount || '0');
      const comments = parseInt(stats.commentCount || '0');
      const hoursOld = (Date.now() - new Date(item.snippet?.publishedAt || Date.now()).getTime()) / 3600000;

      // Saltar si tiene más de 1h, 0 vistas pero likes > 0 (inconsistencia)
      if (hoursOld > 1 && views === 0 && likes > 0) continue;

      candidates.push({
        id: videoId,
        title: item.snippet?.title || 'Sin título',
        publishedAt: item.snippet?.publishedAt || new Date().toISOString(),
        duration,
        views,
        likes,
        comments,
      });
    }

    if (candidates.length > 0) {
      console.log('[YouTube Debug] Top 5 candidatos:');
      candidates.slice(0, 5).forEach((c, i) => {
        const durSec = parseISODuration(c.duration);
        console.log(`  ${i + 1}. "${c.title.slice(0, 40)}" | ${durSec}s | ${c.views} views | ${c.likes} likes | ${c.comments} comments`);
      });
    }

    const best = selectBestVideo(candidates);

    if (!best) {
      throw new Error('No se pudo seleccionar un video representativo');
    }

    console.log(`[YouTube Debug] Video SELECCIONADO: "${best.title}" | id=${best.id} | dur=${parseISODuration(best.duration)}s | ${Math.round(hoursSince(best))}h old`);

    const engagementRate = rawSubs > 0
      ? ((best.likes + best.comments) / rawSubs * 100)
      : 0;

    const result = {
      subscriberCount: rawSubs,
      totalViews,
      lastVideoTitle: best.title,
      lastVideoViews: best.views,
      lastVideoLikes: best.likes,
      lastVideoComments: best.comments,
      lastVideoId: best.id,
      channelName,
      engagementRate,
      algorithmVersion: 'v3',
    };

    console.log(`[YouTube Debug] Returning metrics with algorithmVersion=${result.algorithmVersion}`);
    return result;
  } catch (error) {
    console.error('[YouTube Infrastructure] Error:', error);
    throw error;
  }
};
