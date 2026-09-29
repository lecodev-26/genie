import { readFileSync } from "node:fs";
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

const skillPath = new URL("../skills/genie/SKILL.md", import.meta.url);
const skill = readFileSync(skillPath, "utf8");

const handler = createMcpHandler(() => {
  const server = new McpServer(
    {
      name: "genie",
      version: "0.2.0",
      description: "Genie is a chat-native guessing game driven by an adaptive SKILL.md.",
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    },
  );

  server.registerResource(
    "genie-skill",
    "genie://skill",
    {
      title: "Genie Skill",
      description: "The canonical Genie guessing-game instructions.",
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
      description: "Returns the exact native opening message for a new Genie round.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async () => ({
      content: [{
        type: "text",
        text: "🧞 **GENIE**\nPiensa en cualquier cosa. No me la digas.\nCuando estés listo, dime **listo**. 😈",
      }],
    }),
  );

  server.registerTool(
    "genie_get_skill",
    {
      title: "Get Genie Skill",
      description: "Returns the canonical SKILL.md so an MCP client can load the game's rules.",
      inputSchema: z.object({}),
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
    },
    async () => ({
      content: [{ type: "text", text: skill }],
    }),
  );

  server.registerPrompt(
    "play_genie",
    {
      title: "Play Genie",
      description: "Start a fresh Genie guessing game using the canonical skill.",
    },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "Use the Genie Skill from the genie://skill resource and start a fresh round now. Follow its native chat UX exactly.",
        },
      }],
    }),
  );

  return server;
});

export default handler;
