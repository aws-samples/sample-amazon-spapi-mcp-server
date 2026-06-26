import { ToolDefinition } from "../base.js";
import { ServerConfig } from "../../config/schema.js";
import { ToolRegistry } from "../registry.js";

export function createGetConfigTool(
  config: ServerConfig,
  registry: ToolRegistry
): ToolDefinition {
  return {
    name: "spapi_get_config",
    description:
      "Get the current SP-API MCP server configuration including account type, marketplace, and available API groups with tool counts. Never exposes credentials.",
    scope: "shared",
    apiDomain: "meta",
    inputSchema: {},
    handler: async () => {
      const counts = registry.getCountsByScope();

      // Explicitly construct a sanitized view — never spread the config object
      return {
        account_type: config.account_type,
        marketplace: {
          region: config.marketplace.region,
          marketplace_ids: config.marketplace.marketplace_ids,
        },
        options: {
          sandbox_mode: config.options.sandbox_mode ?? false,
          auto_paginate: config.options.auto_paginate ?? true,
          enable_rdt_for_pii: config.options.enable_rdt_for_pii ?? true,
          max_total_results: config.options.max_total_results ?? 1000,
        },
        tools: {
          total_visible: registry.getVisibleCount(),
          total_registered: registry.getTotalCount(),
          by_scope: counts,
        },
        enabled_api_groups: config.enabled_api_groups || "all",
      };
    },
  };
}
