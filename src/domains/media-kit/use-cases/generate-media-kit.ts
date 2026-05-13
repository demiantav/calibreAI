import { model } from "../../agent-core/reasoning/gemini-client.js";
import { RealYouTubeMetrics } from "../../../infrastructure/youtube/metrics-service.js";
import { MediaKit } from "../entities/media-kit.js";

export const generateMediaKitUseCase = async (metrics: RealYouTubeMetrics): Promise<MediaKit> => {
  const prompt = `
    Basado en estas métricas de YouTube:
    - Canal: ${metrics.channelName}
    - Suscriptores: ${metrics.subscriberCount}
    - Vistas totales: ${metrics.totalViews}
    - Vistas último video: ${metrics.lastVideoViews}

    Genera un Media Kit profesional para marcas.
    RESPONDE ÚNICAMENTE CON UN OBJETO JSON con la siguiente estructura (sin Markdown, solo el JSON):
    {
      "creatorName": "Nombre del Creador",
      "channelName": "${metrics.channelName}",
      "updatedAt": "${new Date().toISOString()}",
      "metrics": {
        "subscribers": ${metrics.subscriberCount},
        "totalViews": ${metrics.totalViews},
        "lastVideoViews": ${metrics.lastVideoViews}
      },
      "strategy": {
        "shortPitch": "resumen de 1 frase",
        "valueProposition": "3 puntos clave de por qué una marca debe pagar",
        "suggestedNiche": "categoría principal"
      }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpiamos el texto por si Gemini añade bloques de código Markdown
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString) as MediaKit;
  } catch (error) {
    console.error("[Media Kit Use Case] Error generando JSON:", error);
    throw new Error("No se pudo generar el Media Kit estructurado");
  }
};
