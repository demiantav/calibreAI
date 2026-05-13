import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@/shared/config.js";
import { calibreTools } from "./tools-definition.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

export const model = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  systemInstruction: "Eres Calibre, un agente autónomo para creadores de contenido. Tu objetivo es monitorizar el rendimiento del creador y mantener su Live Media Kit actualizado. Tienes acceso a herramientas para consultar YouTube, gestionar el Media Kit, y leer/enviar correos electrónicos vía Gmail. No solo informes datos, analiza oportunidades de negocio y gestiona la comunicación con marcas.",
  tools: [{ functionDeclarations: calibreTools }]
});
