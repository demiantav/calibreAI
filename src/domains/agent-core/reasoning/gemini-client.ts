import { GoogleGenerativeAI, ChatSession, GenerateContentRequest, GenerateContentResult } from "@google/generative-ai";
import PQueue from "p-queue";
import { config } from "@/shared/config.js";
import { calibreTools } from "./tools-definition.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const baseModel = genAI.getGenerativeModel({ 
  model: "gemini-3.1-flash-lite",
  systemInstruction: "Eres Calibre, un agente autónomo para creadores de contenido. Tu objetivo es monitorizar el rendimiento del creador y mantener su Live Media Kit actualizado. Tienes acceso a herramientas para consultar YouTube, gestionar el Media Kit, leer/enviar correos electrónicos vía Gmail, y generar pitches personalizados para marcas. Cuando revises el email del creador y encuentres correos de marcas potenciales, usa generateAndDraftPitch para crear un borrador de respuesta personalizado. No envías los pitches automáticamente, solo generas los drafts.",
  tools: [{ functionDeclarations: calibreTools }]
});

// ── Request tracking ─────────────────────────────────────────────────────────
let requestCount = 0;
export const getGeminiStats = () => ({ totalRequests: requestCount, lastRequestAt: lastRequestTime ? new Date(lastRequestTime).toISOString() : null });

// ── Rate limiting queue ───────────────────────────────────────────────────
// Gemini Flash free tier: 60 RPM / 1,000 RPD
// We throttle to 1 concurrent request with a 1s minimum gap to stay well under limits.
const geminiQueue = new PQueue({ concurrency: 1 });
let lastRequestTime = 0;
const MIN_GAP_MS = 1000; // 1 second between requests

async function throttle<T>(fn: () => Promise<T>): Promise<T> {
  return geminiQueue.add(async () => {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_GAP_MS && lastRequestTime > 0) {
      const delay = MIN_GAP_MS - elapsed;
      console.log(`[Gemini Queue] Throttling ${delay}ms to respect rate limits`);
      await new Promise(r => setTimeout(r, delay));
    }
    requestCount++;
    lastRequestTime = Date.now();
    console.log(`[Gemini] Request #${requestCount} at ${new Date().toISOString()}`);
    return fn();
  });
}

export const model = {
  startChat: () => {
    const chat = baseModel.startChat();
    const originalSendMessage = chat.sendMessage.bind(chat);
    
    // Replace sendMessage with throttled version
    (chat as any).sendMessage = (message: any) => throttle(() => originalSendMessage(message));
    
    return chat;
  },
  generateContent: (request: string | GenerateContentRequest): Promise<GenerateContentResult> => {
    return throttle(() => baseModel.generateContent(request));
  }
};
