import { ToolDefinition } from "../base.js";
import { SpApiClient } from "../../clients/sp-api-client.js";

export function createApplicationManagementTools(client: SpApiClient): ToolDefinition[] {
  return [
    {
      name: "spapi_application_rotate_client_secret",
      description:
        "Rotate the client secret for an SP-API application. Returns a new client secret. The old secret remains valid for a short period. Rate limit: 0.0167 requests/sec. NOTE: Write operation — rotates credentials.",
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
