import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { gmail, oAuth2Client } from "../../../infrastructure/gmail/gmail-client.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";

// Intercept stdout to prevent non-JSON output from contaminating MCP JSON-RPC protocol
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
process.stdout.write = ((chunk: any, ...args: any[]) => {
  const str = typeof chunk === 'string' ? chunk : chunk.toString();
  if (str.trim().startsWith('{') || str.trim().startsWith('"')) {
    return originalStdoutWrite(str, ...args);
  }
  process.stderr.write('[MCP] ' + str);
  return true;
}) as typeof process.stdout.write;

const server = new McpServer({
  name: "gmail-mcp-server",
  version: "1.0.0",
});

// Función para cargar tokens desde Supabase, autorizar el cliente y refrescar si expiró
async function ensureAuthenticated() {
  const { data, error } = await supabase
    .from('user_auth')
    .select('*')
    .eq('user_email', 'tavolarodemian06@gmail.com')
    .single();

  if (error || !data) throw new Error("No autenticado. Ejecuta /auth/login");
  
  oAuth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });

  // Refrescar token si está expirado o próximo a expirar
  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  if (Date.now() >= expiresAt - 60000) {
    console.log('[MCP] Token expirado, refrescando...');
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);

    await supabase.from('user_auth').upsert({
      user_email: 'tavolarodemian06@gmail.com',
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || data.refresh_token,
      expires_at: new Date(Date.now() + (credentials.expiry_date || 3600 * 1000)).toISOString(),
    });
    console.log('[MCP] Token refrescado y persistido en Supabase.');
  }
}

server.tool(
  "list_emails",
  "Lista los últimos correos recibidos",
  { maxResults: z.number().default(5) },
  async ({ maxResults }) => {
    await ensureAuthenticated();
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults: maxResults,
    });

    const messages = response.data.messages || [];
    const details = await Promise.all(
      messages.map(async (msg) => {
        const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id! });
        return {
          id: msg.id,
          snippet: detail.data.snippet,
          subject: detail.data.payload?.headers?.find(h => h.name === 'Subject')?.value
        };
      })
    );

    return {
      content: [{ type: "text", text: JSON.stringify(details, null, 2) }],
    };
  }
);

server.tool(
  "send_email",
  "Envía un correo electrónico desde la cuenta del creador",
  {
    to: z.string().email(),
    subject: z.string(),
    body: z.string(),
  },
  async ({ to, subject, body }) => {
    await ensureAuthenticated();

    function encodeHeader(text: string): string {
      if (/^[\x00-\x7F]*$/.test(text)) return text;
      const bytes = Buffer.from(text, 'utf-8');
      return `=?UTF-8?B?${bytes.toString('base64')}?=`;
    }

    const utf8Bytes = Buffer.from(
      `To: ${to}\r\nSubject: ${encodeHeader(subject)}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
      'utf-8'
    );
    const encodedMessage = utf8Bytes.toString('base64url');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    return {
      content: [{ type: "text", text: JSON.stringify({ success: true, to, subject }) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
