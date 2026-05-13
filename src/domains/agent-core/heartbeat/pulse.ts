import { model } from "../reasoning/gemini-client.js";
import { executeToolCall, functionsImplementations } from "../reasoning/tool-executor.js";

const sendMessageWithRetry = async (chat: any, message: any, retries = 3): Promise<any> => {
  try {
    return await chat.sendMessage(message);
  } catch (error: any) {
    if (error.status === 429 && retries > 0) {
      const retryDetail = error.errorDetails?.find((d: any) => d.retryInfo?.retryDelay);
      const waitTime = retryDetail
        ? parseFloat(retryDetail.retryInfo.retryDelay) * 1000
        : 15000;
      console.log(`[Calibre] Cuota excedida. Esperando ${Math.round(waitTime/1000)}s para reintentar... (${retries} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 30000)));
      return sendMessageWithRetry(chat, message, retries - 1);
    }
    throw error;
  }
};

const runDegradedMode = async (channelId: string) => {
  console.log("[Calibre] Ejecutando modo degradado (sin orquestación de Gemini)...");
  const results: string[] = [];

  // 1. YouTube metrics (con fallback a mock interno)
  try {
    const metrics = await functionsImplementations.getYouTubeMetrics({ channelId });
    results.push(`📊 ${metrics.channelName}: ${metrics.subscriberCount.toLocaleString()} subs, ${metrics.totalViews.toLocaleString()} views`);
    console.log(`[Calibre] ✅ Métricas obtenidas: ${metrics.subscriberCount} subs`);

    // 2. Insights previos
    const insights = await functionsImplementations.getPreviousInsights({ creatorName: 'midudev' });
    results.push(`📝 Insights previos: ${Array.isArray(insights) ? insights.length : 0} registros`);
    console.log(`[Calibre] ✅ Insights recuperados`);

    // 3. Update Media Kit
    const updateResult = await functionsImplementations.updateLiveMediaKit({
      creatorName: 'midudev',
      metrics: { subscribers: metrics.subscriberCount, totalViews: metrics.totalViews, lastVideoViews: metrics.lastVideoViews },
      insights: `Actualización automática (modo degradado). Canal: ${metrics.channelName}, Subs: ${metrics.subscriberCount}, Views: ${metrics.totalViews}`,
    });
    results.push(`📋 Media Kit: ${updateResult.status}`);
    console.log(`[Calibre] ✅ Media Kit actualizado`);

    // 4. List emails (con manejo de error si MCP no está disponible)
    try {
      const emails: any = await functionsImplementations.listEmails({ maxResults: 5 });
      const emailList = emails?.content?.[0]?.text ? JSON.parse(emails.content[0].text) : [];
      results.push(`📧 ${emailList.length} emails revisados`);
      console.log(`[Calibre] ✅ ${emailList.length} emails listados`);

      // 5. Para cada email que parezca de marca, generar pitch
      for (const email of emailList) {
        const subject = email.subject || '';
        const snippet = email.snippet || '';
        if (/marca|colaboraci[oó]n|patrocinio|sponsor|partner|deals?|propuesta|presupuesto/i.test(subject + ' ' + snippet)) {
          try {
            const brandName = subject.split(/[-–—]/)[0]?.trim() || email.from || 'Marca detectada';
            const brandEmail = email.from || 'unknown@email.com';
            const pitchResult = await functionsImplementations.generateAndDraftPitch({
              creatorName: 'midudev',
              brandName,
              brandEmail,
              brandContext: `${subject}: ${snippet}`,
            });
            results.push(`🎯 Pitch generado para: ${brandName}`);
            console.log(`[Calibre] ✅ Pitch generado para ${brandName}`);
          } catch (pitchError) {
            console.warn(`[Calibre] ⚠️ No se pudo generar pitch para un email:`, pitchError);
          }
        }
      }
    } catch (emailError: any) {
      console.warn(`[Calibre] ⚠️ No se pudieron listar emails: ${emailError.message}`);
      results.push(`📧 Emails: no disponibles (${emailError.message})`);
    }

    // 6. Sponsorship forecast
    try {
      const forecast = await functionsImplementations.calculateSponsorshipValue({
        creatorName: 'midudev',
        subscribers: metrics.subscriberCount,
        totalViews: metrics.totalViews,
        lastVideoViews: metrics.lastVideoViews,
        niche: 'desarrollo web',
      });
      results.push(`💰 Sponsorship: mención $${forecast.mention.min}-$${forecast.mention.max} USD`);
      console.log(`[Calibre] ✅ Sponsorship calculado: mención $${forecast.mention.min}-$${forecast.mention.max}`);
    } catch (forecastError: any) {
      console.warn(`[Calibre] ⚠️ No se pudo calcular sponsorship: ${forecastError.message}`);
    }

  } catch (error) {
    console.error("[Calibre] Error en modo degradado:", error);
  }

  console.log("\n--- RESUMEN MODO DEGRADADO ---");
  results.forEach(r => console.log(r));
  console.log("---------------------------------\n");
};

export const runPulseCheck = async () => {
  console.log("[Calibre] Iniciando ciclo de razonamiento autónomo (con auto-retry)...");

  const TEST_CHANNEL_ID = "UC8LeXCWOalN8SxlrPcG-PaQ"; // midudev
  const chat = model.startChat();

  try {
    const result = await sendMessageWithRetry(chat, 
      `Calibre, revisa el estado del creador con ID "${TEST_CHANNEL_ID}". 
       PASOS OBLIGATORIOS:
       1. Consulta YouTube para ver las métricas actuales.
       2. Usa "getPreviousInsights" para ver qué analizaste la última vez de este creador.
       3. Compara ambos datos. Si hay un crecimiento notable o un cambio de tendencia, menciónalo.
       4. Si el progreso es positivo, llama a "updateLiveMediaKit" para reflejar los nuevos hitos.
       5. Revisa los emails entrantes con "listEmails". Si encuentras correos de marcas o posibles colaboraciones, usa "generateAndDraftPitch" para crear un borrador de respuesta personalizado.
       6. Calcula el sponsorship value con "calculateSponsorshipValue" usando las métricas obtenidas y el nicho del creador (ej: "desarrollo web"). Esto estima las tarifas de patrocinio actuales.`
    );

    let response = result.response;
    let functionCalls = response.functionCalls();

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

  } catch (error: any) {
    if (error.status === 429) {
      console.warn("[Calibre] Gemini no disponible por cuota. Cambiando a modo degradado...");
      await runDegradedMode(TEST_CHANNEL_ID);
    } else {
      console.error("[Calibre] Error crítico en el bucle autónomo:", error);
    }
  }
};
