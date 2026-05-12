import { model } from "../reasoning/gemini-client.js";
import { executeToolCall } from "../reasoning/tool-executor.js";

/**
 * Función auxiliar para reintentar peticiones a Gemini si hay error de cuota (429).
 */
const sendMessageWithRetry = async (chat: any, message: any, retries = 3): Promise<any> => {
  try {
    return await chat.sendMessage(message);
  } catch (error: any) {
    if (error.status === 429 && retries > 0) {
      // Intentamos obtener el tiempo de espera del error, o usamos 15 segundos por defecto
      const waitTime = error.errorDetails?.[0]?.retryInfo?.retryDelay 
        ? parseInt(error.errorDetails[0].retryInfo.retryDelay) * 1000 
        : 15000;
      
      console.log(`[Calibre] Cuota excedida. Esperando ${waitTime/1000}s para reintentar... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return sendMessageWithRetry(chat, message, retries - 1);
    }
    throw error;
  }
};

export const runPulseCheck = async () => {
  console.log("[Calibre] Iniciando ciclo de razonamiento autónomo (con auto-retry)...");

  const TEST_CHANNEL_ID = "UC8LeXCWOalN8SxlrPcG-PaQ"; // midudev
  const chat = model.startChat();

  try {
    // 1. EL PROMPT INICIAL
    const result = await sendMessageWithRetry(chat, 
      `Calibre, revisa el estado del creador con ID "${TEST_CHANNEL_ID}". 
       PASOS OBLIGATORIOS:
       1. Consulta YouTube para ver las métricas actuales.
       2. Usa "getPreviousInsights" para ver qué analizaste la última vez de este creador.
       3. Compara ambos datos. Si hay un crecimiento notable o un cambio de tendencia, menciónalo.
       4. Si el progreso es positivo, llama a "updateLiveMediaKit" para reflejar los nuevos hitos.`
    );

    let response = result.response;
    let functionCalls = response.functionCalls();

    // 2. EL BUCLE DE HERRAMIENTAS
    while (functionCalls && functionCalls.length > 0) {
      const toolResults = [];

      for (const call of functionCalls) {
        const result = await executeToolCall({ name: call.name, args: call.args });
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result }
          }
        });
      }

      const nextStep = await sendMessageWithRetry(chat, toolResults);
      response = nextStep.response;
      functionCalls = response.functionCalls();
    }

    console.log("\n--- DECISIÓN FINAL DEL AGENTE ---");
    console.log(response.text());
    console.log("---------------------------------\n");

  } catch (error) {
    console.error("[Calibre] Error crítico en el bucle autónomo:", error);
  }
};
