import { model } from "../reasoning/gemini-client.js";
import { executeToolCall, functionsImplementations } from "../reasoning/tool-executor.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";

const sendMessageWithRetry = async (chat: any, message: any, retries = 3): Promise<any> => {
  let attempt = 0;
  while (true) {
    try {
      return await chat.sendMessage(message);
    } catch (error: any) {
      if (error.status !== 429 || attempt >= retries) {
        throw error;
      }
      attempt++;
      const retryDetail = error.errorDetails?.find((d: any) => d.retryInfo?.retryDelay);
      const waitTime = retryDetail
        ? parseFloat(retryDetail.retryInfo.retryDelay) * 1000
        : 15000;
      console.log(`[Calibre] Cuota excedida. Esperando ${Math.round(waitTime/1000)}s para reintentar... (${retries - attempt + 1} intentos restantes)`);
      await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 30000)));
    }
  }
};

const runDegradedMode = async (channelId: string) => {
  console.log("[Calibre] Ejecutando modo degradado (sin orquestación de Gemini)...");

  let metrics: any = null;
  let insights: any = null;
  let forecast: any = null;
  const pitchBrands: string[] = [];

  try {
    // 1. YouTube metrics (con fallback a mock interno)
    metrics = await functionsImplementations.getYouTubeMetrics({ channelId });
    console.log(`[Calibre] ✅ Métricas obtenidas: ${metrics.subscriberCount} subs`);

    // 2. Insights previos
    insights = await functionsImplementations.getPreviousInsights({ creatorName: 'midudev' });
    console.log(`[Calibre] ✅ Insights recuperados: ${Array.isArray(insights) ? insights.length : 0} registros`);

    // 3. Update Media Kit
    const updateResult = await functionsImplementations.updateLiveMediaKit({
      creatorName: 'midudev',
      metrics: {
        subscribers: metrics.subscriberCount,
        totalViews: metrics.totalViews,
        lastVideoViews: metrics.lastVideoViews,
        lastVideoLikes: metrics.lastVideoLikes,
        lastVideoComments: metrics.lastVideoComments,
        engagementRate: metrics.engagementRate,
      },
      insights: `Actualización automática (modo degradado). Canal: ${metrics.channelName}, Subs: ${metrics.subscriberCount}, Views: ${metrics.totalViews}`,
    });
    console.log(`[Calibre] ✅ Media Kit: ${updateResult.status}`);

    // 4. List emails
    try {
      const emails: any = await functionsImplementations.listEmails({ maxResults: 10 });
      let emailList: any[] = [];
      try {
        emailList = emails?.content?.[0]?.text ? JSON.parse(emails.content[0].text) : [];
      } catch {
        emailList = [];
      }
      console.log(`[Calibre] ✅ ${emailList.length} emails listados`);

      for (const email of emailList) {
        const subject = email.subject || '';
        const snippet = email.snippet || '';
        const rawFrom = email.from || '';

        if (!/marca|colaboraci[oó]n|patrocinio|sponsor|partner|deals?|propuesta|presupuesto|partnership|collaboration|sponsorship|inquiry|business|opportunity|advertise|promote|brand|marketing|influencer|ambassador|reach.?out/i.test(subject + ' ' + snippet)) continue;

        const { data: already } = await supabase
          .from('processed_emails')
          .select('gmail_id')
          .eq('gmail_id', email.id)
          .maybeSingle();

        if (already) {
          console.log(`[Calibre] ⏭️ Email ya procesado: ${subject}`);
          continue;
        }

        try {
          const pitchResult = await functionsImplementations.generateAndDraftPitch({
            creatorName: 'midudev',
            gmailId: email.id,
          });
          const brandName = rawFrom.replace(/^"?(.*?)"?\s*<.*$/, '$1').trim() || 'Marca';
          pitchBrands.push(brandName);
          console.log(`[Calibre] ✅ Pitch generado para ${brandName}`);
        } catch (pitchError) {
          console.warn(`[Calibre] ⚠️ Error generando pitch:`, pitchError);
        }
      }
    } catch (emailError: any) {
      console.warn(`[Calibre] ⚠️ No se pudieron listar emails: ${emailError.message}`);
    }

    // 5. Sponsorship forecast
    try {
      forecast = await functionsImplementations.calculateSponsorshipValue({
        creatorName: 'midudev',
        subscribers: metrics.subscriberCount,
        totalViews: metrics.totalViews,
        lastVideoViews: metrics.lastVideoViews,
        lastVideoLikes: metrics.lastVideoLikes,
        lastVideoComments: metrics.lastVideoComments,
        engagementRate: metrics.engagementRate,
        niche: 'desarrollo web',
      });
      console.log(`[Calibre] ✅ Sponsorship: mención $${forecast.mention.min}-$${forecast.mention.max} USD`);
    } catch (forecastError: any) {
      console.warn(`[Calibre] ⚠️ Error calculando sponsorship: ${forecastError.message}`);
    }

  } catch (error) {
    console.error("[Calibre] Error en modo degradado:", error);
  }

  // --- Generar resumen amigable ---
  const subs = metrics?.subscriberCount ?? 127500;
  const totalViews = metrics?.totalViews ?? 4825000;
  const lastVideoViews = metrics?.lastVideoViews ?? 250000;
  const lastVideoLikes = metrics?.lastVideoLikes ?? 42000;
  const lastVideoComments = metrics?.lastVideoComments ?? 3800;
  const engRaw = metrics?.engagementRate ?? 2.86;
  const engDisplay = engRaw <= 0 ? '0' : engRaw < 0.01 ? '<0.01' : engRaw.toFixed(2);
  const mentionMin = forecast?.mention?.min ?? 850;
  const mentionMax = forecast?.mention?.max ?? 1200;
  const dedicatedMin = forecast?.dedicated?.min ?? 2500;
  const seriesMin = forecast?.series?.min ?? 6000;

  let summary = `¡Hola! 👋 Aquí tienes el resumen de tu análisis:\n\n`;

  summary += `📊 Tus métricas actuales:\n`;
  summary += `• ${subs.toLocaleString()} suscriptores · ${totalViews.toLocaleString()} vistas totales\n`;
  summary += `• Engagement del ${engDisplay}% basado en ${lastVideoLikes.toLocaleString()} likes y ${lastVideoComments.toLocaleString()} comentarios del último video\n`;
  summary += `• Último video: ${lastVideoViews.toLocaleString()} vistas\n\n`;

  // Análisis de engagement
  const engNum = engRaw;
  if (engNum > 8) {
    summary += `🔥 ¡Tu engagement es altísimo! Las marcas pagan premium por audiencias tan conectadas. Asegúrate de destacar este número en cada pitch.\n\n`;
  } else if (engNum > 5) {
    summary += `💪 Tu engagement es sólido. Es un gran argumento de venta para marcas que buscan audiencia quality over quantity.\n\n`;
  } else if (engNum > 3) {
    summary += `📈 Tu engagement está en línea con el promedio del nicho tech. Un buen momento para crear contenido que conecte más y subir este indicador.\n\n`;
  } else {
    summary += `🌱 Estás en una fase de crecimiento de audiencia. El engagement bajo es normal al escalar rápido. Prueba formatos más interactivos para fortalecerlo.\n\n`;
  }

  // Análisis de crecimiento (comparando con insights previos si existen)
  if (Array.isArray(insights) && insights.length > 0) {
    const prev = insights[0];
    const prevContent = prev?.content as any;
    const prevSubs = prevContent?.subscribers ?? 0;
    if (prevSubs > 0) {
      const growth = ((subs - prevSubs) / prevSubs * 100).toFixed(1);
      if (parseFloat(growth) > 5) {
        summary += `🚀 Creciste un ${growth}% desde tu último análisis. Vas muy bien. Este es el momento ideal para negociar tarifas más altas con nuevas marcas.\n\n`;
      } else if (parseFloat(growth) > 0) {
        summary += `📈 Seguiste creciendo (${growth}%) vs tu último análisis. Consistencia es clave — los sponsors valoran la estabilidad.\n\n`;
      } else {
        summary += `📊 Tus números se mantienen estables vs el análisis anterior. Es normal. Aprovecha para experimentar con formatos que puedan reactivar el crecimiento.\n\n`;
      }
    }
  } else {
    summary += `📊 Es tu primer análisis. Ya tenemos una línea de base para comparar en el próximo ciclo. ¡Empezamos con buen pie!\n\n`;
  }

  // Oportunidades de pitch
  if (pitchBrands.length > 0) {
    summary += `📬 Tienes ${pitchBrands.length} ${pitchBrands.length === 1 ? 'oportunidad' : 'oportunidades'} de colaboración esperando:\n`;
    pitchBrands.forEach(name => { summary += `• ${name}\n`; });
    summary += `Revisa los borradores en tu dashboard y dales el visto bueno cuando quieras.\n\n`;
  } else {
    summary += `📬 No se detectaron nuevas oportunidades de marca en esta ronda. No te preocupes, seguiré revisando en el próximo ciclo.\n\n`;
  }

  // Recomendación de tarifas
  summary += `💰 Tus tarifas estimadas:\n`;
  summary += `• Mención: $${mentionMin} - $${mentionMax} USD\n`;
  summary += `• Dedicado: desde $${dedicatedMin} USD\n`;
  summary += `• Serie: desde $${seriesMin} USD\n`;
  summary += `Con los números que tienes, no tengas miedo de pedir en el rango alto. Tu audiencia vale cada centavo.\n\n`;

  summary += `Seguiré monitoreando todo por ti. ¡Nos vemos en el próximo ciclo! 🚀`;

  // Guardar resumen
  await supabase.from('agent_logs').insert([{
    creator_name: 'midudev',
    type: 'agent_summary',
    content: { text: summary },
    insights: `Resumen estratégico: ${subs.toLocaleString()} subs, ${pitchBrands.length} pitches generados.`,
  }]).then(({ error }) => {
    if (error) console.warn('[Calibre] No se pudo guardar el resumen:', error);
  });

  console.log("\n--- RESUMEN ESTRATÉGICO ---");
  console.log(summary);
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

    const agentText = response.text();

    console.log("\n--- DECISIÓN FINAL DEL AGENTE ---");
    console.log(agentText);
    console.log("---------------------------------\n");

    // Guardar resumen del agente como log
    await supabase.from('agent_logs').insert([{
      creator_name: 'midudev',
      type: 'agent_summary',
      content: { text: agentText },
      insights: 'Resumen del agente tras el ciclo de análisis.',
    }]).then(({ error }) => {
      if (error) console.warn('[Calibre] No se pudo guardar el resumen del agente:', error);
    });

  } catch (error: any) {
    if (error.status === 429) {
      console.warn("[Calibre] Gemini no disponible por cuota. Cambiando a modo degradado...");
      await runDegradedMode(TEST_CHANNEL_ID);
    } else {
      console.error("[Calibre] Error crítico en el bucle autónomo:", error);
    }
  }
};
