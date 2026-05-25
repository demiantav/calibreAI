import { model } from "../../agent-core/reasoning/gemini-client.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";

export interface SponsorshipForecast {
  mention: { min: number; max: number; currency: string };
  dedicated: { min: number; max: number; currency: string };
  series: { min: number; max: number; currency: string };
  estimatedCpm: number;
  marketContext: string;
}

interface SponsorshipInput {
  creatorName: string;
  subscribers: number;
  totalViews: number;
  lastVideoViews: number;
  lastVideoLikes?: number;
  lastVideoComments?: number;
  engagementRate?: number;
  niche: string;
  userId?: string;
}

export const calculateSponsorshipUseCase = async (input: SponsorshipInput): Promise<SponsorshipForecast> => {
  let engagementRate: string;
  if (input.engagementRate !== undefined && input.engagementRate > 0) {
    engagementRate = input.engagementRate < 0.01 ? '<0.01' : input.engagementRate.toFixed(2);
  } else {
    const hasInteraction = (input.lastVideoLikes ?? 0) > 0 || (input.lastVideoComments ?? 0) > 0;
    const engRaw = hasInteraction
      ? ((input.lastVideoLikes ?? 0) + (input.lastVideoComments ?? 0)) / input.subscribers * 100
      : input.lastVideoViews / input.subscribers * 100;
    engagementRate = engRaw <= 0 ? '0' : engRaw < 0.01 ? '<0.01' : engRaw.toFixed(2);
  }

  const prompt = `
    Eres un analista de marketing de influencers. Basado en estas métricas de un creador de contenido, estima sus tarifas de patrocinio actuales en el mercado.

    MÉTRICAS DEL CREADOR:
    - Nombre: ${input.creatorName}
    - Suscriptores: ${input.subscribers.toLocaleString()}
    - Vistas totales: ${input.totalViews.toLocaleString()}
    - Vistas último video: ${input.lastVideoViews.toLocaleString()}
    - Engagement rate: ${engagementRate}%
    - Nicho: ${input.niche}

    RESPONDE ÚNICAMENTE CON UN OBJETO JSON con esta estructura (sin Markdown, solo el JSON):
    {
      "mention": { "min": 800, "max": 1200, "currency": "USD" },
      "dedicated": { "min": 1500, "max": 2500, "currency": "USD" },
      "series": { "min": 3000, "max": 5000, "currency": "USD" },
      "estimatedCpm": 8.5,
      "marketContext": "Breve análisis de mercado (1-2 frases)"
    }

    Reglas:
    - mention = mención en video (30-60 seg)
    - dedicated = video dedicado a la marca
    - series = serie de 3 videos patrocinados
    - estimatedCpm = costo por mil impresiones estimado en USD
    - Sé realista con las tarifas según el nicho y engagement
  `;

  try {
    let forecast: SponsorshipForecast;

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      forecast = JSON.parse(jsonString) as SponsorshipForecast;
    } catch (genError: any) {
      console.warn(`[Sponsorship Use Case] Gemini no disponible. Usando forecast mock para ${input.creatorName}.`);
      const baseRate = Math.round(input.subscribers * 0.002);
      forecast = {
        mention: { min: baseRate, max: Math.round(baseRate * 1.5), currency: 'USD' },
        dedicated: { min: Math.round(baseRate * 2), max: Math.round(baseRate * 3), currency: 'USD' },
        series: { min: Math.round(baseRate * 4), max: Math.round(baseRate * 6), currency: 'USD' },
        estimatedCpm: parseFloat((input.subscribers > 500000 ? 8 : 5).toFixed(1)),
        marketContext: 'Estimación basada en métricas generales del mercado. Los datos personalizados se actualizarán en el próximo ciclo.',
      };
    }

    const insertData: any = {
      creator_name: input.creatorName,
      type: 'sponsorship_forecast',
      content: forecast,
      insights: `Sponsorship forecast para ${input.creatorName}: mención $${forecast.mention.min}-$${forecast.mention.max}, dedicado $${forecast.dedicated.min}-$${forecast.dedicated.max}. Engagement: ${engagementRate}%. ${forecast.marketContext}`,
    };
    if (input.userId) insertData.user_id = input.userId;

    const { error } = await supabase
      .from('agent_logs')
      .insert([insertData]);

    if (error) {
      console.error("[Sponsorship Use Case] Error guardando forecast:", error);
    }

    return forecast;
  } catch (error) {
    console.error("[Sponsorship Use Case] Error generando forecast:", error);
    throw new Error("No se pudo calcular el sponsorship value");
  }
};
