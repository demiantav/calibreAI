/**
 * Definición de las herramientas disponibles para el agente Calibre.
 * Usamos strings para los tipos para asegurar compatibilidad con la SDK de Google.
 */
export const calibreTools = [
  {
    name: "getYouTubeMetrics",
    description: "Obtiene las métricas actuales de un canal de YouTube (suscriptores, vistas totales, vistas del último video).",
    parameters: {
      type: "OBJECT",
      properties: {
        channelId: {
          type: "STRING",
          description: "El ID único del canal de YouTube (ej: UC_x5XG1OV2P6uYZ5JHScBvA)",
        },
      },
      required: ["channelId"],
    },
  },
  {
    name: "updateLiveMediaKit",
    description: "Actualiza el Media Kit del creador con nuevas métricas e insights estratégicos.",
    parameters: {
      type: "OBJECT",
      properties: {
        creatorName: { type: "STRING" },
        metrics: {
          type: "OBJECT",
          properties: {
            subscribers: { type: "NUMBER" },
            totalViews: { type: "NUMBER" },
            lastVideoViews: { type: "NUMBER" },
          }
        },
        insights: {
          type: "STRING",
          description: "Análisis estratégico de por qué este creador es valioso para las marcas ahora mismo.",
        }
      },
      required: ["creatorName", "metrics", "insights"],
    },
  },
  {
    name: "getPreviousInsights",
    description: "Recupera los últimos análisis y estados guardados del creador para comparar el progreso.",
    parameters: {
      type: "OBJECT",
      properties: {
        creatorName: { 
          type: "STRING",
          description: "El nombre del creador (ej: midudev)"
        },
      },
      required: ["creatorName"],
    },
  }
];
