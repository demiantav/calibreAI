import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./shared/config.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.GEMINI_API_KEY}`);
    const data = await response.json();
    
    console.log("--- MODELOS DISPONIBLES ---");
    if (data.models) {
      data.models.forEach((m: any) => console.log("- " + m.name));
    } else {
      console.log("No se encontraron modelos. Respuesta de la API:", data);
    }
    console.log("---------------------------");
  } catch (error) {
    console.error("Error al listar modelos:", error);
  }
}

listModels();
