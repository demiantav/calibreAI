import { SchemaType, type FunctionDeclaration } from "@google/generative-ai";

export const calibreTools: FunctionDeclaration[] = [
  {
    name: "getYouTubeMetrics",
    description: "Obtiene las métricas actuales de un canal de YouTube (suscriptores, vistas totales, vistas del último video).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        channelId: {
          type: SchemaType.STRING,
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
      type: SchemaType.OBJECT,
      properties: {
        creatorName: { type: SchemaType.STRING },
        metrics: {
          type: SchemaType.OBJECT,
          properties: {
            subscribers: { type: SchemaType.NUMBER },
            totalViews: { type: SchemaType.NUMBER },
            lastVideoViews: { type: SchemaType.NUMBER },
            lastVideoLikes: { type: SchemaType.NUMBER },
            lastVideoComments: { type: SchemaType.NUMBER },
            engagementRate: { type: SchemaType.NUMBER },
          }
        },
        insights: {
          type: SchemaType.STRING,
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
      type: SchemaType.OBJECT,
      properties: {
        creatorName: { 
          type: SchemaType.STRING,
          description: "El nombre del creador (ej: midudev)"
        },
      },
      required: ["creatorName"],
    },
  },
  {
    name: "listEmails",
    description: "Lista los últimos correos recibidos en Gmail del creador.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        maxResults: {
          type: SchemaType.NUMBER,
          description: "Número máximo de correos a listar (por defecto 5)",
        },
      },
    },
  },
  {
    name: "sendEmail",
    description: "Envía un correo electrónico desde la cuenta del creador a un destinatario.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        to: { type: SchemaType.STRING, description: "Dirección de correo del destinatario" },
        subject: { type: SchemaType.STRING, description: "Asunto del correo" },
        body: { type: SchemaType.STRING, description: "Cuerpo del mensaje en texto plano" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "generateAndDraftPitch",
    description: "Genera un borrador de pitch para una marca a partir de un email de Gmail. El backend obtiene automáticamente los datos del email usando el gmailId (From, Subject, Snippet). NO necesita que le pases esos datos.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        creatorName: { type: SchemaType.STRING, description: "Nombre del creador" },
        pitchStyle: { type: SchemaType.STRING, description: "Estilo del pitch: 'professional' o 'casual' (default: professional)" },
        gmailId: { type: SchemaType.STRING, description: "ID único del email en Gmail (obtenido del listado de emails). El backend usará este ID para obtener el contenido real del email." },
      },
      required: ["creatorName", "gmailId"],
    },
  },
  {
    name: "calculateSponsorshipValue",
    description: "Calcula las tarifas estimadas de patrocinio del creador basado en sus métricas actuales (suscriptores, vistas, engagement).",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        creatorName: { type: SchemaType.STRING, description: "Nombre del creador" },
        subscribers: { type: SchemaType.NUMBER, description: "Número de suscriptores" },
        totalViews: { type: SchemaType.NUMBER, description: "Vistas totales del canal" },
        lastVideoViews: { type: SchemaType.NUMBER, description: "Vistas del último video" },
        lastVideoLikes: { type: SchemaType.NUMBER, description: "Likes del último video" },
        lastVideoComments: { type: SchemaType.NUMBER, description: "Comentarios del último video" },
        engagementRate: { type: SchemaType.NUMBER, description: "Tasa de engagement pre-calculada (likes+comments)/subs*100" },
        niche: { type: SchemaType.STRING, description: "Nicho del creador (ej: desarrollo web, gaming, cocina)" },
      },
      required: ["creatorName", "subscribers", "totalViews", "lastVideoViews", "niche"],
    },
  }
];
