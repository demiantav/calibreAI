export interface YouTubeMetrics {
  subscriberCount: number;
  lastVideoViews: number;
  engagementRate: string;
  channelName: string;
}

export const getMockYouTubeMetrics = async (): Promise<YouTubeMetrics> => {
  // Simulamos una llamada a la API que tarda 500ms
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subscriberCount: 154200,
        lastVideoViews: 45000,
        engagementRate: "8.5%",
        channelName: "Tech Latino"
      });
    }, 500);
  });
};
