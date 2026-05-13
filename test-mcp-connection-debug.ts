import { mcpManager } from './src/infrastructure/mcp/mcp-manager.js';

async function testMcpGmail() {
  console.log('--- Iniciando prueba de conexión MCP Gmail ---');
  try {
    // Esto disparará spawnServer() y el handshake
    console.log('Verificando inicialización...');
    await mcpManager.ensureInitialized();
    console.log('Inicialización completada.');

    console.log('Llamando a list_emails...');
    const result = await mcpManager.callTool('list_emails', { maxResults: 2 });
    console.log('Resultado obtenido:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('Error en la prueba MCP:', error);
  } finally {
    await mcpManager.shutdown();
  }
}

testMcpGmail();
