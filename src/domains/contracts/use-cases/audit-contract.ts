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

// ── Abusive clause patterns (keywords + contextual suggestions) ───────────
const ABUSIVE_PATTERNS: { keyword: string; suggestion: string }[] = [
  { keyword: 'exclusividad perpetua', suggestion: 'Negocia un límite temporal (ej. 6-12 meses) y ámbito geográfico claro.' },
  { keyword: 'exclusividad sin límite', suggestion: 'Exige definir categoría, territorio y duración máxima de exclusividad.' },
  { keyword: 'derechos de imagen ilimitados', suggestion: 'Limita el uso de imagen a la campaña específica y plazo definido.' },
  { keyword: 'derechos de imagen perpetuos', suggestion: 'Negocia derechos por tiempo limitado (1-2 años) con opción de renovación.' },
  { keyword: 'penalización por no publicar', suggestion: 'Asegúrate de que las penalizaciones sean proporcionales y solo por incumplimiento grave.' },
  { keyword: 'no compete', suggestion: 'Si es exclusividad, exige compensación mensual garantizada por el período.' },
  { keyword: 'relación laboral', suggestion: 'Verifica que el contrato sea de prestación de servicios, no de empleo.' },
  { keyword: 'empleado', suggestion: 'Rechaza cláusulas que te clasifiquen como empleado; debe ser independiente.' },
  { keyword: 'transferencia de derechos', suggestion: 'Mantén la titularidad de tu contenido; cede solo licencia de uso limitada.' },
  { keyword: 'cesión total', suggestion: 'No cedas todos los derechos; negocia licencia no exclusiva y temporal.' },
  { keyword: 'moral rights', suggestion: 'En jurisdicciones que lo permitan, conserva tus derechos morales sobre el contenido.' },
  { keyword: 'sin compensación', suggestion: 'Exige fee mínimo o contra-valor en producto/servicios con valor de mercado.' },
  { keyword: 'gratis', suggestion: 'Todo trabajo debe tener compensación; evita trabajar "a cambio de exposición" sin métricas claras.' },
  { keyword: 'sin pago', suggestion: 'El contrato debe especificar monto, moneda, método y fecha de pago.' },
  { keyword: 'pago diferido', suggestion: 'Negocia pago adelantado (50% al firmar, 50% al entregar) o net-15 como máximo.' },
  { keyword: 'net 90', suggestion: 'Reduce plazo de pago a net-30 o net-15; net-90 afecta tu flujo de caja.' },
  { keyword: 'net 60', suggestion: 'Solicita net-30; 60 días es estándar pero negociable.' },
  { keyword: 'unlimited revisions', suggestion: 'Limita revisiones a 2-3 rondas; revisiones ilimitadas dilatan entregas.' },
  { keyword: 'work for hire', suggestion: 'Evita "work for hire"; negocia licencia de uso con términos claros.' },
  { keyword: 'liquidated damages', suggestion: 'Verifica que las penalizaciones no sean desproporcionadas vs. el fee total.' },
  { keyword: 'indemnification', suggestion: 'Asegúrate de que la indemnización sea mutua y proporcional.' },
  { keyword: 'termination for convenience', suggestion: 'Exige cláusula de terminación con causa y pago por trabajo completado.' },
  { keyword: 'automatic renewal', suggestion: 'Elimina renovación automática; exige notificación previa de 30-60 días.' },
  { keyword: 'assignable', suggestion: 'Restringe la cesión del contrato a terceros sin tu consentimiento previo.' },
];

// ── Contract type detection ────────────────────────────────────────────────
function detectContractType(textLower: string): string {
  const typeKeywords: Record<string, string[]> = {
    patrocinio: ['sponsor', 'patrocinio', 'brand deal', 'paid partnership', 'endorsement', 'promoted'],
    colaboración: ['colaboración', 'collaboration', 'partnership', 'co-creation', 'joint venture'],
    exclusividad: ['exclusividad', 'exclusivity', 'exclusive', 'no compete', 'non-compete'],
    licencia: ['licencia', 'license', 'licensing', 'usage rights', 'rights grant'],
    afiliado: ['afiliado', 'affiliate', 'commission', 'referral', 'cpc', 'cpa'],
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    for (const kw of keywords) {
      if (textLower.includes(kw)) return type;
    }
  }
  return 'otro';
}

// ── Amount extraction ──────────────────────────────────────────────────────
function extractAmounts(text: string): number | null {
  // Match $X,XXX or $X,XXX.XX or X,XXX USD or €X,XXX
  const patterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|€|\$)/gi,
    /€[\d,]+(?:\.\d{2})?/g,
  ];

  const amounts: number[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const cleaned = m.replace(/[$€,\s]|USD|EUR/gi, '');
        const num = parseFloat(cleaned);
        if (!isNaN(num) && num > 100) amounts.push(num);
      }
    }
  }

  return amounts.length > 0 ? Math.max(...amounts) : null;
}

// ── Duration / date extraction ─────────────────────────────────────────────
function extractDuration(text: string): string | null {
  const durationPatterns = [
    /(\d+)\s*(month|months|mes|meses)/i,
    /(\d+)\s*(year|years|año|años)/i,
    /(\d+)\s*(week|weeks|semana|semanas)/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s*(?:to|hasta|through)\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ];

  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  return null;
}

// ── Party detection ────────────────────────────────────────────────────────
function detectParties(text: string): string[] {
  const parties: string[] = [];
  // "Between [Company] and [Creator]"
  const betweenMatch = text.match(/between\s+([^,\n(]+?)\s+and\s+([^,\n(]+)/i);
  if (betweenMatch) {
    const p1 = betweenMatch[1].trim().replace(/\s*\(.*/, '').trim();
    const p2 = betweenMatch[2].trim().replace(/\s*\(.*/, '').trim();
    if (p1) parties.push(p1);
    if (p2) parties.push(p2);
  }
  // "[Company] ("the Brand")" — only if not already captured
  const brandMatch = text.match(/([^\n]{3,50})\s*\(\s*["']?(?:the\s+)?(?:brand|company|client)["']?\s*\)/i);
  if (brandMatch) {
    const candidate = brandMatch[1].trim();
    const alreadyFound = parties.some(p => candidate.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(candidate.toLowerCase()));
    if (!alreadyFound) parties.push(candidate);
  }
  return parties;
}

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
    console.error(`[Contract Audit] Error detallado:`, error?.message || error, error?.stack || '');
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
  const suggestions: string[] = [];

  for (const pattern of ABUSIVE_PATTERNS) {
    if (textLower.includes(pattern.keyword)) {
      redFlags.push(`Posible cláusula abusiva detectada: "${pattern.keyword}"`);
      suggestions.push(pattern.suggestion);
    }
  }

  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)];

  // Estimate risk level
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  if (redFlags.length >= 4) riskLevel = 'high';
  else if (redFlags.length >= 2) riskLevel = 'medium';

  // Extract contract metadata
  const contractType = detectContractType(textLower);
  const estimatedFairRate = extractAmounts(contractText);
  const duration = extractDuration(contractText);
  const parties = detectParties(contractText);

  // Build contextual summary
  let summary = '';
  if (redFlags.length > 0) {
    summary = `Se detectaron ${redFlags.length} posibles cláusulas problemáticas en un contrato de tipo ${contractType}. Recomendamos negociación antes de firmar.`;
  } else {
    summary = `No se detectaron cláusulas obviamente abusivas en este contrato de tipo ${contractType}, pero siempre valida con un profesional.`;
  }
  if (duration) summary += ` Duración detectada: ${duration}.`;
  if (parties.length > 0) summary += ` Partes: ${parties.join(' y ')}.`;

  // Build contextual negotiation points
  const negotiationPoints: string[] = uniqueSuggestions.length > 0
    ? uniqueSuggestions
    : [
        'Solicita un fee mínimo garantizado por entrega, incluso si es colaboración.',
        'Limita el uso de tu imagen a la campaña específica y plazo definido.',
        'Exige plazo de pago de máximo 30 días tras entrega del contenido.',
      ];

  // Add amount-related suggestion if found
  if (estimatedFairRate) {
    negotiationPoints.push(
      `El contrato menciona $${estimatedFairRate.toLocaleString()}. Compara con tus tarifas de mercado y negocia si es inferior a tu CPM estimado.`
    );
  }

  // Add duration suggestion
  if (duration && textLower.includes('exclusividad')) {
    negotiationPoints.push(
      `Exclusividad por ${duration}: solicita compensación mensual garantizada durante todo el período.`
    );
  }

  return {
    riskLevel,
    redFlags,
    suggestedNegotiationPoints: negotiationPoints,
    estimatedFairRate,
    summary,
    contractType,
  };
}
