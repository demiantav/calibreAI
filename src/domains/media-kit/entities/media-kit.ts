export interface MediaKit {
  creatorName: string;
  channelName: string;
  updatedAt: string;
  metrics: {
    subscribers: number;
    totalViews: number;
    lastVideoViews: number;
  };
  strategy: {
    shortPitch: string;      // Un resumen muy corto para marcas
    valueProposition: string; // Por qué invertir en este creador
    suggestedNiche: string;   // En qué categoría brilla más
  };
  liveUrl?: string; // Futura URL pública
}
