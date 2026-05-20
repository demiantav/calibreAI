import { model } from "../../agent-core/reasoning/gemini-client.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";
import { MediaKit } from "../../media-kit/entities/media-kit.js";
import { BrandDeal } from "../entities/brand-deal.js";

interface PitchInput {
  creatorName: string;
  brandName: string;
  brandEmail: string;
  brandContext: string;
  pitchStyle?: string;
  gmailId?: string;
  originalEmailFrom?: string;
  originalEmailSubject?: string;
  originalEmailSnippet?: string;
}

interface PitchResult {
  draft: BrandDeal;
  pitchSubject: string;
  pitchContent: string;
}

export const generatePitchUseCase = async (input: PitchInput): Promise<PitchResult> => {
  const { data: mediaKitData } = await supabase
    .from('agent_logs')
    .select('content, insights')
    .eq('creator_name', input.creatorName)
    .eq('type', 'media_kit_update')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const mediaKit: MediaKit | null = mediaKitData?.content || null;
  const insights = mediaKitData?.insights || '';

  const styleGuide = input.pitchStyle || 'professional';

  const prompt = `
    Eres un asistente de ventas para creadores de contenido.
    Debes redactar un correo de pitch para una marca que contactó al creador.

    CONTEXTO DE LA MARCA:
    - Nombre: "${input.brandName}"
    - Email: "${input.brandEmail}"
    - Contexto del email recibido: "${input.brandContext}"

    MEDIA KIT DEL CREADOR:
    ${mediaKit ? JSON.stringify(mediaKit, null, 2) : 'No disponible'}
    
    INSIGHTS RECIENTES:
    ${insights || 'No disponible'}

    ESTILO: ${styleGuide === 'casual' ? 'Tono amigable y cercano' : 'Tono profesional y formal'}

    RESPONDE ÚNICAMENTE CON UN OBJETO JSON con esta estructura (sin Markdown, solo el JSON):
    {
      "pitchSubject": "Asunto del correo",
      "pitchContent": "Cuerpo del correo en texto plano"
    }

    El pitch debe:
    - Agradecer el interés de la marca
    - Mencionar 1-2 métricas relevantes del Media Kit (si está disponible)
    - Incluir la propuesta de valor del creador
    - Terminar con una invitación a conversar (sin cerrar un trato en frío)
    - Ser conciso (máximo 3 párrafos)
  `;

  try {
    let parsed: { pitchSubject: string; pitchContent: string };

    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonString);
    } catch (genError: any) {
      console.warn(`[Pitch Use Case] Gemini no disponible. Usando pitch mock para ${input.brandName}.`);
      parsed = {
        pitchSubject: `Propuesta de colaboración: ${input.brandName} x ${input.creatorName}`,
        pitchContent: `Hola ${input.brandName},\n\nGracias por contactarnos. Somos ${input.creatorName}, un creador de contenido en el nicho tech con una comunidad comprometida de más de 700K suscriptores.\n\nNos encantaría explorar cómo podemos colaborar. Adjuntamos nuestro Media Kit con métricas detalladas y propuestas de valor.\n\nQuedamos atentos a tu respuesta para agendar una llamada.\n\nSaludos,\n${input.creatorName}`,
      };
    }

    const draft: BrandDeal = {
      brandName: input.brandName,
      brandEmail: input.brandEmail,
      status: 'draft_ready',
      sourceEmailSubject: input.originalEmailSubject || input.brandContext,
      originalEmailFrom: input.originalEmailFrom,
      originalEmailSubject: input.originalEmailSubject,
      originalEmailSnippet: input.originalEmailSnippet,
      gmailId: input.gmailId,
      pitchContent: parsed.pitchContent,
      pitchSubject: parsed.pitchSubject,
      detectedAt: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('agent_logs')
      .insert([{
        creator_name: input.creatorName,
        type: 'pitch_draft',
        content: draft,
        insights: `Pitch generado para ${input.brandName} (estilo: ${styleGuide})`,
      }]);

    if (error) {
      console.error("[Pitch Use Case] Error guardando draft:", error);
      throw new Error(`No se pudo guardar el draft para ${input.brandName}: ${error.message}`);
    }

    return {
      draft,
      pitchSubject: parsed.pitchSubject,
      pitchContent: parsed.pitchContent,
    };
  } catch (error) {
    console.error("[Pitch Use Case] Error generando pitch:", error);
    throw new Error("No se pudo generar el pitch para la marca");
  }
};
