import { mcpManager } from "./src/infrastructure/mcp/mcp-manager.js";
import { writeFileSync } from 'fs';
import path from 'path';

async function runGmailTest() {
  try {
    console.log('[Test] Inicializando McpManager...');
    await mcpManager.ensureInitialized();
    console.log('[Test] McpManager inicializado.');

    console.log('[Test] Llamando a la herramienta list_emails...');
    const emails = await mcpManager.callTool('list_emails', { maxResults: 5 });
    console.log('[Test] Emails recibidos.');

    const logFilePath = path.resolve(process.cwd(), 'gmail-test-log.json');
    writeFileSync(logFilePath, JSON.stringify(emails, null, 2));
    console.log(`[Test] Resultados guardados en ${logFilePath}`);

  } catch (error) {
    console.error('[Test] Error durante la prueba de Gmail:', error);
  } finally {
    await mcpManager.shutdown();
    console.log('[Test] McpManager apagado.');
  }
}

runGmailTest();
