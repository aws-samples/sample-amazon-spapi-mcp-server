import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ToolRegistry } from "../tools/registry.js";
import { SpApiError } from "../clients/errors.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("stdio-transport");

/**
 * Creates and starts an MCP server using stdio transport (local mode).
 */
export async function startStdioServer(
  registry: ToolRegistry,
  serverName: string,
  version: string
): Promise<void> {
  const server = new Server(
    { name: serverName, version },
    { capabilities: { tools: {} } }
  );

  // Handle tools/list
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools = registry.getMcpToolList();
    logger.info(`tools/list: returning ${tools.length} tools`);
    return { tools };
  });

  // Handle tools/call
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    logger.info(`tools/call: ${name}`);

    const tool = registry.getTool(name);
    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              category: "not_found",
              code: "TOOL_NOT_FOUND",
              message: `Tool '${name}' not found or not available for current account type.`,
              suggestedAction: "Use spapi_get_config to see available tools and current account type.",
            }),
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.handler(args || {});
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (err) {
      const error = err as SpApiError | Error;

      if ("category" in error) {
        // Structured SP-API error
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(error, null, 2),
            },
          ],
          isError: true,
        };
      }

      // Unexpected error
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: true,
              category: "unknown",
              code: "INTERNAL_ERROR",
              message: error.message,
              suggestedAction: "Check server logs for details. This may be a transient issue.",
            }),
          },
        ],
        isError: true,
      };
    }
  });

  // Start transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info(`SP-API MCP Server started (stdio mode, ${registry.getVisibleCount()} tools)`);
}
