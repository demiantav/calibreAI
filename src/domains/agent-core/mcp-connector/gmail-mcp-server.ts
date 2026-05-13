import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { gmail, oAuth2Client } from "../../../infrastructure/gmail/gmail-client.js";
import { supabase } from "../../../infrastructure/supabase/supabase-client.js";

const server = new McpServer({
  name: "gmail-mcp-server",
  version: "1.0.0",
});

// Función para cargar tokens desde Supabase y autorizar el cliente
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

    const utf8Bytes = Buffer.from(
      `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`,
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
