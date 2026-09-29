import { readFileSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const skillPath = new URL("../skills/genie/SKILL.md", import.meta.url);
const skill = readFileSync(skillPath, "utf8");

function createServer() {
  const server = new McpServer(
    {
      name: "genie",
      version: "0.2.0",
    },
    {
      instructions:
        "Genie is a chat-native guessing game. Use the genie skill resource and play naturally in the conversation.",
    },
  );

  server.registerResource(
    "genie-skill",
    "genie://skill",
    {
      title: "Genie Skill",
      description: "Canonical Genie guessing-game instructions.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: skill }],
    }),
  );

  server.registerTool(
    "genie_start",
    {
      title: "Start Genie",
      description: "Start a fresh Genie guessing game with its native opening.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false, idempotentHint: true },
    },
    async () => ({
      content: [{
        type: "text",
        text: "🧞 **GENIE**\nPiensa en cualquier cosa. No me la digas.\nCuando estés listo, dime **listo**. 😈",
      }],
    }),
  );

  server.registerPrompt(
    "play_genie",
    {
      title: "Play Genie",
      description: "Start a fresh Genie round using the canonical skill.",
    },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "Use the genie://skill resource and start a fresh Genie round now.",
        },
      }],
    }),
  );

  return server;
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (!["POST", "GET", "DELETE"].includes(req.method)) {
    res.writeHead(405).end("Method Not Allowed");
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    void transport.close();
    void server.close();
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("MCP request error:", error);
    if (!res.headersSent) res.writeHead(500).end("Internal server error");
  }
}
