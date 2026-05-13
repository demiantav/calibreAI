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
    description: "Genera un borrador de pitch personalizado para una marca usando el Media Kit del creador. NO envía el email, solo crea y guarda el draft en Supabase.",
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        creatorName: { type: SchemaType.STRING, description: "Nombre del creador" },
        brandName: { type: SchemaType.STRING, description: "Nombre de la marca" },
        brandEmail: { type: SchemaType.STRING, description: "Email de contacto de la marca" },
        brandContext: { type: SchemaType.STRING, description: "Contexto del email recibido de la marca (subject o snippet)" },
        pitchStyle: { type: SchemaType.STRING, description: "Estilo del pitch: 'professional' o 'casual' (default: professional)" },
      },
      required: ["creatorName", "brandName", "brandEmail", "brandContext"],
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
        niche: { type: SchemaType.STRING, description: "Nicho del creador (ej: desarrollo web, gaming, cocina)" },
      },
      required: ["creatorName", "subscribers", "totalViews", "lastVideoViews", "niche"],
    },
  }
];
