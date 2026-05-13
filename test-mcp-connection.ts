import { spawn } from 'child_process';

// Lanzamos el servidor MCP
const server = spawn('npx', ['tsx', 'src/domains/agent-core/mcp-connector/gmail-mcp-server.ts']);

// Simulamos una comunicación con el servidor enviando un mensaje JSON-RPC simple
// Nota: MCP sobre stdio usa JSON-RPC
server.stdin.write(JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "test-client", version: "1.0" } }
}) + "\n");

server.stdout.on('data', (data) => {
  console.log(`[Respuesta MCP]: ${data.toString()}`);
});

server.stderr.on('data', (data) => {
  console.error(`[Error MCP]: ${data.toString()}`);
});
