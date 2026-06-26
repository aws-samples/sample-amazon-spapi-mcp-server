import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createRateLimitStatusTool(client: SpApiClient): ToolDefinition {
  return {
    name: "spapi_rate_limit_status",
    description:
      "Get current rate limit status for all tracked API domains. Shows running and queued request counts per domain.",
    scope: "shared",
    apiDomain: "meta",
    inputSchema: {},
    handler: async () => {
      const status = client.getRateLimitStatus();

      return {
        domains: status,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
