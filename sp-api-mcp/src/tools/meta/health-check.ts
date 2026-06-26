import { ToolDefinition } from "../base.js";
import { CredentialProvider } from "../../auth/interface.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createHealthCheckTool(
  credentialProvider: CredentialProvider,
  _client: SpApiClient
): ToolDefinition {
  return {
    name: "spapi_health_check",
    description:
      "Check the health of the SP-API MCP server connection. Verifies authentication status, token validity, and endpoint reachability.",
    scope: "shared",
    apiDomain: "meta",
    inputSchema: {},
    handler: async () => {
      const authHealth = await credentialProvider.healthCheck();

      return {
        status: authHealth.valid ? "healthy" : "unhealthy",
        authentication: {
          valid: authHealth.valid,
          expiresInSeconds: authHealth.expiresIn,
          error: authHealth.error,
        },
        timestamp: new Date().toISOString(),
      };
    },
  };
}
