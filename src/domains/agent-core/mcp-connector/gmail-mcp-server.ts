import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { gmail } from "../../../infrastructure/gmail/gmail-client.js";
import { ensureGmailAuth } from "../../../shared/gmail-auth.js";

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

server.tool(
  "list_emails",
  "Lista los últimos correos recibidos",
  { maxResults: z.number().default(5) },
  async ({ maxResults }) => {
    await ensureGmailAuth();
    
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
    await ensureGmailAuth();

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
