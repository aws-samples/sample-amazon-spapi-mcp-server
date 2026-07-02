import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createApplicationManagementTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_application_rotate_client_secret",
      description:
        "⚠️ DESTRUCTIVE: Credential rotation — Rotates the client secret for an SP-API application. This operation generates a new client secret and permanently invalidates the current one after a short grace period. WARNING: After rotation, all systems using the old secret will lose access until updated with the new secret. Returns the new client secret value. Rate limit: 0.0167 requests/sec.",
      scope: "shared",
      apiDomain: "application-management",
      inputSchema: {},
      handler: async () => {
        const response = await client.post(
          "/applications/2023-11-30/clientSecret",
          {},
          "application-management"
        );
        return response.data;
      },
    },
  ];
}
