import { model } from '../../agent-core/reasoning/gemini-client.js';
import { supabase } from '../../../infrastructure/supabase/supabase-client.js';

export interface ContractAuditResult {
  riskLevel: 'low' | 'medium' | 'high';
  redFlags: string[];
  suggestedNegotiationPoints: string[];
  estimatedFairRate: number | null;
  summary: string;
  contractType: string;
}

interface AuditContractInput {
  contractText: string;
  creatorName: string;
  userId?: string;
}

const KNOWN_ABUSIVE_CLAUSES = [
  'exclusividad perpetua',
  'exclusividad sin límite',
  'derechos de imagen ilimitados',
  'derechos de imagen perpetuos',
  'penalización por no publicar',
  'no compete',
  'relación laboral',
  'empleado',
  'transferencia de derechos',
  'cesión total',
  'moral rights',
  'sin compensación',
  'gratis',
  'sin pago',
  'pago diferido',
  'net 90',
  'net 60',
];

export const auditContractUseCase = async (
  input: AuditContractInput
): Promise<ContractAuditResult> => {
  const prompt = `Eres un abogado especialista en contratos de la Creator Economy. Analiza el siguiente contrato de un creador de contenido y devuelve un análisis estructurado.

CREADOR: ${input.creatorName}

CONTRATO:
${input.contractText}

INSTRUCCIONES:
1. Identifica cláusulas abusivas o desfavorables
2. Evalúa el nivel de riesgo general (low/medium/high)
3. Sugiere puntos de negociación específicos
4. Estima un fee justo si el contrato menciona montos
5. Resume el tipo de contrato (patrocinio, colaboración, exclusividad, etc.)

RESPONDE ÚNICAMENTE CON UN OBJETO JSON (sin Markdown):
{
  "riskLevel": "low|medium|high",
  "redFlags": ["lista de cláusulas problemáticas con ubicación"],
  "suggestedNegotiationPoints": ["sugerencias concretas de cambio"],
  "estimatedFairRate": 2500,
  "summary": "resumen ejecutivo de 2-3 frases",
  "contractType": "patrocinio|colaboración|exclusividad|otro"
}

Reglas:
- "estimatedFairRate" debe ser un número en USD o null si no hay suficiente info
- "contractType" debe ser una de las opciones listadas o "otro"
- Sé específico en las red flags: menciona la sección/cláusula si es visible
`;

  let result: ContractAuditResult;

  try {
    const geminiResult = await model.generateContent(prompt);
    const response = await geminiResult.response;
    const text = response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonString) as ContractAuditResult;
    result = parsed;
  } catch (error: any) {
    console.warn(`[Contract Audit] Gemini no disponible. Usando análisis básico para ${input.creatorName}.`);
    result = fallbackAnalysis(input.contractText);
  }

  // Persist analysis
  const insertData: any = {
    creator_name: input.creatorName,
    type: 'contract_audit',
    content: result,
    insights: `Auditoría de contrato para ${input.creatorName}: ${result.redFlags.length} red flags, riesgo ${result.riskLevel}. ${result.summary}`,
  };
  if (input.userId) insertData.user_id = input.userId;

  const { error } = await supabase.from('agent_logs').insert([insertData]);
  if (error) {
    console.error('[Contract Audit] Error guardando auditoría:', error);
  }

  return result;
};

function fallbackAnalysis(contractText: string): ContractAuditResult {
  const textLower = contractText.toLowerCase();
  const redFlags: string[] = [];

  for (const clause of KNOWN_ABUSIVE_CLAUSES) {
    if (textLower.includes(clause)) {
      redFlags.push(`Posible cláusula abusiva detectada: "${clause}"`);
    }
  }

  // Estimate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (redFlags.length >= 4) riskLevel = 'high';
  else if (redFlags.length >= 2) riskLevel = 'medium';

  // Try to extract dollar amounts
  const dollarMatches = contractText.match(/\$[\d,]+/g);
  const estimatedFairRate = dollarMatches
    ? Math.max(...dollarMatches.map((m) => parseInt(m.replace(/[$,]/g, ''))))
    : null;

  return {
    riskLevel,
    redFlags,
    suggestedNegotiationPoints: redFlags.length > 0
      ? ['Revisa las cláusulas marcadas con un abogado antes de firmar']
      : ['El contrato parece estándar, pero siempre recomendamos revisión legal'],
    estimatedFairRate,
    summary: redFlags.length > 0
      ? `Se detectaron ${redFlags.length} posibles cláusulas problemáticas. Recomendamos negociación antes de firmar.`
      : 'No se detectaron cláusulas obviamente abusivas, pero siempre valida con un profesional.',
    contractType: 'otro',
  };
}
