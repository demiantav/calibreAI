import { model } from "../reasoning/gemini-client.js";
import { executeToolCall } from "../reasoning/tool-executor.js";

export const runPulseCheck = async () => {
  console.log("[Calibre] Iniciando ciclo de razonamiento autónomo...");

  const TEST_CHANNEL_ID = "UC8LeXCWOalN8SxlrPcG-PaQ"; // midudev
  
  // Iniciamos un chat con el agente
  const chat = model.startChat();

  try {
    // 1. EL PROMPT INICIAL: No le damos datos, solo una instrucción
    const result = await chat.sendMessage(
      `Calibre, revisa el estado del creador con ID "${TEST_CHANNEL_ID}". 
       Si consideras que hay hitos importantes o que el Media Kit debe actualizarse, hazlo.`
    );

    let response = result.response;
    let functionCalls = response.functionCalls();

    // 2. EL BUCLE DE HERRAMIENTAS: Mientras Gemini quiera usar herramientas...
    while (functionCalls && functionCalls.length > 0) {
      const toolResults = [];

      for (const call of functionCalls) {
        // Ejecutamos la herramienta real en nuestro backend
        const result = await executeToolCall({ name: call.name, args: call.args });
        
        // Guardamos el resultado para devolvérselo a Gemini
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result }
          }
        });
      }

      // Le devolvemos los datos a Gemini para que siga razonando
      const nextStep = await chat.sendMessage(toolResults);
      response = nextStep.response;
      functionCalls = response.functionCalls();
    }

    // 3. RESPUESTA FINAL: Lo que el agente decidió hacer
    console.log("\n--- DECISIÓN FINAL DEL AGENTE ---");
    console.log(response.text());
    console.log("---------------------------------\n");

  } catch (error) {
    console.error("[Calibre] Error en el bucle autónomo:", error);
  }
};
